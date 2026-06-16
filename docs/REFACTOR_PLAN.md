# N2N Post2Site 重构过程文档（v0.1.x 结构化解耦改造）

> 目标：保持对外行为不变，先把模块拆分和职责边界补齐，为后续特性（如动态能力适配）做底座，降低耦合、提高可测试性与可维护性。

## 1. 背景与动机

当前实现中，`src/index.ts` 承担了以下过多职责：

- MCP 工具注册
- 参数校验与业务流编排
- HTTP 客户端调用
- 响应封装

`src/content-client.ts` 中也同时承担了请求构建、鉴权、错误处理与状态校验。现有规模虽小，但未来增加能力动态化、重试、错误分类时会迅速耦合。

本次改造目标是把耦合点拆开，不新增或变更外部 API 语义。

## 2. 改造原则（硬约束）

1. 不改变 MCP 工具的调用输入/输出行为。
2. 不改变后端 Content API 的调用契约。
3. 不改变命令行入口、环境变量和发布产物协议。
4. 每个新模块应单一职责，文件改动最小且可回滚。
5. 保留现有测试覆盖语义；先保证现有测试通过（`npm run check`）。

## 3. 现状结构（重构前）

- `src/index.ts`
  - 启动 MCP 服务器
  - 注册全部 9 个工具
  - 工具内联处理 request/parse/result 输出
- `src/content-client.ts`
  - 直接构建并发送 `fetch`
  - 鉴权头、错误处理、JSON 解析集中在同一类
  - 状态校验（`updateDraft`）也在此处理
- `src/schemas/blog-post.ts`
  - 参数 schema 与运行时断言集中定义
- `src/tools/`
  - 每个 MCP 工具已拆到独立文件：`get-capabilities.ts`, `list-posts.ts`, `list-drafts.ts`, `get-post.ts`, `get-product-context.ts`, `create-post.ts`, `update-post.ts`, `update-draft.ts`, `publish-post.ts`

## 4. 目标结构（重构后）

目标是引入以下边界：

- `src/server.ts`：仅负责 MCP Server 的实例化与工具注册（`index.ts` 作为入口）。
- `src/tools/*Tool.ts`：每个 MCP 工具单文件（`get-capabilities.ts`, `list-posts.ts`, `list-drafts.ts`, `get-post.ts`, `get-product-context.ts`, `create-post.ts`, `update-post.ts`, `update-draft.ts`, `publish-post.ts`）。
- `src/services/`
  - `posts.ts`（可选）：封装 `updateDraft` 这类业务流（“读当前状态→校验→更新”）。
  - 后续扩展点：发布、列表拼装、策略判断。
- `src/transport/http.ts`
  - `HttpTransport` 抽象与默认实现（`fetch` 封装）。
  - 统一注入 `X-API-KEY`、`Authorization`、`Content-Type`。
- `src/result.ts`
  - 统一 MCP 文本结果格式。
- `src/errors.ts`（可选）
  - 自定义 API 错误对象（携带 endpoint、method、status、body）。
- `src/types/`
  - 放置会被服务层复用的公共类型（可选）。

> 说明：`src/tools` 目录已存在，可直接使用，先按最小重构只做当前 9 个工具文件即可。

## 5. 具体实施步骤

### 阶段 1：执行层切分（最低风险）

1. 新建 `src/result.ts`，抽离 `textResult()`。
2. 新建 `src/transport/http.ts` 与 `HttpTransport` 接口。
3. 重构 `ContentClient` 使用 transport 注入，去掉直接 `fetch` 依赖。
4. 拆出 `src/server.ts`，让 `index.ts` 只做启动与异常出口。

验收标准：

- 行为不变（工具响应 JSON 字符串包装不变）。
- `npm run check` 通过。

### 阶段 2：工具拆文件（中等改动）

1. 为每个 MCP tool 在 `src/tools/` 下新建处理模块。
2. 每个模块只做：参数校验 + 对应 service/client 调用 + 返回统一 result。
3. 将重复文案字符串逐步提取到常量（非强制）。

验收标准：

- `n2n_get_capabilities` 到 `n2n_publish_post` 全部可从新模块注册。
- 与现有功能的可见行为一致。

### 阶段 3：服务层与业务流集中化（可选但推荐）

1. 将 `updateDraft` 中的“先拉取状态再 PATCH”的状态策略移动到 `posts.ts` 服务。
2. 为未来新增业务动作预留 `PostService`。

验收标准：

- `updateDraft` 流程不变（仍拒绝非 draft）
- `tests/client.test.ts` 中的行为断言可保持通过。

### 阶段 4：文档与追踪更新

1. 在本文件补充阶段完成记录。
2. 可选地更新 `ROADMAP.md`，若该改造需要对外公开发布说明。
3. 更新 `CHANGELOG.md`（若版本号/可见改动需要记录）。
4. 如有新增文件夹，更新仓库文档索引（README 中可选）。

> 当前执行状态：阶段 1~2 已完成；阶段 3 作为可选项保留；阶段 4 文档补充已完成（结构变更说明已更新，本次未更新 `ROADMAP.md`/`CHANGELOG.md`）。

验收标准：

- 代码和文档结构一致。
- 未引入新外部行为依赖。

## 6. 回滚策略

- 所有改造分批提交（每个阶段单独 commit），遇到风险可回退最近提交。
- 每次提交前保留 `main` 分支上的行为对照：通过 `npm run check` 作为门槛。
- 不在功能层更改任何 schema/接口时，回滚风险低。

## 7. 风险与对策

1. **工具描述文字重复**
   - 风险：文本变更导致行为认知差异
   - 对策：保持文本不变；仅抽象常量。
2. **测试脆弱性上升**
   - 风险：拆分后导入路径变化导致 mock 失败
   - 对策：保留现有 public 行为与导入边界，测试逐项执行通过。
3. **过度重构（scope creep）**
   - 风险：把未要求的能力（动态能力发现）一起引入
   - 对策：本次只做解耦，不新增 schema 或协议。

## 8. 交付定义（Acceptance）

- `npm run check` 通过。
- 工具行为回归对照未变：
  - 发布流程
  - 草稿状态检查
  - 产品上下文读取
- 不引入新的运行时依赖。
- 不修改后端契约字段。

## 9. 里程碑时间建议（可选）

- 第一天：阶段 1~2（核心结构搭建）
- 第一天：阶段 3~4（文档与清理）
- 第二天：`npm run check` 与 smoke 验证（手工 1 次端到端）

## 10. 变更边界声明

本次方案不覆盖以下内容：

- 动态能力驱动 schema（这是 `ROADMAP` 中 v0.2 规划项）。
- 发布 API 新增功能。
- 新增工具。
- 后端能力模型扩展。
