window.__ModuleLoader__.load({
  id: 'dsh-agent-loops',
  factory (require) {
    const React = require('react')
    const h = React.createElement

    const NS = 'agentLoops'

    /** Loops shown per expanded task before the rest fold behind one control. */
    const LOOP_WINDOW = 12
    /** Grace period before an absent projection is reported as unavailable. */
    const ABSENT_GRACE_MS = 1500

    const en = {
      'view.label': 'Loops',
      title: 'Agent loops',
      subtitle: 'Each task and every loop it ran, with the model calls, tool calls, and prompts inside that loop.',
      'stat.tasks': 'Tasks',
      'stat.loops': 'Loops',
      'stat.tools': 'Tool calls',
      'stat.llm': 'Model calls',
      'stat.time': 'Elapsed',
      'stat.llmShort': 'LLM',
      'legend.model': 'Model',
      'legend.tools': 'Tools',
      'legend.other': 'Other',
      'legend.title': 'Where this task spent its time',
      'turn.label': 'Task {n}',
      'turn.empty': '(no prompt)',
      'turn.moreLoops': 'Show {count} earlier loops',
      'turn.fewerLoops': 'Collapse earlier loops',
      'loop.label': 'Loop {n}',
      'loop.live': 'running',
      'prompt.heading': 'Prompts',
      'prompt.me': 'You',
      'prompt.context': 'Context',
      'prompt.task': 'Task prompt',
      'prompt.taskNote': 'carried into this loop',
      'prompt.none': 'No new message in this loop; it continues from the prompt above and earlier tool results.',
      'prompt.clipped': 'truncated',
      'prompt.images': '{count} images',
      'prompt.overflow': '{count} more prompts not shown',
      'prompt.system': 'System prompt ≈ {chars} chars',
      'llm.title': 'Model calls',
      'llm.callsUnit': 'calls',
      'llm.retries': 'retried {count}×',
      'llm.tokens': '{input} in / {output} out',
      'llm.cache': '{tokens} cached',
      'llm.answer': 'answered in {value}',
      'tools.title': 'Tool calls',
      'tools.overflow': '{count} more calls not shown',
      'tools.pending': 'pending',
      'tools.unresolved': 'no result',
      'tools.failed': 'failed',
      'reply.title': 'Answer',
      'reply.pending': 'not answered yet',
      'reply.empty': 'No text answer in this loop.',
      'empty.title': 'No agent loops yet',
      'empty.body': 'Send a message — each loop, its model and tool calls, and the prompt that drove it appear here.',
      unavailable: 'Loop data is unavailable in this client.',
      dropped: '{count} earlier tasks not shown',
      'kind.time-context': 'Time context',
      'kind.runtime-context': 'Runtime context',
      'kind.skill-catalog': 'Skill catalog',
      'kind.user-approval': 'Approval note',
      'kind.goal': 'Goal',
      'kind.team': 'Team message',
      'kind.subagent': 'Subagent message',
      'kind.schedule': 'Schedule',
      'kind.steering': 'Steering',
      'kind.reference': 'Reference',
      'kind.relay': 'Relay',
      'kind.notice': 'Notice',
      'kind.instructions': 'Instructions',
    }

    const zh = {
      'view.label': '循环',
      title: 'Agent 循环',
      subtitle: '每个任务跑了多少次循环，以及每一次循环里的模型调用、工具调用和提示词。',
      'stat.tasks': '任务',
      'stat.loops': '循环',
      'stat.tools': '工具调用',
      'stat.llm': '模型调用',
      'stat.time': '用时',
      'stat.llmShort': '模型',
      'legend.model': '模型',
      'legend.tools': '工具',
      'legend.other': '其他',
      'legend.title': '这个任务的时间去向',
      'turn.label': '任务 {n}',
      'turn.empty': '（无提示词）',
      'turn.moreLoops': '显示更早的 {count} 次循环',
      'turn.fewerLoops': '收起更早的循环',
      'loop.label': '循环 {n}',
      'loop.live': '进行中',
      'prompt.heading': '提示词',
      'prompt.me': '我',
      'prompt.context': '上下文',
      'prompt.task': '任务提示词',
      'prompt.taskNote': '本轮继续沿用',
      'prompt.none': '本轮没有新消息，接着用上面的提示词和之前的工具结果。',
      'prompt.clipped': '已截断',
      'prompt.images': '{count} 张图片',
      'prompt.overflow': '另有 {count} 条提示词未显示',
      'prompt.system': '系统提示词约 {chars} 字符',
      'llm.title': '模型调用',
      'llm.callsUnit': '次调用',
      'llm.retries': '重试 {count} 次',
      'llm.tokens': '输入 {input} / 输出 {output}',
      'llm.cache': '缓存 {tokens}',
      'llm.answer': '首回复用时 {value}',
      'tools.title': '工具调用',
      'tools.overflow': '另有 {count} 次调用未显示',
      'tools.pending': '等待结果',
      'tools.unresolved': '没有结果',
      'tools.failed': '失败',
      'reply.title': '回复',
      'reply.pending': '尚未回复',
      'reply.empty': '本轮没有文本回复。',
      'empty.title': '还没有 Agent 循环',
      'empty.body': '发一条消息后，每一次循环、它内部的模型与工具调用，以及驱动它的提示词都会出现在这里。',
      unavailable: '当前客户端没有循环数据。',
      dropped: '更早的 {count} 个任务未显示',
      'kind.time-context': '时间上下文',
      'kind.runtime-context': '运行时上下文',
      'kind.skill-catalog': '技能目录',
      'kind.user-approval': '审批设置',
      'kind.goal': '目标',
      'kind.team': '团队消息',
      'kind.subagent': '子代理消息',
      'kind.schedule': '定时任务',
      'kind.steering': '插话',
      'kind.reference': '引用',
      'kind.relay': '转发',
      'kind.notice': '通知',
      'kind.instructions': '指令',
    }

    const CSS = `
.al-root{--al-ease:cubic-bezier(.2,.8,.2,1);--al-model:var(--dsw-alias-chart-messages);--al-tool:var(--dsw-alias-chart-tools);--al-other:var(--dsw-alias-state-idle-primary);--al-live:var(--dsw-alias-state-business-primary);--al-warn:var(--dsw-alias-state-warn-primary);--al-err:var(--dsw-alias-state-error-primary);--al-ok:var(--dsw-alias-state-success-primary);display:flex;flex-direction:column;box-sizing:border-box;height:100%;min-height:0;overflow:hidden;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font:var(--dsw-font-xxs-12);}
.al-scroll{flex:1;min-height:0;overflow-x:hidden;overflow-y:auto;padding:0 20px calc(var(--dsh-composer-height,152px) + 24px);}
.al-page{width:100%;max-width:min(100%,var(--dsh-chat-content-width,900px));margin:0 auto;padding-top:20px;}

/* ---------- hero ---------- */
.al-hero{position:relative;display:flex;align-items:flex-start;gap:12px;padding:15px 16px;border:1px solid color-mix(in srgb,var(--al-live) 20%,var(--dsw-alias-border-l1));border-radius:var(--dsw-radius-lg);background:radial-gradient(130% 150% at 0% 0%,color-mix(in srgb,var(--al-live) 13%,transparent) 0%,transparent 58%),var(--dsw-alias-bg-layer-1);overflow:hidden;animation:al-in .32s var(--al-ease) both;}
.al-hero-icon{flex:none;display:grid;place-items:center;width:30px;height:30px;border-radius:var(--dsw-radius-md);color:var(--al-live);background:color-mix(in srgb,var(--al-live) 14%,transparent);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--al-live) 24%,transparent);}
.al-hero-icon svg{width:16px;height:16px;}
.al-hero-text{display:flex;flex-direction:column;gap:3px;min-width:0;}
.al-title{margin:0;font:var(--dsw-font-s-strong-14);letter-spacing:.01em;}
.al-sub{margin:0;font:var(--dsw-font-xxs-12);color:var(--dsw-alias-label-secondary);}

/* ---------- metric tiles ---------- */
.al-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(102px,1fr));gap:8px;margin-top:10px;}
.al-metric{position:relative;display:flex;flex-direction:column;gap:1px;padding:9px 11px 10px;border:1px solid var(--dsw-alias-border-l1);border-radius:var(--dsw-radius-md);background:var(--dsw-alias-bg-layer-1);overflow:hidden;animation:al-in .34s var(--al-ease) both;animation-delay:calc(var(--al-i,0) * 45ms);}
.al-metric::after{content:'';position:absolute;right:0;bottom:0;left:0;height:2px;background:var(--al-c);opacity:.7;}
.al-metric-top{display:flex;align-items:center;gap:5px;color:var(--al-c);}
.al-metric-top svg{width:12px;height:12px;flex:none;}
.al-metric-k{font:var(--dsw-font-xxxs-11);color:var(--dsw-alias-label-secondary);white-space:nowrap;}
.al-metric-v{font:var(--dsw-font-xs-strong-13);font-variant-numeric:tabular-nums;line-height:18px;animation:al-pop .3s var(--al-ease) both;}

/* ---------- task cards ---------- */
.al-turns{display:flex;flex-direction:column;gap:10px;margin-top:14px;}
.al-turn{position:relative;border:1px solid var(--dsw-alias-border-l1);border-radius:var(--dsw-radius-lg);background:var(--dsw-alias-bg-layer-1);overflow:hidden;transition:border-color .18s var(--al-ease),box-shadow .18s var(--al-ease);animation:al-in .3s var(--al-ease) both;animation-delay:calc(var(--al-i,0) * 50ms + 60ms);}
.al-turn[data-open='true']{border-color:color-mix(in srgb,var(--al-live) 26%,var(--dsw-alias-border-l1));box-shadow:var(--dsw-shadow-lv1);}
.al-turn-head{display:flex;align-items:center;gap:10px;width:100%;margin:0;padding:10px 12px 8px;border:0;background:transparent;color:inherit;font:inherit;text-align:left;cursor:pointer;}
.al-turn-head:focus-visible{outline:none;box-shadow:inset 0 0 0 1.5px var(--al-live);border-radius:var(--dsw-radius-md);}
.al-turn-no{flex:none;padding:1px 7px;border-radius:6px;font:var(--dsw-font-xxxs-strong-11);letter-spacing:.02em;color:var(--al-live);background:color-mix(in srgb,var(--al-live) 12%,transparent);white-space:nowrap;}
.al-turn-prompt{flex:1;min-width:0;overflow:hidden;font:var(--dsw-font-xs-13);text-overflow:ellipsis;white-space:nowrap;}
.al-turn-prompt[data-empty='true']{color:var(--dsw-alias-label-secondary);}
.al-turn-meta{flex:none;display:flex;align-items:center;color:var(--dsw-alias-label-secondary);font:var(--dsw-font-xxxs-11);font-variant-numeric:tabular-nums;white-space:nowrap;}
.al-turn-meta span+span::before{content:'·';margin:0 8px;opacity:.45;}
.al-turn-meta b{color:var(--dsw-alias-label-primary);font-weight:600;}
.al-caret{flex:none;width:12px;height:12px;color:var(--dsw-alias-label-secondary);transition:transform .2s var(--al-ease);}
.al-turn[data-open='true'] .al-caret{transform:rotate(90deg);}

/* time composition bar */
.al-turn-bar{display:flex;height:3px;margin:0 12px 9px;border-radius:999px;overflow:hidden;background:var(--dsw-alias-bg-layer-2);}
.al-turn-bar i{display:block;height:100%;transform-origin:left;animation:al-bar .7s var(--al-ease) both;transition:flex-grow .3s var(--al-ease);}
.al-legend{display:flex;flex-wrap:wrap;gap:12px;padding:0 2px 2px;color:var(--dsw-alias-label-secondary);font:var(--dsw-font-xxxs-11);}
.al-legend span{display:inline-flex;align-items:center;gap:5px;white-space:nowrap;}
.al-legend i{width:6px;height:6px;border-radius:2px;}

/* ---------- loops ---------- */
.al-steps{display:flex;flex-direction:column;padding:2px 12px 9px;}
.al-more{align-self:flex-start;margin:0 0 5px 2px;padding:3px 8px;border:0;border-radius:var(--dsw-radius-sm);background:color-mix(in srgb,var(--al-live) 9%,transparent);color:var(--al-live);font:var(--dsw-font-xxxs-11);cursor:pointer;transition:background .16s var(--al-ease),transform .16s var(--al-ease);}
.al-more:active{transform:scale(.97);}
.al-more:focus-visible{outline:none;box-shadow:0 0 0 2px color-mix(in srgb,var(--al-live) 30%,transparent);}
.al-step{position:relative;padding-left:20px;animation:al-in .26s var(--al-ease) both;animation-delay:calc(var(--al-i,0) * 18ms);}
.al-step::before{content:'';position:absolute;left:4px;top:16px;bottom:-3px;width:1px;background:linear-gradient(180deg,color-mix(in srgb,var(--al-live) 34%,var(--dsw-alias-border-l1)),var(--dsw-alias-border-l1));}
.al-step:last-child::before{display:none;}
.al-node{position:absolute;left:0;top:10px;width:9px;height:9px;box-sizing:border-box;border-radius:50%;border:1.5px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);transition:background .2s var(--al-ease),border-color .2s var(--al-ease);}
.al-step[data-state='live'] .al-node{border-color:var(--al-live);background:var(--al-live);animation:al-pulse 1.9s var(--al-ease) infinite;}
.al-step[data-state='error'] .al-node{border-color:var(--al-err);background:color-mix(in srgb,var(--al-err) 22%,var(--dsw-alias-bg-layer-1));}
.al-step[data-state='ok'] .al-node{border-color:var(--al-ok);}
.al-step-row{display:flex;align-items:center;gap:8px;width:100%;margin:0;padding:5px 8px;border:0;border-radius:var(--dsw-radius-sm);background:transparent;color:inherit;font:inherit;text-align:left;cursor:pointer;transition:background .16s var(--al-ease);}
.al-step-row[aria-expanded='true']{background:color-mix(in srgb,var(--al-live) 7%,transparent);}
.al-step-row:focus-visible{outline:none;box-shadow:inset 0 0 0 1.5px var(--al-live);}
.al-loop-name{flex:none;font:var(--dsw-font-xs-strong-13);white-space:nowrap;font-variant-numeric:tabular-nums;}
.al-pill{flex:none;display:inline-flex;align-items:center;gap:4px;padding:0 7px;border-radius:999px;font:var(--dsw-font-xxxs-11);font-variant-numeric:tabular-nums;white-space:nowrap;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary);}
.al-pill[data-kind='model']{background:color-mix(in srgb,var(--al-model) 14%,transparent);color:color-mix(in srgb,var(--al-model) 78%,var(--dsw-alias-label-primary));}
.al-pill[data-kind='tool']{background:color-mix(in srgb,var(--al-tool) 14%,transparent);color:color-mix(in srgb,var(--al-tool) 78%,var(--dsw-alias-label-primary));}
.al-pill[data-kind='live']{background:color-mix(in srgb,var(--al-live) 14%,transparent);color:var(--al-live);}
.al-pill[data-kind='live']::before{content:'';width:5px;height:5px;border-radius:50%;background:currentColor;animation:al-blink 1.4s var(--al-ease) infinite;}
.al-step-reply{flex:1;min-width:0;overflow:hidden;color:var(--dsw-alias-label-secondary);font:var(--dsw-font-xxxs-11);text-overflow:ellipsis;white-space:nowrap;}
.al-meter{flex:none;display:flex;width:54px;height:3px;border-radius:999px;overflow:hidden;background:var(--dsw-alias-bg-layer-2);}
.al-meter i{display:block;height:100%;}
.al-step-time{flex:none;color:var(--dsw-alias-label-secondary);font:var(--dsw-font-xxxs-11);font-variant-numeric:tabular-nums;white-space:nowrap;min-width:34px;text-align:right;}

/* ---------- loop detail ---------- */
.al-detail{display:flex;flex-direction:column;gap:11px;margin:2px 0 10px;padding:11px 12px;border:1px solid var(--dsw-alias-border-l1);border-radius:var(--dsw-radius-md);background:color-mix(in srgb,var(--dsw-alias-bg-layer-2) 94%,transparent);animation:al-open .24s var(--al-ease) both;}
.al-sec{display:flex;flex-direction:column;gap:5px;}
.al-sec-title{font:var(--dsw-font-xxxs-strong-11);letter-spacing:.06em;text-transform:uppercase;color:var(--dsw-alias-label-secondary);}
.al-prompt{display:flex;flex-direction:column;gap:2px;padding-left:9px;border-left:2px solid var(--dsw-alias-border-l2);}
.al-prompt[data-kind='user']{padding:6px 10px;border-left:3px solid var(--al-live);border-radius:0 var(--dsw-radius-sm) var(--dsw-radius-sm) 0;background:color-mix(in srgb,var(--al-live) 6%,transparent);}
.al-prompt[data-kind='task']{border-left-style:dashed;border-left-color:var(--dsw-alias-border-l2);}
.al-prompt-kind{font:var(--dsw-font-xxxs-11);letter-spacing:.03em;color:var(--dsw-alias-label-secondary);}
.al-prompt-text{font:var(--dsw-font-xxs-12);overflow-wrap:anywhere;white-space:pre-wrap;}
.al-prompt[data-kind='context'] .al-prompt-text{color:var(--dsw-alias-label-secondary);}
.al-note{color:var(--dsw-alias-label-secondary);font:var(--dsw-font-xxxs-11);}
.al-facts{display:flex;flex-wrap:wrap;gap:3px 12px;color:var(--dsw-alias-label-secondary);font:var(--dsw-font-xxxs-11);font-variant-numeric:tabular-nums;}
.al-facts b{color:var(--dsw-alias-label-primary);font-weight:600;}
.al-tokenbar{display:flex;height:4px;margin-top:3px;border-radius:999px;overflow:hidden;background:var(--dsw-alias-bg-layer-1);}
.al-tokenbar i{display:block;height:100%;transform-origin:left;animation:al-bar .6s var(--al-ease) both;}
.al-call{display:flex;align-items:baseline;gap:8px;padding:2px 6px;border-radius:var(--dsw-radius-xs);font:var(--dsw-font-xxs-12);}
.al-call[data-state='error']{background:color-mix(in srgb,var(--al-err) 8%,transparent);}
.al-call-dot{flex:none;width:6px;height:6px;border-radius:2px;background:var(--al-ok);}
.al-call[data-state='error'] .al-call-dot{background:var(--al-err);}
.al-call[data-state='pending'] .al-call-dot{background:var(--al-other);}
.al-call-name{flex:none;font:var(--dsw-font-xxs-strong-12);}
.al-call-arg{flex:1;min-width:0;overflow:hidden;color:var(--dsw-alias-label-secondary);font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;line-height:16px;text-overflow:ellipsis;white-space:nowrap;}
.al-call-time{flex:none;color:var(--dsw-alias-label-secondary);font:var(--dsw-font-xxxs-11);font-variant-numeric:tabular-nums;}
.al-reply{margin:0;padding-left:9px;border-left:2px solid color-mix(in srgb,var(--al-live) 30%,transparent);color:var(--dsw-alias-label-secondary);font:var(--dsw-font-xxs-12);overflow-wrap:anywhere;white-space:pre-wrap;}

/* ---------- foot + empty ---------- */
.al-foot{display:flex;align-items:center;gap:8px;margin:16px 2px 0;color:var(--dsw-alias-label-secondary);font:var(--dsw-font-xxxs-11);}
.al-foot::before{content:'';flex:1;height:1px;background:var(--dsw-alias-border-l1);}
.al-empty{display:flex;flex-direction:column;align-items:center;gap:10px;max-width:400px;margin:64px auto 0;padding:26px 22px;text-align:center;border:1px dashed var(--dsw-alias-border-l2);border-radius:var(--dsw-radius-lg);background:radial-gradient(120% 120% at 50% 0%,color-mix(in srgb,var(--al-live) 8%,transparent),transparent 70%),var(--dsw-alias-bg-layer-1);animation:al-in .36s var(--al-ease) both;}
.al-empty-icon{display:grid;place-items:center;width:34px;height:34px;border-radius:var(--dsw-radius-md);color:var(--al-live);background:color-mix(in srgb,var(--al-live) 13%,transparent);}
.al-empty-icon svg{width:18px;height:18px;}
.al-empty-title{font:var(--dsw-font-xs-strong-13);}
.al-empty-body{font:var(--dsw-font-xxs-12);color:var(--dsw-alias-label-secondary);}

/* ---------- motion ---------- */
@keyframes al-in{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
@keyframes al-pop{from{opacity:.35;transform:translateY(-2px)}to{opacity:1;transform:none}}
@keyframes al-open{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:none}}
@keyframes al-bar{from{transform:scaleX(0)}to{transform:scaleX(1)}}
@keyframes al-pulse{0%{box-shadow:0 0 0 0 color-mix(in srgb,var(--al-live) 55%,transparent)}70%{box-shadow:0 0 0 7px transparent}100%{box-shadow:0 0 0 0 transparent}}
@keyframes al-blink{0%,100%{opacity:1}50%{opacity:.25}}
@media (hover:hover){
  .al-turn:hover{border-color:color-mix(in srgb,var(--al-live) 22%,var(--dsw-alias-border-l1));}
  .al-turn-head:hover .al-caret{color:var(--al-live);}
  .al-step-row:hover{background:var(--dsw-alias-interactive-bg-hover-accent,var(--dsw-alias-interactive-bg-hover));}
  .al-more:hover{background:color-mix(in srgb,var(--al-live) 16%,transparent);}
}
@media (max-width:640px){
  .al-step-reply{display:none;}
  .al-turn-meta{gap:7px;}
}
@media (prefers-reduced-motion:reduce){
  .al-root,.al-root *,.al-root *::before,.al-root *::after{animation:none!important;transition:none!important;}
}
`

    /** Compact duration: 640ms, 3.2s, 1m 04s, 2h 15m. */
    function duration (ms) {
      if (typeof ms !== 'number' || !Number.isFinite(ms) || ms < 0) return '—'
      if (ms < 1000) return `${Math.round(ms)}ms`
      if (ms < 60000) return `${(ms / 1000).toFixed(ms < 10000 ? 1 : 0)}s`
      const minutes = Math.floor(ms / 60000)
      if (minutes < 60) {
        const seconds = Math.round((ms % 60000) / 1000)
        return `${minutes}m ${String(seconds).padStart(2, '0')}s`
      }
      const hours = Math.floor(minutes / 60)
      return `${hours}h ${String(minutes % 60).padStart(2, '0')}m`
    }

    /** Compact token count: 940, 8.4k, 1.2M. */
    function tokens (value) {
      if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) return '0'
      if (value < 1000) return String(Math.round(value))
      if (value < 1000000) return `${(value / 1000).toFixed(value < 10000 ? 1 : 0)}k`
      return `${(value / 1000000).toFixed(1)}M`
    }

    /** Collapse whitespace for one-line previews. */
    function oneLine (text) {
      return typeof text === 'string' ? text.replace(/\s+/g, ' ').trim() : ''
    }

    /**
     * The prompt that names a task: its first human prompt. An automated turn
     * (goal round, schedule, team message) has none, and then no prompt is
     * carried — labelling an injected notice as the task prompt would be wrong.
     */
    function turnPrompt (turn) {
      for (const step of turn.steps) {
        for (const prompt of step.prompts) {
          if (prompt.kind === 'user' && prompt.text !== '') return prompt.text
        }
      }
      return ''
    }

    /** One loop's wall time split into the model's answer, its tools, and the rest. */
    function splitLoop (step, now) {
      const end = step.endAt === null ? now : step.endAt
      const elapsed = Math.max(0, end - step.at)
      const toolsRaw = step.tools.reduce((sum, call) => sum + (call.ms ?? 0), 0)
      // Before the answer lands, the model is the one doing the work, so a live
      // loop's elapsed time reads as model time rather than an unlabelled gap.
      const model = step.llm.messageAt !== null
        ? Math.min(elapsed, Math.max(0, step.llm.messageAt - step.at))
        : (step.endAt === null ? Math.max(0, elapsed - toolsRaw) : 0)
      const tools = Math.min(Math.max(0, elapsed - model), toolsRaw)
      return { elapsed, model, tools, other: Math.max(0, elapsed - model - tools) }
    }

    /** Whole-ledger figures. Counts cover the retained tasks only; `dropped` is footnoted separately. */
    function summarize (turns) {
      let loops = 0
      let tools = 0
      let llm = 0
      let start = null
      let end = null
      for (const turn of turns) {
        if (start === null && typeof turn.at === 'number') start = turn.at
        if (typeof turn.endAt === 'number') end = turn.endAt
        for (const step of turn.steps) {
          loops += 1
          llm += step.llm.calls
          tools += step.tools.length + step.overflowTools
        }
      }
      return { tasks: turns.length, loops, tools, llm, start, end }
    }

    /**
     * A task's wall time split by segment. The task's own span is the honest
     * total (a task's time is wall time, not the sum of its loops), so the
     * summed loop segments are clamped into it and the remainder is "other".
     */
    function turnSplit (turn, now) {
      const end = turn.endAt === null ? now : turn.endAt
      const span = Math.max(0, end - turn.at)
      let model = 0
      let tools = 0
      for (const step of turn.steps) {
        const split = splitLoop(step, now)
        model += split.model
        tools += split.tools
      }
      model = Math.min(model, span)
      tools = Math.min(tools, Math.max(0, span - model))
      return { span, model, tools, other: Math.max(0, span - model - tools) }
    }

    function Icon (props) {
      const { path, name } = props
      return h('svg', {
        viewBox: '0 0 12 12',
        'aria-hidden': true,
        focusable: 'false',
        'data-icon': name,
      }, h('path', {
        d: path,
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: 1.2,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
      }))
    }

    const ICONS = {
      tasks: 'M6 2.4 9.8 4.4 6 6.4 2.2 4.4zM2.2 6.4 6 8.4l3.8-2M2.2 8.4 6 10.4l3.8-2',
      loops: 'M2.6 5.2A3.6 3.6 0 0 1 9 3.7M9.4 6.8A3.6 3.6 0 0 1 3 8.3M9 2.2v1.6H7.4M3 9.8V8.2h1.6',
      model: 'M6 2.2 7.1 4.6 9.5 5.7 7.1 6.8 6 9.2 4.9 6.8 2.5 5.7 4.9 4.6z',
      tools: 'M9.8 3.6a2.4 2.4 0 0 1-3.2 3.2L3.4 10 2 8.6l3.2-3.2A2.4 2.4 0 0 1 8.4 2.2L6.9 3.7l1.4 1.4z',
      time: 'M6 2.4a3.6 3.6 0 1 0 0 7.2 3.6 3.6 0 0 0 0-7.2zM6 4.2V6l1.5 1.1',
      spark: 'M6 2.2 7.1 4.6 9.5 5.7 7.1 6.8 6 9.2 4.9 6.8 2.5 5.7 4.9 4.6z',
    }

    function Metric (props) {
      const { index, accent, icon, label, value } = props
      return h('div', { className: 'al-metric', 'data-metric': label, style: { '--al-c': accent, '--al-i': String(index) } },
        h('div', { className: 'al-metric-top' },
          h(Icon, { path: ICONS[icon], name: icon }),
          h('span', { className: 'al-metric-k' }, label)),
        // Keyed by the value so a new figure pops in instead of mutating silently.
        h('span', { className: 'al-metric-v', key: value }, value))
    }

    /** Localized source label for a prompt's producer kind, falling back to the raw kind. */
    function kindLabel (t, kind) {
      if (kind === 'user') return t('prompt.me')
      const key = `kind.${kind}`
      const label = t(key)
      return label === key ? `${t('prompt.context')} · ${kind}` : label
    }

    function PromptBlock (props) {
      const { prompt, t, carried } = props
      const notes = []
      if (prompt.images > 0) notes.push(t('prompt.images', { count: prompt.images }))
      if (prompt.clipped) notes.push(t('prompt.clipped'))
      if (carried) notes.push(t('prompt.taskNote'))
      const label = carried ? t('prompt.task') : kindLabel(t, prompt.kind)
      return h('div', { className: 'al-prompt', 'data-kind': carried ? 'task' : prompt.kind === 'user' ? 'user' : 'context' },
        h('span', { className: 'al-prompt-kind' }, notes.length === 0 ? label : `${label} · ${notes.join(' · ')}`),
        h('span', { className: 'al-prompt-text' }, prompt.text))
    }

    function ToolRow (props) {
      const { call, t, live } = props
      const state = call.ok === null ? 'pending' : call.ok ? 'ok' : 'error'
      const note = state === 'pending'
        ? t(live ? 'tools.pending' : 'tools.unresolved')
        : state === 'error' ? (call.note || t('tools.failed')) : duration(call.ms)
      return h('div', { className: 'al-call', 'data-state': state },
        h('span', { className: 'al-call-dot' }),
        h('span', { className: 'al-call-name' }, call.name),
        h('span', { className: 'al-call-arg' }, oneLine(call.args)),
        h('span', { className: 'al-call-time' }, note))
    }

    function StepDetail (props) {
      const { step, taskPrompt, t, live } = props
      const sections = []

      // The prompts that entered this loop: the messages admitted here, plus the
      // task prompt every later loop inherits. Without the second half, loops 2..n
      // would look prompt-less even though the model read the task prompt again.
      // A steering loop keeps it too, unless this loop's own text already is it.
      const inherited = taskPrompt !== '' && !step.prompts.some(prompt => prompt.kind === 'user' && prompt.text === taskPrompt)
      sections.push(h('div', { className: 'al-sec', key: 'prompts' },
        h('span', { className: 'al-sec-title' }, t('prompt.heading')),
        inherited
          ? h(PromptBlock, { t, carried: true, prompt: { kind: 'task', text: taskPrompt, clipped: false, images: 0 } })
          : null,
        step.prompts.map((prompt, index) => h(PromptBlock, { prompt, t, key: index })),
        step.prompts.length === 0 && inherited ? h('span', { className: 'al-note' }, t('prompt.none')) : null,
        step.overflowPrompts > 0
          ? h('span', { className: 'al-note' }, t('prompt.overflow', { count: step.overflowPrompts }))
          : null,
        step.systemChars > 0
          ? h('span', { className: 'al-note' }, t('prompt.system', { chars: step.systemChars.toLocaleString() }))
          : null))

      const llm = step.llm
      if (llm.calls > 0 || llm.retries > 0) {
        const facts = [
          llm.provider === null || llm.model === null ? null : h('span', { key: 'model' }, `${llm.provider} · ${llm.model}`),
          h('span', { key: 'calls' }, h('b', null, String(llm.calls)), ` ${t('llm.callsUnit')}`),
          llm.retries > 0 ? h('span', { key: 'retries' }, t('llm.retries', { count: llm.retries })) : null,
          llm.messageAt === null ? null : h('span', { key: 'answer' }, t('llm.answer', { value: duration(llm.messageAt - step.at) })),
          llm.inputTokens + llm.outputTokens > 0
            ? h('span', { key: 'tokens' }, t('llm.tokens', { input: tokens(llm.inputTokens), output: tokens(llm.outputTokens) }))
            : null,
          llm.cacheReadTokens + llm.cacheWriteTokens > 0
            ? h('span', { key: 'cache' }, t('llm.cache', { tokens: tokens(llm.cacheReadTokens + llm.cacheWriteTokens) }))
            : null,
        ].filter(fact => fact !== null)
        // Token composition: cached reads, fresh input, then the answer.
        const bar = llm.inputTokens + llm.outputTokens > 0
          ? h('div', { className: 'al-tokenbar', 'aria-hidden': true },
            h('i', { style: { flexGrow: llm.cacheReadTokens + llm.cacheWriteTokens, background: 'color-mix(in srgb, var(--al-model) 45%, transparent)' } }),
            h('i', { style: { flexGrow: llm.inputTokens, background: 'var(--al-model)' } }),
            h('i', { style: { flexGrow: llm.outputTokens, background: 'var(--al-ok)' } }))
          : null
        sections.push(h('div', { className: 'al-sec', key: 'llm' },
          h('span', { className: 'al-sec-title' }, t('llm.title')),
          h('div', { className: 'al-facts' }, facts),
          bar))
      }

      if (step.tools.length > 0) {
        sections.push(h('div', { className: 'al-sec', key: 'tools' },
          h('span', { className: 'al-sec-title' }, t('tools.title')),
          step.tools.map((call, index) => h(ToolRow, { call, t, live, key: index })),
          step.overflowTools > 0
            ? h('span', { className: 'al-note' }, t('tools.overflow', { count: step.overflowTools }))
            : null))
      }

      sections.push(h('div', { className: 'al-sec', key: 'reply' },
        h('span', { className: 'al-sec-title' }, t('reply.title')),
        step.reply === ''
          ? h('span', { className: 'al-note' }, live ? t('reply.pending') : t('reply.empty'))
          : h('p', { className: 'al-reply' }, step.reply)))

      return h('div', { className: 'al-detail' }, sections)
    }

    function StepRow (props) {
      const { step, index, open, live, onToggle, t, now, taskPrompt, maxElapsed, rowRef } = props
      const split = splitLoop(step, now)
      const toolCount = step.tools.length + step.overflowTools
      const failed = step.tools.some(call => call.ok === false)
      const names = step.tools.slice(0, 3).map(call => call.name)
      const extra = toolCount - names.length
      // The collapsed row answers "what did this loop do" in one line: tool
      // names when it ran tools, otherwise the model's answer preview.
      const summary = names.length > 0
        ? `${names.join(' · ')}${extra > 0 ? ` +${extra}` : ''}`
        : oneLine(step.reply)
      const state = live ? 'live' : failed ? 'error' : 'ok'
      const weight = maxElapsed === 0 ? 0 : Math.max(0.04, split.elapsed / maxElapsed)
      return h('div', { className: 'al-step', 'data-state': state, style: { '--al-i': String(index) } },
        h('span', { className: 'al-node' }),
        h('button', {
          type: 'button',
          className: 'al-step-row',
          ref: rowRef,
          'aria-expanded': open ? 'true' : 'false',
          onClick: onToggle,
        },
        h('span', { className: 'al-loop-name' }, t('loop.label', { n: step.step })),
        h('span', { className: 'al-pill', 'data-kind': 'model' }, `${t('stat.llmShort')} ${step.llm.calls}`),
        h('span', { className: 'al-pill', 'data-kind': 'tool' }, `${t('stat.tools')} ${toolCount}`),
        live ? h('span', { className: 'al-pill', 'data-kind': 'live' }, t('loop.live')) : null,
        h('span', { className: 'al-step-reply' }, summary),
        h('span', { className: 'al-meter', 'aria-hidden': true, style: { width: `${Math.round(18 + weight * 36)}px` } },
          h('i', { style: { flexGrow: split.model, background: 'var(--al-model)' } }),
          h('i', { style: { flexGrow: split.tools, background: 'var(--al-tool)' } })),
        h('span', { className: 'al-step-time' }, duration(split.elapsed))),
        open ? h(StepDetail, { step, t, live, taskPrompt }) : null)
    }

    function TurnCard (props) {
      const { turn, index, open, onToggle, stepOpen, onStepToggle, openStep, t, now, showAll, onToggleAll, liveRowRef } = props
      const loops = turn.steps.length
      const llm = turn.steps.reduce((total, step) => total + step.llm.calls, 0)
      const tools = turn.steps.reduce((total, step) => total + step.tools.length + step.overflowTools, 0)
      const split = turnSplit(turn, now)
      const elapsed = split.span
      const taskPrompt = turnPrompt(turn)
      const maxElapsed = turn.steps.reduce((max, step) => Math.max(max, splitLoop(step, now).elapsed), 0)
      // A long task keeps its newest loops in view and hides the rest behind
      // one quiet control, so the panel stays readable at a hundred loops.
      const hidden = !showAll && loops > LOOP_WINDOW ? loops - LOOP_WINDOW : 0
      const steps = hidden > 0 ? turn.steps.slice(-LOOP_WINDOW) : turn.steps
      const total = Math.max(1, elapsed)
      return h('div', {
        className: 'al-turn',
        'data-open': open ? 'true' : 'false',
        style: { '--al-i': String(index) },
      },
      h('button', {
        type: 'button',
        className: 'al-turn-head',
        'aria-expanded': open ? 'true' : 'false',
        onClick: onToggle,
      },
      h('span', { className: 'al-turn-no' }, t('turn.label', { n: turn.turn })),
      h('span', { className: 'al-turn-prompt', 'data-empty': taskPrompt === '' ? 'true' : 'false' },
        taskPrompt === '' ? t('turn.empty') : oneLine(taskPrompt)),
      h('span', { className: 'al-turn-meta' },
        h('span', null, h('b', null, String(loops)), ` ${t('stat.loops')}`),
        h('span', null, h('b', null, String(llm)), ` ${t('stat.llmShort')}`),
        h('span', null, h('b', null, String(tools)), ` ${t('stat.tools')}`),
        h('span', null, duration(elapsed))),
      h(Caret)),
      h('div', { className: 'al-turn-bar', role: 'img', 'aria-label': t('legend.title') },
        h('i', { style: { flexGrow: split.model / total, background: 'var(--al-model)' } }),
        h('i', { style: { flexGrow: split.tools / total, background: 'var(--al-tool)' } }),
        h('i', { style: { flexGrow: split.other / total, background: 'var(--al-other)', opacity: 0.45 } })),
      open
        ? h('div', { className: 'al-steps' },
          h('div', { className: 'al-legend' },
            h('span', null, h('i', { style: { background: 'var(--al-model)' } }), t('legend.model')),
            h('span', null, h('i', { style: { background: 'var(--al-tool)' } }), t('legend.tools')),
            h('span', null, h('i', { style: { background: 'var(--al-other)', opacity: 0.45 } }), t('legend.other'))),
          hidden > 0
            ? h('button', { type: 'button', className: 'al-more', onClick: onToggleAll }, t('turn.moreLoops', { count: hidden }))
            : showAll && loops > LOOP_WINDOW
              ? h('button', { type: 'button', className: 'al-more', onClick: onToggleAll }, t('turn.fewerLoops'))
              : null,
          steps.map((step, position) => {
            const live = openStep !== null && openStep.turn === turn.turn && openStep.step === step.step
            return h(StepRow, {
              step,
              index: position,
              t,
              now,
              taskPrompt,
              live,
              maxElapsed,
              rowRef: live ? liveRowRef : undefined,
              open: stepOpen(turn.turn, step.step),
              onToggle: () => { onStepToggle(turn.turn, step.step) },
              key: step.step,
            })
          }))
        : null)
    }

    function EmptyState (props) {
      const { title, body } = props
      return h('div', { className: 'al-empty' },
        h('span', { className: 'al-empty-icon' }, h(Icon, { path: ICONS.loops, name: 'loops' })),
        h('span', { className: 'al-empty-title' }, title),
        h('span', { className: 'al-empty-body' }, body))
    }

    function Caret () {
      return h('svg', {
        className: 'al-caret',
        viewBox: '0 0 12 12',
        'aria-hidden': true,
        focusable: 'false',
      }, h('path', {
        d: 'M4.5 2.5 8 6l-3.5 3.5',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: 1.4,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
      }))
    }

    /**
     * The Loops view: one card per task (turn), one expandable row per agent
     * loop (step), and the prompt, model calls, and tool calls inside it.
     * Reads only the host-computed `loopLedger` projection — no event folding
     * happens in the browser.
     */
    function AgentLoopsView (props) {
      const t = typeof props.t === 'function' ? props.t : key => key
      const ledger = typeof props.useProjection === 'function' ? props.useProjection('loopLedger') : undefined
      const [openTurns, setOpenTurns] = React.useState({})
      const [openSteps, setOpenSteps] = React.useState({})
      const [showAllLoops, setShowAllLoops] = React.useState({})
      const [settled, setSettled] = React.useState(false)
      const [now, setNow] = React.useState(() => Date.now())
      const liveRowRef = React.useRef(null)
      const scrolledRef = React.useRef(false)

      const turns = ledger !== undefined && ledger !== null && Array.isArray(ledger.turns) ? ledger.turns : []
      const openStep = ledger !== undefined && ledger !== null ? ledger.open ?? null : null
      const dropped = ledger !== undefined && ledger !== null ? ledger.dropped ?? 0 : 0
      const live = openStep !== null
      const liveKey = openStep === null ? '' : `${openStep.turn}:${openStep.step}`

      // The first projection frame arrives with the session baseline; an absent
      // key is not yet an error, so the notice waits out a short grace period.
      React.useEffect(() => {
        if (ledger !== undefined) return undefined
        const timer = setTimeout(() => { setSettled(true) }, ABSENT_GRACE_MS)
        return () => { clearTimeout(timer) }
      }, [ledger])

      React.useEffect(() => {
        if (!live) return undefined
        const timer = setInterval(() => { setNow(Date.now()) }, 1000)
        return () => { clearInterval(timer) }
      }, [live])

      // Opening the tab lands on the loop that is running now; afterwards the
      // view stops moving so scrolling stays the reader's.
      React.useEffect(() => {
        if (scrolledRef.current) return
        const node = liveRowRef.current
        if (node === null) return
        scrolledRef.current = true
        if (typeof node.scrollIntoView === 'function') node.scrollIntoView({ block: 'center' })
      }, [liveKey])

      const lastTurn = turns.length === 0 ? null : turns[turns.length - 1].turn
      const isTurnOpen = turn => openTurns[turn] !== undefined ? openTurns[turn] : turn === lastTurn
      const isStepOpen = (turn, step) => {
        const key = `${turn}:${step}`
        if (openSteps[key] !== undefined) return openSteps[key]
        return openStep !== null && openStep.turn === turn && openStep.step === step
      }
      const toggleTurn = turn => {
        const next = !isTurnOpen(turn)
        setOpenTurns(current => ({ ...current, [turn]: next }))
      }
      const toggleStep = (turn, step) => {
        const key = `${turn}:${step}`
        const next = !isStepOpen(turn, step)
        setOpenSteps(current => ({ ...current, [key]: next }))
      }

      const body = []
      if (turns.length === 0) {
        // Before the first frame there is nothing to say yet.
        if (!(ledger === undefined && !settled)) {
          body.push(h(EmptyState, {
            key: 'empty',
            title: ledger === undefined ? t('unavailable') : t('empty.title'),
            body: ledger === undefined ? '' : t('empty.body'),
          }))
        }
      } else {
        const totals = summarize(turns)
        const elapsed = totals.start === null ? null : (totals.end === null ? now : totals.end) - totals.start
        const metrics = [
          totals.tasks > 1 || dropped > 0
            ? h(Metric, { key: 'tasks', index: 0, accent: 'var(--dsw-alias-state-business-primary)', icon: 'tasks', label: t('stat.tasks'), value: String(totals.tasks) })
            : null,
          h(Metric, { key: 'loops', index: 1, accent: 'var(--dsw-alias-state-business-primary)', icon: 'loops', label: t('stat.loops'), value: String(totals.loops) }),
          h(Metric, { key: 'llm', index: 2, accent: 'var(--al-model)', icon: 'model', label: t('stat.llm'), value: String(totals.llm) }),
          h(Metric, { key: 'tools', index: 3, accent: 'var(--al-tool)', icon: 'tools', label: t('stat.tools'), value: String(totals.tools) }),
          elapsed === null
            ? null
            : h(Metric, { key: 'time', index: 4, accent: 'var(--al-warn)', icon: 'time', label: t('stat.time'), value: duration(elapsed) }),
        ].filter(metric => metric !== null)

        body.push(h('div', { className: 'al-hero', key: 'hero' },
          h('span', { className: 'al-hero-icon' }, h(Icon, { path: ICONS.loops, name: 'loops' })),
          h('div', { className: 'al-hero-text' },
            h('h2', { className: 'al-title' }, t('title')),
            h('p', { className: 'al-sub' }, t('subtitle')))))
        body.push(h('div', { className: 'al-metrics', key: 'metrics' }, metrics))
        body.push(h('div', { className: 'al-turns', key: 'turns' }, turns.map((turn, index) => h(TurnCard, {
          key: turn.turn,
          turn,
          index,
          t,
          now,
          open: isTurnOpen(turn.turn),
          showAll: showAllLoops[turn.turn] === true,
          stepOpen: isStepOpen,
          openStep,
          liveRowRef,
          onToggle: () => { toggleTurn(turn.turn) },
          onToggleAll: () => { setShowAllLoops(current => ({ ...current, [turn.turn]: current[turn.turn] !== true })) },
          onStepToggle: toggleStep,
        }))))
        if (dropped > 0) body.push(h('p', { className: 'al-foot', key: 'dropped' }, t('dropped', { count: dropped })))
      }

      return h('div', { className: 'al-root' },
        h('style', { dangerouslySetInnerHTML: { __html: CSS } }),
        h('div', { className: 'al-scroll' }, h('div', { className: 'al-page' }, body)))
    }

    return {
      inject: ['slots', 'locale'],
      apply (ctx) {
        ctx.effect(() => ctx.locale.register(NS, { en, zh }), 'agent-loops: dictionaries')
        const t = ctx.locale.bind(NS)
        ctx.slots.inject('conversation.view', () => ctx.slots.register({
          name: 'conversation.view',
          id: 'agent-loops',
          order: 20,
          locale: NS,
          label: () => t('view.label'),
        }, AgentLoopsView))
      },
    }
  },
})
