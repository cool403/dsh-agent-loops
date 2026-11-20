/**
 * Agent loops — host half.
 *
 * Registers the `loopLedger` session-projection unit: a pure fold over the
 * committed Session log that records every agent loop (one `step/start` …
 * `step/end` iteration), the model calls and tool calls inside it, and the
 * prompts that entered it.
 *
 * The log is the only source of truth here: nothing is sampled, nothing is
 * timed from a clock, and a forked or resumed Session re-derives the same
 * ledger because `turn/start`, `step/start`, `assistant/message`,
 * `tool/call`, `tool/result`, `step/end`, and `turn/end` are durable.
 *
 * Bounds keep the whole-value wire payload small: prompt and tool-argument
 * text is clipped, at most a fixed number of prompts and tools are kept per
 * loop (overflow is counted, not dropped silently), and only the newest
 * `MAX_TURNS` tasks are retained.
 *
 * @module dsh-agent-loops
 */

/** Projection key served to the client through the session-projection seam. */
const PROJECTION_KEY = 'loopLedger'

/** Bump when the fold's state fields or semantics change (checkpoint invalidation). */
const STATE_VERSION = 1

/** Cap for a human prompt (`source.kind === 'user'`). */
const PROMPT_LIMIT = 1000
/** Cap for injected context (file notices, skill text, goal rounds, …). */
const CONTEXT_LIMIT = 260
/** Prompts retained per loop; the rest are counted in `overflowPrompts`. */
const MAX_PROMPTS = 5
/** Cap for one tool call's raw argument JSON. */
const TOOL_ARG_LIMIT = 140
/** Tool calls retained per loop; the rest are counted in `overflowTools`. */
const MAX_TOOLS = 40
/** Cap for the loop's answer preview. */
const REPLY_LIMIT = 220
/** Newest tasks retained; older ones are counted in `dropped`. */
const MAX_TURNS = 80

/** @param {unknown} value */
const isObject = value => typeof value === 'object' && value !== null && !Array.isArray(value)

/** Coerce an unverified numeric field to a non-negative finite number. */
const count = value => (typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : 0)

/**
 * Trim and cap one string for the wire value.
 * @param {unknown} value candidate text.
 * @param {number} limit maximum retained characters.
 * @returns {{ text: string, clipped: boolean }} the retained text and whether it was cut.
 */
function clip (value, limit) {
  if (typeof value !== 'string') return { text: '', clipped: false }
  const trimmed = value.trim()
  if (trimmed.length <= limit) return { text: trimmed, clipped: false }
  return { text: trimmed.slice(0, limit), clipped: true }
}

/**
 * Join the text blocks of message content, bounded by `limit`, and count images.
 * @param {unknown} content message content blocks.
 * @param {number} limit stop adding blocks past this length.
 * @returns {{ text: string, images: number }} the joined text and the image count.
 */
function joinText (content, limit) {
  let text = ''
  let images = 0
  if (Array.isArray(content)) {
    for (const block of content) {
      if (!isObject(block)) continue
      if (block.type === 'image') { images += 1; continue }
      if (block.type !== 'text' || typeof block.text !== 'string') continue
      if (text.length > limit) break
      text += text === '' ? block.text : `\n${block.text}`
    }
  }
  return { text, images }
}

/** Sum the text-block lengths of a message without joining them. */
function textLength (content) {
  let total = 0
  if (Array.isArray(content)) {
    for (const block of content) {
      if (isObject(block) && block.type === 'text' && typeof block.text === 'string') total += block.text.length
    }
  }
  return total
}

/**
 * One `user/message` event as a prompt row: its producer kind, bounded text,
 * whether the text was cut, and how many images it carried.
 * @param {unknown} message the event payload.
 * @returns {{ kind: string, text: string, clipped: boolean, images: number }} the prompt row.
 */
function promptOf (message) {
  const source = isObject(message) ? message.source : undefined
  const kind = isObject(source) && typeof source.kind === 'string' ? source.kind : 'unknown'
  const limit = kind === 'user' ? PROMPT_LIMIT : CONTEXT_LIMIT
  const joined = joinText(isObject(message) ? message.content : [], limit)
  const bounded = clip(joined.text, limit)
  return { kind, text: bounded.text, clipped: bounded.clipped, images: joined.images }
}

/** A fresh model-call accumulator for one loop. */
function emptyLlm () {
  return {
    calls: 0,
    retries: 0,
    messageAt: null,
    provider: null,
    model: null,
    inputTokens: 0,
    outputTokens: 0,
    cacheReadTokens: 0,
    cacheWriteTokens: 0,
  }
}

/** The newest task entry, or null before the first `turn/start`. */
function lastTurn (state) {
  return state.turns.length === 0 ? null : state.turns[state.turns.length - 1]
}

/** The newest loop entry of the newest task, or null. */
function lastStep (state) {
  const turn = lastTurn(state)
  if (turn === null || turn.steps.length === 0) return null
  return turn.steps[turn.steps.length - 1]
}

/**
 * Replace the newest task with `update`'s result, keeping every other array
 * reference intact. Returns the same state when `update` returns the same entry.
 */
function updateLastTurn (state, update) {
  const turn = lastTurn(state)
  if (turn === null) return state
  const next = update(turn)
  if (next === turn) return state
  const turns = state.turns.slice(0, -1)
  turns.push(next)
  return { ...state, turns }
}

/** Replace the newest loop of the newest task with `update`'s result. */
function updateLastStep (state, update) {
  return updateLastTurn(state, turn => {
    const step = turn.steps[turn.steps.length - 1]
    if (step === undefined) return turn
    const next = update(step)
    if (next === step) return turn
    const steps = turn.steps.slice(0, -1)
    steps.push(next)
    return { ...turn, steps }
  })
}

/** Whether an event's `{ turn, step }` addresses the newest loop. */
function addressesOpenStep (state, data) {
  const step = lastStep(state)
  if (step === null) return false
  return step.step === data.step && lastTurn(state)?.turn === data.turn
}

/**
 * Validate a fold state or a wire value. The projection registry only needs
 * `parse`, so this stays dependency-free instead of pulling a schema library
 * into the plugin's module graph.
 * @param {unknown} value candidate state.
 * @returns {unknown} the same value, when it is a well-formed ledger.
 */
function parseLedger (value) {
  if (!isObject(value) || !Array.isArray(value.turns)) {
    throw new TypeError('loopLedger: state must be an object carrying a turns array')
  }
  for (const turn of value.turns) {
    if (!isObject(turn) || typeof turn.turn !== 'number' || !Array.isArray(turn.steps)) {
      throw new TypeError('loopLedger: every turn needs a numeric turn and a steps array')
    }
    for (const step of turn.steps) {
      if (!isObject(step) || typeof step.step !== 'number') {
        throw new TypeError('loopLedger: every loop needs a numeric step')
      }
      if (!Array.isArray(step.prompts) || !Array.isArray(step.tools) || !isObject(step.llm)) {
        throw new TypeError('loopLedger: every loop needs prompts, tools, and llm fields')
      }
    }
  }
  return value
}

/** The `loopLedger` unit registered on `ctx.sessionProjections`. */
export const loopLedgerProjection = {
  key: PROJECTION_KEY,
  stateVersion: STATE_VERSION,
  stateSchema: { parse: parseLedger },
  init: () => ({
    turns: [],
    dropped: 0,
    inbox: [],
    route: null,
    systemChars: 0,
    open: null,
  }),
  apply: (state, event) => {
    switch (event.type) {
      case 'turn/start': {
        const turn = event.data.turn
        const previous = lastTurn(state)
        // A boundary that does not advance the turn number is a retried
        // marker: keep the standing task instead of duplicating it.
        if (previous !== null && turn <= previous.turn) return state
        const turns = state.turns.concat([{
          turn,
          at: event.time,
          endAt: null,
          reason: null,
          steps: [],
        }])
        let dropped = state.dropped
        while (turns.length > MAX_TURNS) {
          turns.shift()
          dropped += 1
        }
        return { ...state, turns, dropped, open: null }
      }

      case 'user/message': {
        const prompt = promptOf(event.data)
        const step = lastStep(state)
        const open = step !== null && step.endAt === null
        if (!open) {
          // Between loops (or before the first one): the next loop adopts it.
          return { ...state, inbox: state.inbox.concat([prompt]) }
        }
        return updateLastStep(state, current => {
          if (current.prompts.length >= MAX_PROMPTS) {
            return { ...current, overflowPrompts: current.overflowPrompts + 1 }
          }
          return { ...current, prompts: current.prompts.concat([prompt]) }
        })
      }

      case 'step/start': {
        const turn = lastTurn(state)
        if (turn === null || turn.turn !== event.data.turn) return state
        const prompts = state.inbox.slice(0, MAX_PROMPTS)
        const overflowPrompts = Math.max(0, state.inbox.length - prompts.length)
        const step = {
          step: event.data.step,
          at: event.time,
          endAt: null,
          prompts,
          overflowPrompts,
          tools: [],
          overflowTools: 0,
          llm: {
            ...emptyLlm(),
            provider: state.route === null ? null : state.route.provider,
            model: state.route === null ? null : state.route.model,
          },
          systemChars: state.systemChars,
          reply: '',
          replyClipped: false,
        }
        const steps = turn.steps.concat([step])
        const turns = state.turns.slice(0, -1)
        turns.push({ ...turn, steps })
        return { ...state, turns, inbox: [], open: { turn: turn.turn, step: step.step } }
      }

      case 'system/message': {
        // The latest rendered system prompt is the current head node; its size
        // is an indicator of what the model reads before the loop's prompt.
        const size = textLength(isObject(event.data.message) ? event.data.message.content : [])
        if (size === state.systemChars) return state
        if (state.open !== null) {
          return updateLastStep({ ...state, systemChars: size }, current => (
            current.systemChars === size ? current : { ...current, systemChars: size }
          ))
        }
        return { ...state, systemChars: size }
      }

      case 'request/context': {
        const next = { provider: event.data.provider ?? null, model: event.data.model ?? null }
        const current = state.route
        if (current !== null && current.provider === next.provider && current.model === next.model) return state
        return { ...state, route: next }
      }

      case 'request/header': {
        const config = isObject(event.data.header) ? event.data.header.config : undefined
        if (!isObject(config)) return state
        const next = { provider: config.provider ?? null, model: config.model ?? null }
        const current = state.route
        if (current !== null && current.provider === next.provider && current.model === next.model) return state
        return { ...state, route: next }
      }

      case 'assistant/message': {
        if (!addressesOpenStep(state, event.data)) return state
        const usage = isObject(event.data.usage) ? event.data.usage : {}
        const reply = clip(joinText(isObject(event.data.message) ? event.data.message.content : [], REPLY_LIMIT).text, REPLY_LIMIT)
        return updateLastStep(state, step => {
          const llm = step.llm
          return {
            ...step,
            llm: {
              calls: llm.calls + 1,
              retries: llm.retries,
              messageAt: llm.messageAt === null ? event.time : llm.messageAt,
              provider: state.route === null ? llm.provider : state.route.provider,
              model: state.route === null ? llm.model : state.route.model,
              inputTokens: llm.inputTokens + count(usage.inputTokens),
              outputTokens: llm.outputTokens + count(usage.outputTokens),
              cacheReadTokens: llm.cacheReadTokens + count(usage.cacheReadTokens),
              cacheWriteTokens: llm.cacheWriteTokens + count(usage.cacheWriteTokens),
            },
            reply: reply.text,
            replyClipped: reply.clipped,
          }
        })
      }

      case 'assistant/attempt': {
        // One model attempt that committed no surface message (failed,
        // cancelled, or retried): still a model call this loop paid for.
        if (!addressesOpenStep(state, event.data)) return state
        return updateLastStep(state, step => ({ ...step, llm: { ...step.llm, calls: step.llm.calls + 1 } }))
      }

      case 'llm/retry': {
        if (!addressesOpenStep(state, event.data)) return state
        return updateLastStep(state, step => ({ ...step, llm: { ...step.llm, retries: step.llm.retries + 1 } }))
      }

      case 'tool/call': {
        if (!addressesOpenStep(state, event.data)) return state
        const call = {
          id: event.data.callId,
          name: event.data.name,
          args: clip(event.data.arguments, TOOL_ARG_LIMIT).text,
          at: event.time,
          ms: null,
          ok: null,
          note: null,
        }
        return updateLastStep(state, step => {
          if (step.tools.length >= MAX_TOOLS) {
            return { ...step, overflowTools: step.overflowTools + 1 }
          }
          return { ...step, tools: step.tools.concat([call]) }
        })
      }

      case 'tool/result': {
        if (!addressesOpenStep(state, event.data)) return state
        const source = isObject(event.data.message) ? event.data.message.source : undefined
        const callId = isObject(source) ? source.callId : undefined
        if (typeof callId !== 'string') return state
        const isError = isObject(event.data.message) && event.data.message.isError === true
        const reason = isObject(event.data.error) && typeof event.data.error.reason === 'string'
          ? clip(event.data.error.reason, 120).text
          : null
        return updateLastStep(state, step => {
          const index = step.tools.findIndex(call => call.id === callId && call.ms === null)
          if (index === -1) return step
          const call = step.tools[index]
          const next = {
            ...call,
            ms: Math.max(0, event.time - call.at),
            ok: !isError,
            note: isError ? reason : null,
          }
          const tools = step.tools.slice()
          tools[index] = next
          return { ...step, tools }
        })
      }

      case 'step/end': {
        if (!addressesOpenStep(state, event.data)) return state
        const closed = updateLastStep(state, step => (step.endAt === null ? { ...step, endAt: event.time } : step))
        return closed.open === null ? closed : { ...closed, open: null }
      }

      case 'turn/end': {
        const turn = lastTurn(state)
        if (turn === null || turn.turn !== event.data.turn) return state
        const reason = isObject(event.data.reason) && typeof event.data.reason.kind === 'string'
          ? event.data.reason.kind
          : 'unknown'
        const closed = updateLastTurn(state, current => ({
          ...current,
          endAt: event.time,
          reason,
        }))
        // Queued prompts that never entered a loop belong to a turn that ended.
        return closed.inbox.length === 0 && closed.open === null
          ? closed
          : { ...closed, inbox: [], open: null }
      }

      default:
        return state
    }
  },
  wire: {
    // The fold state is already the client's read model: the newest loop
    // (`open`) is what the panel auto-expands, and every other field is
    // rendered as-is. Returning the state reference itself keeps the
    // registry's identity gate meaningful — an ignored event publishes nothing.
    viewSchema: { parse: parseLedger },
    view: state => state,
    summary: false,
  },
}

/** The projection registry is the plugin's whole purpose; without it the fiber stays pending. */
export const inject = ['sessionProjections']

/**
 * Register the `loopLedger` unit. The registration is an effect on this
 * plugin's fiber, so unloading removes the key everywhere.
 * @param {import('@deepseek-ai/cordis').Context} ctx registrant context.
 * @returns {Promise<void>} when the unit is live.
 */
export async function apply (ctx) {
  await ctx.sessionProjections.register(loopLedgerProjection)
}
