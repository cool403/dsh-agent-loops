# dsh-agent-loops

A [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) plugin that answers one question about a session: **how many agent loops did each task run, and what did every loop actually do?**

It adds a **Loops** view beside Chat and Trajectory. Each task shows its loop count and a time breakdown; each loop expands into its prompts, model calls, tool calls, and answer.

## What it shows

| Level | Figures |
| --- | --- |
| Session | loops, tool calls, model calls, elapsed time |
| Task (one turn) | loop count, model calls, tool calls, wall time, and a model/tools/other time bar |
| Loop (one `step/start`…`step/end`) | model calls and retries, tool calls with duration and result, prompts that entered it, a short answer |

Every loop also shows the task prompt carried into it, because from the second loop on the model re-reads the same prompt rather than receiving a new one — without it, most loops would look prompt-less.

## Install

Add the bundle to a profile by its Git spec:

```
github:cool403/dsh-agent-loops
```

In the app: **Settings → Plugins → add** and paste that spec. The install adds the bundle to the profile's bundle list and turns the plugin on; the view appears after a page refresh.

Requirements: DeepSeek Harness with the session-projection subsystem and the Web conversation view (`conversation.view`). Built and tested against DSH `0.2.2-rc.3`.

## How it works

- `index.js` — a Host plugin registering the `loopLedger` **session projection**: a pure fold over the committed session log (`turn/start`, `step/start`, `user/message`, `assistant/message`, `assistant/attempt`, `llm/retry`, `tool/call`, `tool/result`, `step/end`, `turn/end`). Nothing is sampled and nothing is timed from a clock, so a reload, history paging, or compaction cannot change the figures.
- `client.js` — a Web client module contributing one `conversation.view` entry. It renders the projection value through `useProjection('loopLedger')`; the browser folds nothing.

No build step: plain ESM, one client bundle factory, one injected `<style>`. Colours come from the host theme tokens (`--dsw-alias-*`), so light and dark themes and both languages follow the app.

## Limits

- Text is clipped, not summarised: prompts keep 1000 characters (injected context 260), tool arguments 140, answers 220.
- Five prompts and forty tool calls are kept per loop; the rest are counted as “N more”.
- The newest 80 tasks are retained; older ones are counted in a footnote.
- Tasks with more than twelve loops show their newest twelve, with the rest behind one control.
- “Answered in …” is loop start to the model's first assembled answer, including any retry wait inside the loop.
- The system-prompt figure reports the latest rendered system prompt's character count, not its token cost.

More detail: [`docs/DETAIL.md`](docs/DETAIL.md). In the app the same document is the plugin's detail page.

## Development

The profile links (or checks out) this package, so edits take effect after a reinstall or refresh — there is nothing to compile. The four files that matter:

```
index.js            host plugin: the loopLedger projection
client.js           web client: the Loops view
cordis.patch.yml    inserts the plugin row
locale/{en,zh}.json display metadata for the Plugin Manager
```

## License

MIT — see [`LICENSE`](LICENSE).
