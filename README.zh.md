# dsh-session-chat-tools

[English](./README.md) | 中文

一个用于跨对话协作的 [DeepSeek Harness](https://github.com/deepseek-ai)（DSH）Web 插件：

- `session_archive`：归档当前会话，或按精确 ID 归档另一个会话。
- `session_read`：按精确 ID 读取另一个会话经过 DSH 限长处理的不可信文本快照。
- `session_send`：向另一个普通会话发送消息，并取得一个持久的请求 ID。
- `session_wait`：等待或轮询某次 `session_send` 请求所对应的精确回复。
- 每个已有内容的会话行都在“三个点”菜单中提供 **复制会话 ID**。
- 当前已打开会话的顶部提供 **ID** 按钮，可复制其精确 ID。

`session_send` 会把一条持久的用户消息放入目标会话的下一个普通 turn；目标会话若未运行，会先由
DSH 的 Session controller 按记录的上下文恢复再投递。`session_wait` 用请求 ID 精确关联目标
turn，只返回其中对用户可见的 assistant 文本，不暴露推理或工具轨迹。

> **Fork 说明**：本仓库是 **[Unintendedz/dsh-session-tools](https://github.com/Unintendedz/dsh-session-tools)**
> 的维护分支，原项目作者为 **Unintended**。工具设计、宿主与浏览器实现、测试均来自原项目；
> 本分支只包含针对 DSH `0.2.1-rc.5` 的兼容性改动（见[本分支的改动](#本分支的改动)）。
> 特此感谢原作者——没有原项目就没有这个插件。许可证信息见[致谢与许可](#致谢与许可)。

## 适用版本

| DSH 运行时 | 插件版本 | 状态 |
| --- | --- | --- |
| `0.2.1-rc.5`（Desktop Web，`desktop` profile） | `0.3.2` | 已端到端验证 |
| `0.1.1-rc.2` / `0.1.2-rc.1` | 仅上游 `0.2.2` | 请使用[原仓库](https://github.com/Unintendedz/dsh-session-tools) |

`0.3.x` 依赖原生 **Session 格式 v4** 与 DSH `0.2.1-rc.5` 提供的宿主 `sessionController` 服务，
不能直接用于 DSH `0.1.x`。

## 安装

从 GitHub 安装：

```sh
dsh plugin --profile desktop add github:Dantsy9/dsh-session-chat-tools#v0.3.2
```

从本地目录安装（任意绝对路径）：

```sh
dsh plugin --profile desktop add "/absolute/path/to/dsh-session-chat-tools"
```

随后重启正在运行的 DSH Web 服务（或 DSH 桌面端）。插件只会在服务启动时装载。

> 请不要安装 npm 上名为 `dsh-session-tools` 的包。那是另一位作者的废弃项目，依赖被钉死在
> DSH `0.1.0-rc.6`，会被 0.2.x 的兼容性检查直接拒绝（`incompatible with dsh 0.2.1-rc.5`）。

## 使用

在会话行的“三个点”菜单中选择 **复制会话 ID**，也可以打开会话后点击顶部的 **ID**。

要让另一个普通会话处理任务，先调用 `session_send`：

```json
{
  "session_id": "session-target-id",
  "message": "检查测试结果，并汇总所有失败项。"
}
```

工具会立即返回 `request_id`。把两个 ID 一起传给 `session_wait`：

```json
{
  "session_id": "session-target-id",
  "request_id": "request-id-from-session-send",
  "timeout_seconds": 60
}
```

`session_wait` 返回 `completed`、`running` 或 `failed`。默认等待 60 秒，允许 0–600 秒；传 `0`
表示只轮询。收到 `running` 后可以继续用相同的两个 ID 等待，因为等待不会重发消息，也不会取消目标会话。

也可以把复制的 ID 粘贴到另一个对话里，让它调用 `session_read` 读取内容，或调用 `session_archive`
归档该会话；`session_archive` 省略 `session_id` 时归档当前对话。

## 更新

重新安装目标版本或标签，然后重启 DSH Web：

```sh
dsh plugin --profile desktop add github:Dantsy9/dsh-session-chat-tools#v0.3.2
```

## 卸载

```sh
dsh plugin --profile desktop remove dsh-session-chat-tools
```

## 本分支的改动

上游 `0.2.2` 面向 DSH `0.1.x`，迁移到 `0.2.1-rc.5` 需要三处改动：

| 版本 | 改动 |
| --- | --- |
| `0.3.0` | 目标 Agent 改为通过宿主公开的 `sessionController.resolveAgent()` 解析（它会按记录恢复冷会话），不再依赖内部的 Typert agent lookup；未组合该 controller 的 profile 仍回退到 Typert。`session/not-found`、`session/agent-busy`、`session/writer-held` 会转成可读错误。 |
| `0.3.1` | 原生 Session 格式 v4 废弃了通用的 `source.kind: "plugin"` 包装，转发消息必须使用生产者自有 kind，故改为 `plugin:dsh-session-chat-tools`（与格式层 v3→v4 迁移生成的形状一致）。修复前每次投递都会以 `format v4 message requires a producer-owned source kind` 失败。 |
| `0.3.2` | `session_send` 会清掉队列中仍带旧 `plugin` kind 的消息：这类记录永远无法投递，并且会让该会话后续 turn 持续因 source 校验失败。 |

在 DSH `0.2.1-rc.5` 上的验证：28 项单元/浏览器包测试（27 通过、1 项因缺少原生 Session 环境跳过），
以及真实跨会话往返——冷会话被恢复、收到消息，并通过 `session_wait` 取回了它的回复。

## 安全与数据行为

- `session_read` 使用 DSH 原生的会话引用解析器；返回文本受宿主限长，并明确作为不可信上下文处理。
- `session_send` 和 `session_wait` 要求来源与目标是两个不同的普通会话。插件会拒绝向自己发送；子 agent 会话仍须使用 DSH 内置的 `send_message` 工具。
- 只有创建请求的来源会话可以等待该请求的结果。
- `session_wait` 只返回请求所对应精确 turn 中对用户可见的 assistant 文本；不包含推理和工具轨迹，返回的 UTF-8 文本最多为 65,536 字节。
- 等待超时只会返回 `running`，不会重发请求，也不会取消目标；跨会话等待环会被拒绝。
- `session_archive` 只隐藏会话并保留日志，不会删除对话数据。
- 工具参数要求精确、非空的 ID，未知字段会被拒绝。

## 开发

```sh
npm install
npm test
```

将 `DSH_NATIVE_ROOT` 指向已安装的 DSH 包根目录（包含其 `node_modules` 的目录），并设置全新临时
`DSH_HOME`，即可运行真实 Session 轮询回归测试。它使用合成数据，不启动 profile。

宿主入口是 `lib/index.js`，浏览器源码位于 `src/client.jsx`。`npm test` 会重新构建
`lib/client.js`，然后运行宿主与浏览器包测试。

## 致谢与许可

- 原项目：**[Unintendedz/dsh-session-tools](https://github.com/Unintendedz/dsh-session-tools)**，作者 **Unintended** —— 工具设计、宿主与浏览器实现、测试，以及本分支的起点（`0.1.x` 实现）。衷心感谢。
- 本分支：**Dantsy9/dsh-session-chat-tools** —— DSH `0.2.1-rc.5` 兼容性与维护。

两者均以 MIT 许可证发布；原版权声明保留在 [LICENSE](./LICENSE) 中，并附上本分支的版权行。
