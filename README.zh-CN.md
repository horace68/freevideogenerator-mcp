# FreeVideoGenerator MCP

[English](README.md) · [客户端配置](docs/clients.md) · [17 个工具](docs/tools.md) · [排查问题](docs/troubleshooting.md) · [Registry 发布](docs/publishing.md)

让 AI 客户端使用你的 [FreeVideoGenerator](https://freevideogenerator.app/zh) 账号生成图片和视频：发现当前模型与 Quick Apps、查询积分和报价、上传参考素材、提交单个或批量任务，并获取进度和结果。

本仓库提供公开连接示例、无依赖的配置/安装助手、可选 agent Skill，以及官方 MCP Registry 元数据。MCP 服务运行在现有网站中；认证、计费、存储和生成服务保持在原有后端。助手用于输出配置和安装 Skill。

## 连接服务

远程端点，传输方式为 **Streamable HTTP**：

```text
https://freevideogenerator.app/api/mcp
```

在客户端发起浏览器 OAuth 授权，登录 FreeVideoGenerator 并核对权限范围。生成消耗所连接账号的积分；查询能力、模型和报价不会提交付费生成任务。无需提供模型供应商密钥或数据库凭据。

**Claude Code**

```sh
claude mcp add --transport http --scope user freevideogenerator https://freevideogenerator.app/api/mcp
```

进入 `/mcp`，完成授权。

**Codex**

```sh
codex mcp add freevideogenerator --url https://freevideogenerator.app/api/mcp
codex mcp login freevideogenerator
```

Cursor、Gemini CLI、Kimi Code、ZCode、ChatGPT 和开发者 API key 的配置见[客户端指南](docs/clients.md)。直接连接远程 URL；不要把本仓库助手配置成本地 stdio MCP 服务。

## 可选 Skill 与助手

需要 Git、Node.js 20+。无需 npm 依赖，没有安装钩子。

```sh
git clone https://github.com/horace68/freevideogenerator-mcp.git
cd freevideogenerator-mcp
node bin/freevideogenerator.mjs config codex
node bin/freevideogenerator.mjs install-skill codex
node bin/freevideogenerator.mjs doctor
```

`config` 输出可合并的配置片段，支持 `codex`、`claude`、`cursor`、`gemini`、`kimi`、`zcode`。它不会修改已有配置或代替客户端登录。

`install-skill codex` 安装到 `~/.agents/skills/freevideogenerator`；`install-skill claude` 安装到 `~/.claude/skills/freevideogenerator`。已有目录不会被覆盖。Skill 被发现后，在 Codex 使用 `$freevideogenerator`，Claude Code 使用 `/freevideogenerator`；未出现时重启客户端。MCP 连接与授权需要单独完成。

项目内安装或其他兼容客户端可指定 **skills 父目录**：

```sh
node bin/freevideogenerator.mjs install-skill custom --dir /path/to/project/.agents/skills --dry-run
node bin/freevideogenerator.mjs install-skill custom --dir /path/to/project/.agents/skills
```

更新时先比较并保留自定义修改，将旧目录移到其他位置后再安装。卸载仅删除已安装的 `freevideogenerator` 目录；服务端撤销授权是独立操作。

`doctor` 检查公开 OAuth 资源发现、授权服务器/PKCE 配置及 MCP 未认证挑战。它不发送凭据、不创建任务、不消耗积分；通过不代表实际生成成功或全部客户端兼容。本助手未发布到 npm，请从 Git 仓库使用。

## 示例任务

> 查一下可用的图片、视频模型和我的积分。使用我选中的素材库图片，为一个 5 秒产品视频报价；不超过 100 积分就生成，跟踪任务并返回结果与任务链接。网络重试时保持原请求 ID。

本地文件需先调用 `create_upload`，通过返回的地址上传 multipart `file` 字段，或使用浏览器上传页，再调用 `get_upload` 获取文件 ID。聊天附件和本地路径不会自动变成服务可读取的素材。[工具指南](docs/tools.md)包含报价、批量任务、素材和失败恢复说明。

服务支持图片/视频生成、已配置的 Quick Apps 和分镜建议。具体模型、模式和价格以运行时发现结果为准。音频文件可用于受支持的参考输入；当前不承诺纯音频生成、自动时间线剪辑、成片拼接、购买或发布功能。

## 权限与验证

OAuth 在授权范围内访问所连接账号的数据，范围不是逐个项目选择。[设置 → 连接](https://freevideogenerator.app/zh/settings/connections)管理 OAuth，[设置 → API keys](https://freevideogenerator.app/zh/settings/apikeys)管理开发者密钥。撤销会阻止后续访问及素材凭据，已接受的任务仍继续。结果链接约十分钟过期，可通过 MCP 获取新链接。[安全与数据范围](SECURITY.md)。

服务在 2026-10-19 的发布验收中记录了 OAuth/PKCE 与刷新、17 个工具、API key、实际图片/视频完成、批量重试计费、上传/导入和范围下载。本仓库的公开检查单独验证发现配置与认证挑战；尚未在这里逐个完成客户端 OAuth 和生成全流程。[验证状态](docs/clients.md#verification-status)。

[server.json](server.json) 描述的远程服务 `io.github.horace68/freevideogenerator`（`1.0.1`）已于 2026-10-19 发布到[官方 MCP Registry](https://registry.modelcontextprotocol.io/v0.1/servers/io.github.horace68%2Ffreevideogenerator/versions/1.0.1)。公开回读确认状态为 active、最新版本，端点元数据一致。Registry 记录用于发现现有服务，不会把助手发布到 npm，也不会自动安装 Skill。[发布与凭证](docs/publishing.md)。

## 开发

```sh
npm run check
npm test
npm pack --dry-run
```

测试覆盖客户端格式、隔离安装、已有目录及符号链接保护、CLI 错误处理、公开诊断和 Registry 元数据。CI 配置覆盖 Linux/macOS/Windows 和 Node.js 20/22/24，不包含认证或付费线上调用。

MIT 许可证适用于本仓库助手、示例与 Skill，不代表服务积分、网站后端或用户素材的使用授权。助手保留上游 MIT 版权声明。
