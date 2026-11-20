# Agent loops

A **Loops** view beside Chat and Trajectory. It answers one question for every task in the session: *how many agent loops ran, and what did each loop actually do?*

## What a row means

One task is one **turn**: the work one prompt starts. Inside a task, every **loop** is one agent-loop iteration — one model call plus the tool calls it requests — matching one `step/start` … `step/end` pair in the session log.

| Shown | Meaning |
| --- | --- |
| Task *n* | The host-assigned turn number. Its header line is the task's first human prompt. |
| Loop *n* | The host-assigned step number inside that task. |
| `LLM n` / `模型 n` | Model requests this loop made. A failed, retried, or cancelled attempt that committed no message still counts, because the loop paid for it. Retries are counted separately. |
| Tool calls | `tool/call` events in the loop, including calls still waiting for a result. |
| Elapsed | Loop start (`step/start`) to its close (`step/end`); a running loop ticks live. |

A collapsed loop row shows its tool names, or the model's answer preview when it ran no tools. Expanding it shows:

- **Prompts** — the messages admitted into this loop (your message, steering, and injected context such as time, runtime, or skill-catalog notices, each labelled by producer). Every later loop also shows the **task prompt** carried into it, because that is the text the model read again; the prompt list is empty exactly when no new message entered the loop.
- **Model calls** — provider and model, call count, retries, time to the first answer, input/output tokens, and cached tokens.
- **Tool calls** — status dot, tool name, truncated arguments, duration, and failure reason.
- **Answer** — the loop's answer preview, or an explicit “no text answer” for a loop that produced none.

The header tiles total the retained tasks: loops, tool calls, model calls, and elapsed time.

## Reading it

- Tasks are collapsed except the newest one; loops are collapsed except the running one. Opening the tab scrolls the running loop into view once, then leaves scrolling to the reader.
- A task with more than twelve loops shows its newest twelve; the rest sit behind “show earlier loops”.
- Everything is a fold of the durable session log, so values survive reload, history paging, and compaction; they do not depend on how much transcript a client has loaded.

## Visual language

Colours are theme tokens, so light and dark follow the application and nothing is hard-coded:

- **One hue carries the feature.** Loops, the running node, the hero wash and the open-row tint use the theme's business blue; the panel therefore reads as one surface with the rest of the app rather than a pasted-in widget.
- **Each measured thing keeps its own colour.** Model calls use the theme's chart-message blue, tool calls its chart-tool violet, elapsed time the warning amber. The same three colours reappear in every bar, pill and legend, so a glance is enough to know what you are looking at.
- **A task's 3px bar is its time budget.** Model answer, tool execution, and everything else (queueing, waiting for you) fill it in proportion to the task's own wall time.
- **A loop's node is its outcome.** Green while a loop settles normally, red if any tool in it failed, a pulsing blue while it runs, and a proportional meter beside the duration shows whether that loop was model-bound or tool-bound.
- **Numbers are tabular**, so figures stop jittering as they tick and line up column to column.

Motion is small and purposeful — cards and rows fade in with a short stagger, bars grow from the left, the running node pulses, a changed metric pops — and every one of them is switched off under `prefers-reduced-motion: reduce`.

## Limits

- **Text is clipped, not summarized.** A prompt keeps up to 1000 characters (injected context: 260), a tool's arguments 140, an answer 220. The view marks clipped prompts; nothing is rewritten.
- **Per-loop lists are bounded.** Five new prompts and forty tool calls per loop are kept; the rest are counted and shown as “N more”.
- **The newest 80 tasks are kept.** Older turns are counted in a footnote instead of being shown, and the header chips cover only the retained tasks.
- **Model timing is one figure.** “Answered in …” is loop start to the model's first assembled answer, so it includes any retry wait inside that loop; per-attempt timings are not recorded.
- **The system-prompt figure is an estimate.** It reports the size of the latest rendered system prompt in characters, which is not the same as its token cost.
- **A cancelled loop keeps its counts but no answer.** A loop interrupted mid-stream still counts its prompt, model calls, and tool calls; unresolved calls read “no result” and its answer reads “no text answer”.
- **A projection key, not a new event.** The plugin adds no session events, so logs stay readable by other Harness builds; removing the plugin removes the view and the key.
