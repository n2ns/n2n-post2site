# N2N Post2Site 架构说明（v0.1.2）

本文档说明 `n2n-post2site` 当前架构，目标是约束边界、保留接口兼容，并让后续改动有稳定接入点。

## 1. 系统定位

`n2n-post2site` 是 MCP server，作用是：

- 解析环境变量并创建 MCP Server 实例。
- 向 MCP 客户端暴露 9 个内容发布工具。
- 将工具参数转为对后端内容 API 的 HTTP 调用。
- 将后端返回值统一封装为 MCP 可展示文本。

它本身不承载持久化、权限管理、审核策略或内容排序决策；这些都应由后端 API 提供方实现。

## 2. 分层结构

### 2.1 运行入口层（`src/index.ts`）

- 使用 `createServer(loadConfig())` 创建 MCP 实例。
- 使用 `StdioServerTransport` 与 MCP 客户端通信。
- 仅负责进程生命周期与失败输出。

### 2.2 配置层（`src/config.ts`）

- 读取环境变量：
  - `CONTENT_API_BASE_URL`
  - `CONTENT_API_KEY`
- 校验缺失字段并报错。
- 统一清理 `CONTENT_API_BASE_URL` 末尾斜杠。

### 2.3 组装层（`src/server.ts`）

- 只做“构建与注册”职责：
  1. 构造 `ContentClient`
  2. 新建 `McpServer`
  3. 注册 9 个工具

当前注册顺序：

- `n2n_get_capabilities`
- `n2n_list_posts`
- `n2n_list_drafts`
- `n2n_get_post`
- `n2n_get_scope_context`
- `n2n_create_post`
- `n2n_update_post`
- `n2n_update_draft`
- `n2n_publish_post`

### 2.4 工具层（`src/tools/*.ts`）

每个文件对应一个 MCP tool：

- 参数校验（Zod schema + 业务约束断言）
- 调用 `ContentClient` 对应方法
- 返回统一 `text` 结果

工具层职责不包含底层 HTTP、请求头、JSON 解析或路由拼接。

### 2.5 传输与客户端层

- `src/transport/http.ts`
  - `HttpTransport` 接口
  - 默认 `FetchHttpTransport` 封装 `fetch`
  - 负责响应解析（JSON / text）、状态透传

- `src/content-client.ts`
  - 统一拼装路径与 HTTP 方法
  - 注入鉴权头（`X-API-KEY` / `Authorization`）
  - 统一处理非 2xx 报错为异常
  - 聚合列表参数与路由参数
  - 实现 `updateDraft` 的业务校验流程：
    1. 先调用 `GET /posts/{id_or_slug}`
    2. 校验 `status === 'draft'`
    3. 才允许 `PATCH /posts/{id_or_slug}`

### 2.6 模型与约束层（`src/schemas/blog-post.ts`）

- Zod schema 定义所有工具输入约束。
- `assertContentPostShape` 强化 `type/content_scope` 规则：
  - `type=guide` 必须带 `content_scope`
  - 非 guide 不允许带 `content_scope`
  - `content_scope` 格式必须是 `kind:key`

### 2.7 输出层（`src/result.ts`）

- 用 `createTextResult` 将任意后端返回内容转为 MCP `content: [{type:'text', text:...}]`。
- 维持了所有工具一致的返回格式。

## 3. 请求流

典型调用流（`n2n_create_post`）：

1. MCP 工具接收参数
2. Zod schema 校验 + 业务断言
3. 调用 `ContentClient.createPost`
4. `ContentClient` 构造请求并通过 `HttpTransport.request` 发起 HTTP
5. 解析响应体并返回
6. 工具层用 `createTextResult` 包装并返回给 MCP

## 4. 关键不变式

- 工具契约不变（9 个工具 + 名称 + 入参语义）
- 后端接口契约不变（见 `docs/BACKEND_API.md`）
- CLI/部署接口不变（`bin` 指向 `dist/index.js`）
- 错误行为保持“尽早失败”：缺少配置或非法参数立即报错

## 5. 测试边界

- `tests/server.test.ts`：保证 9 个工具完整注册。
- `tests/transport.test.ts`：验证 `FetchHttpTransport` 和 `ContentClient` 的请求层行为。

## 6. 当前架构限制与改造方向

当前设计有清晰分层，但仍是“轻量单体” MCP server：

- 无运行时重试、幂等保护、限流和退避策略
- 无完整错误分类体系（目前统一抛错）
- 工具能力说明仍以静态文档描述为主

后续可扩展点：

- 新增 `errors.ts` 统一 API 错误模型
- 在客户端层引入策略性重试/幂等
- 引入服务层（如 `PostService`）汇聚更复杂业务流
- 添加端到端契约测试覆盖错误返回形态
