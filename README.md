# dsh-session-chat-tools

English | [中文](./README.zh.md)

A [DeepSeek Harness](https://github.com/deepseek-ai) (DSH) Web plugin for working across conversations:

- `session_archive` — archive the calling session, or another session by exact ID.
- `session_read` — read DSH's bounded, untrusted text snapshot of another session by exact ID.
- `session_send` — send a message to another ordinary session and receive a durable request ID.
- `session_wait` — wait for, or poll, the exact reply associated with a `session_send` request.
- **ID** header button — copy the exact ID of the currently open session.

> The session-row "..." menu already ships a built-in **Copy Session ID** item in DSH `0.2.1`
> (the last item of that menu). This plugin therefore no longer adds one; earlier releases injected a
> duplicate entry into that menu, which appeared as two copy items side by side.

`session_send` places one durable user message in the target's next ordinary turn. A cold ordinary session is resumed through the DSH Session controller before delivery. `session_wait` correlates the request ID with that exact target turn and returns only its visible assistant text; reasoning and tool traces are not exposed.

> **Fork notice.** This repository is a maintained fork of
> [Unintendedz/dsh-session-tools](https://github.com/Unintendedz/dsh-session-tools) by **Unintended**.
> The original design, tool surface, browser UI, and tests come from that project; this fork only
> carries the DSH `0.2.1-rc.5` compatibility work described under
> [Changes in this fork](#changes-in-this-fork). Many thanks to the original author — without that
> work this plugin would not exist. See [Credits](#credits-and-license).

## Compatibility

| DSH runtime | Plugin version | Status |
| --- | --- | --- |
| `0.2.1-rc.5` (Desktop Web, `desktop` profile) | `0.3.2` | Tested end-to-end |
| `0.1.1-rc.2` / `0.1.2-rc.1` | upstream `0.2.2` only | Use the [original repository](https://github.com/Unintendedz/dsh-session-tools) |

The `0.3.x` line requires the native **Session format v4** and the Host `sessionController`
service of DSH `0.2.1-rc.5`. It is not a drop-in replacement for DSH `0.1.x`.

## Install

From GitHub:

```sh
dsh plugin --profile desktop add github:Dantsy9/dsh-session-chat-tools#v0.3.3
```

From a local checkout (any absolute path):

```sh
dsh plugin --profile desktop add "/absolute/path/to/dsh-session-chat-tools"
```

Then restart the running DSH Web service (or the DSH desktop app): plugins are loaded when the
service starts.

> Do **not** install the npm package named `dsh-session-tools`. That is an unrelated, deprecated
> project by another author, pinned to DSH `0.1.0-rc.6`; installing it is rejected by the 0.2.x
> compatibility gate (`incompatible with dsh 0.2.1-rc.5`).

## Usage

To copy a session's ID, use the built-in **Copy Session ID** item in that row's three-dot menu, or —
for the session you have open — click **ID** in its header.

To ask another ordinary session to do work, call `session_send`:

```json
{
  "session_id": "session-target-id",
  "message": "Check the test results and summarize any failures."
}
```

The tool returns immediately with a `request_id`. Pass both IDs to `session_wait`:

```json
{
  "session_id": "session-target-id",
  "request_id": "request-id-from-session-send",
  "timeout_seconds": 60
}
```

`session_wait` returns `completed`, `running`, or `failed`. Its wait defaults to 60 seconds and
accepts 0–600 seconds; use `0` to poll. A `running` result is safe to wait on again with the same
IDs: waiting never resends the message or cancels the target.

You can also paste a copied ID into another conversation and ask it to call `session_read`, or ask it
to call `session_archive` with that ID. Calling `session_archive` without `session_id` archives the
current conversation.

## Update

Install the new version directory or tag again, then restart DSH Web:

```sh
dsh plugin --profile desktop add github:Dantsy9/dsh-session-chat-tools#v0.3.3
```

## Uninstall

```sh
dsh plugin --profile desktop remove dsh-session-chat-tools
```

## Changes in this fork

The upstream `0.2.2` targeted DSH `0.1.x`. Porting it to `0.2.1-rc.5` required these changes:

| Version | Change |
| --- | --- |
| `0.3.0` | Resolve the target Agent through the documented Host `sessionController.resolveAgent()` (which resumes a cold ordinary Session) instead of reaching into the internal Typert agent lookup; the Typert path remains as a fallback for profiles that do not compose the controller. Stable `session/not-found`, `session/agent-busy`, and `session/writer-held` failures are reported as readable errors. |
| `0.3.1` | Native Session format v4 retired the generic `source.kind: "plugin"` wrapper: a relay message must carry a producer-owned kind, so it is now `plugin:dsh-session-chat-tools` (exactly the shape the format's own v3→v4 migration produces). Before this fix every delivered turn failed with `format v4 message requires a producer-owned source kind`. |
| `0.3.2` | `session_send` drops queued messages that still carry the retired `plugin` kind. Such a row can never be delivered and would make that Session's later turns fail source admission. |
| `0.3.3` | Remove the DOM-injected session-row "Copy session ID" menu item. DSH `0.2.1` ships that item natively, so the injection produced two identical entries in one menu. The Session-header **ID** chip remains. |

Verification performed on DSH `0.2.1-rc.5`: 27 unit/bundle tests (26 pass, 1 skipped without a
native Session fixture), plus live cross-session round trips — a cold session resumed, received the
message, and its reply was collected through `session_wait`.

## Safety

- `session_read` uses DSH's native session-reference resolver. Returned text is bounded by the host and explicitly treated as untrusted context.
- `session_send` and `session_wait` require two different ordinary sessions. Self-targeting is rejected; subagent sessions must use DSH's built-in `send_message` tool.
- Only the session that created a request may wait for its result.
- `session_wait` returns only visible assistant text from the request's exact turn. Reasoning and tool traces are excluded, and returned UTF-8 text is bounded to 65,536 bytes.
- A wait timeout returns `running`; it does not resend the request or cancel the target. Cross-session wait cycles are rejected.
- `session_archive` preserves the session log; it does not delete conversation data.
- Tool arguments require exact, non-empty IDs and reject unknown fields.

## Development

```sh
npm install
npm test
```

Set `DSH_NATIVE_ROOT` to the installed DSH package root containing its `node_modules`, and use a
fresh temporary `DSH_HOME`, to include the native Session polling regression. It uses synthetic data
and does not boot a profile.

The host entry point is `lib/index.js`; browser source lives in `src/client.jsx`. `npm test`
rebuilds `lib/client.js` and runs the host and browser-bundle tests.

## Credits and license

- Original project: **[Unintendedz/dsh-session-tools](https://github.com/Unintendedz/dsh-session-tools)** by **Unintended** — design, tool surface, browser UI, tests, and the `0.1.x` implementation this fork starts from. Thank you.
- This fork: **Dantsy9/dsh-session-chat-tools** — DSH `0.2.1-rc.5` compatibility and maintenance.

Both are released under the MIT License. The original copyright notice is retained in
[LICENSE](./LICENSE), together with the fork's copyright line.
