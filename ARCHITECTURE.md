# 系统架构文档

**文档版本**: v2.0  
**生成时间**: 2026-02-14  
**项目**: Idea Create Everything  
**状态**: Phase 1 核心功能开发中

---

## 1. 项目整体架构

### 1.1 架构模式

#### 采用架构：分层微服务架构（BFF模式 + 容器化部署）

**为什么选择这种模式：**

1. **前后端分离**：前端专注于UI/UX交互，后端专注于业务逻辑和数据处理
2. **API网关模式**：通过Nginx统一入口，支持负载均衡和反向代理
3. **服务化拆分**：AI服务、搜索服务、树形服务独立部署，便于扩展和维护
4. **数据层分离**：PostgreSQL持久化 + Redis缓存，兼顾可靠性和性能
5. **容器化部署**：Docker Compose编排，支持跨平台一键部署（Windows + WSL2）
6. **无状态服务设计**：便于水平扩展和故障恢复

#### 架构图描述

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              客户端层                                    │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────┐ │
│  │   桌面浏览器     │  │   平板设备      │  │     手机浏览器           │ │
│  │ (Chrome/Edge)   │  │  (iPad/安卓)    │  │    (响应式适配)          │ │
│  └────────┬────────┘  └────────┬────────┘  └───────────┬───────────────┘ │
└───────────┼──────────────────┼──────────────────────┼──────────────────┘
            │                  │                      │
            └──────────────────┼──────────────────────┘
                               │
┌───────────────────────────────▼───────────────────────────────────────┐
│                        网关层 (Nginx)                                  │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │  - 静态资源服务 (Next.js build)                                  │ │
│  │  - API请求转发 (/api/* → FastAPI)                                │ │
│  │  - WebSocket代理 (升级连接)                                       │ │
│  │  - SSL/TLS终止 (生产环境)                                        │ │
│  │  - 负载均衡 (未来扩展)                                            │ │
│  └─────────────────────────────────────────────────────────────────┘ │
└───────────────────────────────┬───────────────────────────────────────┘
                                │
            ┌───────────────────┼───────────────────┐
            │                   │                   │
┌───────────▼────────────┐ ┌────▼──────┐ ┌──────────▼────────────┐
│      前端服务层         │ │ 后端服务层 │ │       数据层          │
│  ┌──────────────────┐  │ │ ┌────────┐ │ │  ┌──────────────────┐ │
│  │   Next.js 15     │  │ │ │FastAPI │ │ │  │  PostgreSQL 15   │ │
│  │   - React 18     │  │ │ │Python  │ │ │  │  - 主数据库       │ │
│  │   - TypeScript   │  │ │ │ 3.11   │ │ │  │  - 项目数据       │ │
│  │   - SSR/CSR      │  │ │ └───┬────┘ │ │  │  - 对话历史       │ │
│  └──────────────────┘  │ │     │      │ │  │  - 自动备份       │ │
│  ┌──────────────────┐  │ │ ┌───▼────┐ │ │  └──────────────────┘ │
│  │   状态管理        │  │ │ │AI服务  │ │ │  ┌──────────────────┐ │
│  │   Zustand        │  │ │ │-多API  │ │ │  │     Redis 7      │ │
│  │   React Query    │  │ │ │-重试   │ │ │  │  - 会话缓存       │ │
│  └──────────────────┘  │ │ └───┬────┘ │ │  │  - 查询缓存       │ │
│  ┌──────────────────┐  │ │     │      │ │  │  - 限流计数       │ │
│  │   UI组件库        │  │ │ ┌───▼────┐ │ │  └──────────────────┘ │
│  │   shadcn/ui      │  │ │ │搜索服务│ │ │  ┌──────────────────┐ │
│  │   Tailwind       │  │ │ │Brave  │ │ │  │    文件存储       │ │
│  │   Framer Motion  │  │ │ └───┬────┘ │ │  │  - 导出文件       │ │
│  └──────────────────┘  │ │     │      │ │  │  - 临时缓存       │ │
│  ┌──────────────────┐  │ │ ┌───▼────┐ │ │  └──────────────────┘ │
│  │   可视化组件      │  │ │ │树形服务│ │ └───────────────────────┘
│  │   React-Flow     │  │ │ └───┬────┘ │
│  │   D3.js          │  │ │     │      │
│  └──────────────────┘  │ │ ┌───▼────┐ │
│                        │ │ │自动备份│ │
└────────────────────────┘ │ └────────┘ │
                           └────────────┘
```

**核心设计原则：**

1. **单一职责**：每个服务只负责一个业务领域
2. **无状态服务**：后端服务无状态，状态存储在Redis/PostgreSQL
3. **异步通信**：AI调用、搜索查询均采用异步模式（SSE/WebSocket）
4. **缓存优先**：频繁访问数据优先从Redis获取
5. **自动恢复**：服务崩溃后可自动重启并恢复状态
6. **多层持久化**：内存 → Redis → PostgreSQL → 本地文件 → 云存储

### 1.2 核心模块划分

| 模块名称 | 模块类型 | 主要职责 | 关键技术 | 状态 |
|---------|---------|---------|---------|------|
| **前端核心模块** | 前端 | UI渲染、路由管理、全局布局、主题配置 | Next.js 15, React 18, TypeScript 5.3 | ✅ 已完成 |
| **API配置模块** | 前端 | 多API密钥管理、模型选择、余额查询、测试连接 | React Context, LocalStorage, 加密存储 | ⏳ Phase 1 |
| **树形编辑器模块** | 前端 | 可视化树形结构、节点CRUD、拖拽编辑、缩放 | React-Flow 12, D3.js 7, Zustand | ⏳ Phase 1 |
| **AI对话模块** | 前后端 | 多轮对话、上下文管理、流式输出、提示词工程 | WebSocket/SSE, Prompt工程 | ⏳ Phase 1 |
| **项目服务模块** | 后端 | 项目CRUD、版本管理、自动保存、数据验证 | FastAPI, SQLAlchemy 2.0 | ✅ 基础完成 |
| **AI服务模块** | 后端 | 多API适配（NVIDIA/OpenAI）、智能补全、重试机制 | OpenAI SDK, AsyncIO, 指数退避 | ⏳ Phase 1 |
| **搜索服务模块** | 后端 | BraveSearch API集成、结果缓存、异步查询 | Brave API, Redis Cache | ⏳ Phase 2 |
| **树形服务模块** | 后端 | 树形结构算法、导出生成、优化建议、完整性检查 | 递归算法, JSON Schema, 物化路径 | ⏳ Phase 1 |
| **自动备份模块** | 后端 | 定时备份（每小时）、崩溃恢复、版本历史 | APScheduler, Celery, 压缩加密 | ⏳ Phase 1 |
| **数据库模块** | 数据层 | 数据持久化、事务管理、索引优化、LTREE扩展 | PostgreSQL 15, Alembic | ✅ 已完成 |
| **缓存模块** | 数据层 | 会话缓存、查询缓存、分布式锁、限流控制 | Redis 7, Redlock | ✅ 已完成 |

---

## 2. 技术栈选型

### 2.1 核心技术

#### 编程语言及版本

| 层级 | 语言 | 版本 | 选型理由 |
|------|------|------|---------|
| 前端 | TypeScript | 5.3+ | 类型安全、IDE支持好、React生态首选 |
| 后端 | Python | 3.11+ | AI生态丰富、FastAPI高性能、异步支持好 |
| 数据库 | SQL | PostgreSQL 15 | JSON支持好、全文搜索、ACID合规、LTREE扩展 |
| 脚本 | Shell/Bash/PowerShell | - | Docker启动脚本、Windows一键启动 |

#### 主要框架/库

**前端技术栈：**
```
核心框架: Next.js 15.1 (App Router)
├── React 18.2 (并发特性、自动批处理)
├── React-DOM 18.2
├── TypeScript 5.3
│
UI层:
├── Tailwind CSS 3.4 (原子化CSS、JIT编译)
├── shadcn/ui (Radix UI封装、无障碍支持)
├── Framer Motion 11 (动画库、手势交互)
├── Lucide React (图标库)
│
状态管理:
├── Zustand 4.4 (轻量、无样板代码)
├── React Query 5 (服务端状态、缓存、自动重取)
│
可视化:
├── React-Flow 12 (节点编辑器、树形图、拖拽)
├── D3.js 7 (复杂可视化、力导向图)
│
工具:
├── Axios (HTTP客户端、拦截器、自动重试)
├── date-fns (日期处理、轻量)
├── zod (Schema验证、类型安全)
├── html-to-image (导出PNG/SVG)
├── jspdf (导出PDF)
└── clsx/tailwind-merge (类名处理)
```

**后端技术栈：**
```
核心框架: FastAPI 0.109
├── Python 3.11
├── Uvicorn 0.27 (ASGI服务器)
├── Pydantic 2.5 (数据验证、Settings管理)
│
数据库:
├── SQLAlchemy 2.0 (ORM、异步支持)
├── Alembic 1.13 (数据库迁移)
├── asyncpg 0.29 (PostgreSQL异步驱动)
├── redis-py 5.0 (Redis客户端)
│
AI集成:
├── openai 1.12 (OpenAI SDK、兼容多API)
├── httpx 0.26 (异步HTTP、API调用)
│
导出生成:
├── reportlab (PDF生成)
├── markdown (MD格式化)
├── Pillow (图像处理)
│
任务调度:
├── APScheduler 3.10 (定时任务、自动备份)
│
工具:
├── python-dotenv 1.0 (环境变量管理)
├── loguru 0.7 (结构化日志)
├── tenacity 8.2 (重试机制、指数退避)
├── cryptography 42.0 (API密钥加密)
├── python-jose 3.3 (JWT、安全验证)
└── passlib 1.7 (密码加密)
```

#### 数据库/缓存

**PostgreSQL 15（主数据库）**

- **用途**：持久化存储项目数据、用户配置、历史版本、自动备份
- **关键表设计**：
  - `projects` - 项目基础信息（嵌套集模型存储）
  - `nodes` - 树形节点数据（Materialized Path + LTREE扩展）
  - `conversations` - AI对话历史（JSONB数组存储消息）
  - `api_configs` - API密钥配置（AES加密存储）
  - `backups` - 自动备份记录
- **特性**：
  - JSONB字段存储动态属性
  - GIN索引加速搜索
  - LTREE扩展支持树形路径查询
  - 全文搜索支持中文

**Redis 7（缓存层）**

- **用途**：会话缓存、查询缓存、分布式锁、实时数据、限流控制
- **数据结构**：
  - `session:{id}` - 用户会话 (Hash, TTL=30min)
  - `project:{id}:cache` - 项目缓存 (Hash, TTL=10min)
  - `search:{query}` - 搜索结果 (String, TTL=3600)
  - `rate_limit:{ip}` - 限流计数 (String, TTL=60)
  - `autosave:{project_id}` - 自动保存队列 (List)
- **持久化**：RDB快照5分钟 + AOF每秒，防止数据丢失

#### 中间件

| 中间件 | 版本 | 用途 |
|--------|------|------|
| Nginx | 1.25 | 反向代理、静态资源、SSL终端、WebSocket升级、负载均衡 |
| Docker | 24.0+ | 容器化、隔离部署、环境一致性 |
| Docker Compose | 2.23+ | 多容器编排、服务依赖管理、健康检查 |

### 2.2 工具链

#### 构建工具

```
前端构建:
├── Next.js CLI (内置Webpack/Turbopack)
├── SWC (Rust编译器、极速转译)
├── PostCSS (CSS处理、Tailwind集成)
└── TypeScript Compiler (严格类型检查)

后端构建:
├── pip (包管理)
├── requirements.txt (依赖锁定、版本固化)
├── Dockerfile (多阶段构建、减小镜像)
└── Docker Compose (服务编排、依赖启动顺序)
```

#### 测试框架

```
前端测试:
├── Vitest (单元测试、Vite原生、快速)
├── React Testing Library (组件测试、用户行为模拟)
├── Playwright (E2E测试、跨浏览器、截图对比)
└── MSW (API Mock、拦截HTTP请求)

后端测试:
├── pytest (单元/集成测试)
├── pytest-asyncio (异步测试支持)
├── pytest-cov (覆盖率报告)
├── httpx (HTTP测试客户端)
└── factory-boy (测试数据生成)
```

#### 代码质量工具

```
前端:
├── ESLint 8 (静态分析、React Hooks规则、TypeScript规则)
├── Prettier 3 (代码格式化、统一风格)
├── TypeScript (严格类型检查)
└── Husky + lint-staged (Git钩子、提交前检查)

后端:
├── Ruff (Python linter、极速、替代flake8+pylint)
├── Black (代码格式化、统一风格)
├── mypy (静态类型检查)
├── Bandit (安全扫描、检测漏洞)
└── pre-commit (Git钩子、多工具集成)
```

---

## 3. 模块详细设计

### 模块1：前端核心模块 (Frontend Core)

- **职责**：应用入口、路由管理、全局布局、主题配置、错误边界
- **输入**：用户浏览器请求、路由参数、主题偏好
- **输出**：渲染的React组件树、HTML页面、主题样式
- **依赖**：Next.js框架、React生态、Tailwind CSS
- **接口**：
  - `layout.tsx` - 根布局组件（Provider包裹）
  - `page.tsx` - 页面组件（App Router）
  - `loading.tsx` - 加载状态骨架屏
  - `error.tsx` - 错误边界（全局错误捕获）
  - `not-found.tsx` - 404页面
- **关键类/函数**：
  - `RootLayout` - 全局布局提供者
  - `ThemeProvider` - 深色/浅色模式切换（next-themes）
  - `QueryProvider` - React Query客户端配置
  - `ToastProvider` - 全局通知提示
  - `ErrorBoundary` - React错误边界

### 模块2：API配置中心模块 (API Config Center)

- **职责**：管理多个AI API密钥、模型选择、余额查询、测试连接
- **输入**：用户配置的API密钥、模型选择、基础URL
- **输出**：加密存储的API配置、当前激活的模型、余额信息
- **依赖**：LocalStorage（前端缓存）、后端加密存储、各API服务
- **接口**：
  - `GET /api/configs` - 获取所有配置（脱敏返回）
  - `POST /api/configs` - 添加新配置（服务端加密）
  - `PUT /api/configs/{id}` - 更新配置
  - `DELETE /api/configs/{id}` - 删除配置
  - `POST /api/configs/{id}/test` - 测试API连接
  - `GET /api/configs/{id}/balance` - 查询余额（支持NVIDIA）
  - `POST /api/configs/{id}/activate` - 激活指定配置
- **关键类/函数**：
  - `ApiConfigCard` - 配置卡片组件（展示、编辑、删除）
  - `ApiConfigForm` - 配置表单组件（验证、提交）
  - `ModelSelector` - 模型选择下拉框
  - `useApiConfigs` - 配置状态管理Hook（Zustand）
  - `encryptConfig` - AES-256-GCM配置加密
  - `testApiConnection` - API连通性测试（发送测试消息）
  - `getModelBalance` - 余额查询（NVIDIA API特有）

**安全设计**：
- API密钥前端输入后即时加密
- 服务端存储加密后的密文
- 返回给前端时脱敏显示（只显示前4位和后4位）
- 传输使用HTTPS/TLS

### 模块3：树形可视化编辑器模块 (Tree Editor)

- **职责**：项目结构的可视化展示、节点CRUD操作、交互编辑、导出预览
- **输入**：树形JSON数据、用户操作事件（点击、拖拽、键盘、缩放）
- **输出**：更新后的树形数据、视图状态变更、导出预览
- **依赖**：React-Flow/D3.js、Zustand状态管理、树形服务API
- **接口**：
  - `TreeView` - 树形主组件（React-Flow包装）
  - `TreeNode` - 节点组件（可自定义样式）
  - `TreeEdge` - 连线组件（贝塞尔曲线）
  - `useTreeState` - 树形状态管理（增删改查）
  - `TreeToolbar` - 工具栏组件（添加、删除、导出、视图切换）
  - `NodeEditor` - 节点编辑器（内联编辑）
  - `TreeMiniMap` - 小地图导航
  - `SearchPanel` - 节点搜索过滤
- **关键类/函数**：
  - `TreeLayoutEngine` - 自动布局算法（层级布局/力导向布局）
  - `NodeRenderer` - 节点渲染（支持自定义样式和图标）
  - `useDragAndDrop` - 拖拽排序逻辑（同级重排、跨级移动）
  - `useZoomPan` - 缩放和平移控制
  - `exportToImage` - 导出PNG/SVG（html-to-image）
  - `searchNodes` - 节点搜索过滤（支持正则）
  - `expandToNode` - 自动展开到指定节点

**性能优化**：
- 虚拟滚动（500+节点）
- 节点懒加载
- 防抖保存

### 模块4：AI对话模块 (AI Chat)

- **职责**：多轮对话管理、流式输出、上下文记忆、提示词工程、对话历史
- **输入**：用户消息、项目上下文、历史对话、当前激活的API配置
- **输出**：AI回复、思考过程、结构化建议、流式Token
- **依赖**：WebSocket/SSE、AI服务后端、对话历史存储
- **接口**：
  - `POST /api/chat` - 发送消息（非流式）
  - `GET /api/chat/stream` - 流式回复（SSE Server-Sent Events）
  - `GET /api/chat/history` - 获取对话历史
  - `DELETE /api/chat/session` - 清除会话
  - `POST /api/chat/feedback` - 消息反馈（点赞/点踩）
- **关键类/函数**：
  - `ChatInterface` - 对话UI组件（容器）
  - `MessageList` - 消息列表（支持Markdown渲染）
  - `MessageInput` - 输入框（多行、快捷键）
  - `StreamingMessage` - 流式消息显示（逐字输出）
  - `ContextPanel` - 上下文面板（显示引用的项目内容）
  - `useStreamingChat` - 流式响应Hook（EventSource管理）
  - `buildPrompt` - 提示词构建（领域特定模板）
  - `ContextManager` - 上下文窗口管理（Token限制、滑动窗口）
  - `MessageParser` - 消息解析（提取结构化数据）

**提示词工程**：
- 领域特定模板（软件开发、化妆品、网站）
- 上下文注入（当前项目结构）
- 少样本示例（few-shot prompting）

### 模块5：项目服务模块 (Project Service)

- **职责**：项目CRUD、自动保存、版本历史、数据验证、崩溃恢复
- **输入**：项目数据、保存事件、恢复请求、导出请求
- **输出**：项目实体、保存确认、历史版本、导出文件
- **依赖**：PostgreSQL、Redis、自动备份模块、树形服务
- **接口**：
  - `POST /api/projects` - 创建项目
  - `GET /api/projects` - 获取项目列表（分页、搜索）
  - `GET /api/projects/{id}` - 获取项目详情
  - `PUT /api/projects/{id}` - 更新项目
  - `DELETE /api/projects/{id}` - 删除项目
  - `POST /api/projects/{id}/autosave` - 自动保存（防抖触发）
  - `GET /api/projects/{id}/history` - 版本历史（时间轴）
  - `POST /api/projects/{id}/restore` - 恢复指定版本
  - `POST /api/projects/{id}/duplicate` - 复制项目
- **关键类/函数**：
  - `ProjectManager` - 项目管理器（CRUD封装）
  - `AutoSaveScheduler` - 自动保存调度器（10秒间隔）
  - `VersionControl` - 版本控制（增量存储）
  - `validateProjectData` - 数据验证（Pydantic Schema）
  - `CrashRecovery` - 崩溃恢复（从Redis检查未保存数据）

**自动保存策略**：
- 用户编辑防抖500ms后触发本地保存
- 每10秒自动保存到后端
- 崩溃后自动恢复（从Redis检查未完成保存）

### 模块6：AI服务模块 (AI Service)

- **职责**：多API适配、智能补全、重试降级、负载均衡、Token计算
- **输入**：提示词、模型参数、用户配置、对话历史
- **输出**：AI生成的文本、结构化数据、使用统计、错误信息
- **依赖**：多个AI API（NVIDIA、OpenAI兼容）、Redis缓存、重试机制
- **接口**：
  - `POST /api/ai/generate` - 文本生成（项目结构化）
  - `POST /api/ai/complete` - 智能补全（续写）
  - `POST /api/ai/analyze` - 项目分析（完整性检查）
  - `GET /api/ai/models` - 可用模型列表（根据配置动态返回）
  - `POST /api/ai/stream` - 流式生成（SSE）
- **关键类/函数**：
  - `AIMultiProvider` - 多API提供者管理（统一接口）
  - `NVIDIAProvider` - NVIDIA API适配
  - `OpenAICompatibleProvider` - OpenAI兼容API适配
  - `RetryManager` - 重试策略（指数退避、3次重试）
  - `FallbackManager` - 降级策略（主API失败切换备用）
  - `PromptTemplate` - 提示词模板引擎（Jinja2风格）
  - `ResponseParser` - 响应解析（结构化提取、Markdown/JSON）
  - `TokenCalculator` - Token使用量计算（计费统计）

**多API策略**：
- 优先级：激活配置 > 余额充足 > 响应速度
- 失败自动切换备用API
- 指数退避重试（1s, 2s, 4s）
- 熔断机制（连续失败5次暂停5分钟）

### 模块7：搜索服务模块 (Search Service)

- **职责**：BraveSearch API集成、结果缓存、异步查询、摘要生成
- **输入**：搜索关键词、领域上下文、缓存策略
- **输出**：搜索结果列表、摘要信息、缓存状态、相关度评分
- **依赖**：Brave API、Redis缓存、HTTP客户端
- **接口**：
  - `GET /api/search?q={query}&domain={domain}` - 执行搜索
  - `GET /api/search/suggest?q={partial}` - 搜索建议（自动完成）
  - `DELETE /api/search/cache` - 清除缓存（手动刷新）
  - `GET /api/search/stats` - 搜索统计（调用次数、缓存命中率）
- **关键类/函数**：
  - `BraveSearchClient` - Brave API客户端（封装认证、参数）
  - `SearchCacheManager` - 搜索缓存管理（TTL=3600s）
  - `ResultFormatter` - 结果格式化（摘要、高亮）
  - `asyncSearch` - 异步搜索（不阻塞主流程）
  - `Summarizer` - 结果摘要生成（提取关键信息）

**缓存策略**：
- 搜索结果缓存1小时
- 相同关键词直接返回缓存
- 领域特定查询添加领域标签

### 模块8：树形服务模块 (Tree Service)

- **职责**：树形结构算法、导出生成、优化建议、完整性检查、路径计算
- **输入**：树形数据结构、导出格式要求、优化请求
- **输出**：处理后的树形数据、导出文件（PDF/MD/JSON/PNG）、优化建议
- **依赖**：项目服务、AI服务、导出工具库
- **接口**：
  - `POST /api/tree/optimize` - 优化树结构（自动布局）
  - `POST /api/tree/export/{format}` - 导出文件（PDF/Markdown/JSON/PNG/SVG）
  - `GET /api/tree/suggestions` - 获取优化建议
  - `POST /api/tree/validate` - 验证完整性（检查必填节点）
  - `GET /api/tree/stats` - 统计信息（节点数、深度、覆盖率）
  - `POST /api/tree/import` - 导入JSON/OPML
- **关键类/函数**：
  - `TreeOptimizer` - 树形优化算法（平衡性检查、冗余合并）
  - `TreeLayout` - 布局算法（层级布局、水平/垂直）
  - `ExportGenerator` - 导出生成器（PDF/MD/JSON/PNG）
  - `PDFGenerator` - PDF生成（reportlab + html-to-pdf）
  - `MarkdownGenerator` - Markdown生成（标题层级、列表）
  - `JSONGenerator` - JSON生成（完整结构）
  - `ImageGenerator` - 图片生成（PNG/SVG矢量）
  - `CompletenessChecker` - 完整性检查（必填节点、建议节点）
  - `SuggestionEngine` - 建议引擎（基于领域知识库）

**导出格式支持**：
- PDF：Playwright生成PDF（带样式）
- Markdown：递归遍历转MD（层级标题）
- JSON：完整树形结构（包含元数据）
- PNG：Canvas渲染（位图）
- SVG：矢量图形（可编辑）

### 模块9：自动备份模块 (Auto Backup)

- **职责**：定时备份（每小时）、崩溃恢复、版本管理、存储清理
- **输入**：调度配置、手动触发、崩溃事件、清理策略
- **输出**：备份文件、恢复点、清理日志、备份状态
- **依赖**：APScheduler、文件系统、项目服务、压缩加密
- **接口**：
  - `POST /api/backup/trigger` - 手动触发备份
  - `GET /api/backup/list` - 备份列表（分页、搜索）
  - `POST /api/backup/restore/{id}` - 从备份恢复（覆盖/新建）
  - `DELETE /api/backup/{id}` - 删除备份
  - `GET /api/backup/download/{id}` - 下载备份文件
- **关键类/函数**：
  - `BackupScheduler` - 备份调度器（APScheduler）
  - `BackupGenerator` - 备份生成（压缩、加密）
  - `IncrementalBackup` - 增量备份（只备份变更）
  - `FullBackup` - 全量备份
  - `CrashRecovery` - 崩溃恢复逻辑（启动时检查）
  - `StorageCleaner` - 存储清理（保留最近24份，自动删除旧备份）
  - `BackupValidator` - 备份验证（完整性检查）

**备份策略**：
- 每小时自动备份（全量）
- 保留最近24份（24小时）
- 崩溃后自动恢复（从Redis检查未保存数据）
- 备份文件压缩（gzip）+ 加密（可选）

### 模块10：数据库模块 (Database)

- **职责**：数据持久化、事务管理、连接池、索引优化、迁移管理
- **输入**：SQL查询、ORM操作、迁移脚本
- **输出**：查询结果、事务确认、迁移状态、性能指标
- **依赖**：PostgreSQL、SQLAlchemy、Alembic
- **关键表结构**：

```sql
-- 项目表（根节点）
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    domain VARCHAR(50), -- 领域标签: software, cosmetics, website
    tree_data JSONB NOT NULL DEFAULT '{}', -- 嵌套集模型缓存
    node_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    version INTEGER DEFAULT 1,
    last_backup_at TIMESTAMP
);

-- 节点表（Materialized Path模型 + LTREE扩展）
CREATE TABLE nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES nodes(id),
    path LTREE NOT NULL, -- 物化路径: 1.2.3
    title VARCHAR(255) NOT NULL,
    content JSONB DEFAULT '{}', -- 节点详细内容（动态字段）
    order_index INTEGER DEFAULT 0, -- 同级排序
    node_type VARCHAR(50) DEFAULT 'generic', -- 节点类型
    status VARCHAR(20) DEFAULT 'draft', -- draft, confirmed, completed
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_nodes_project ON nodes(project_id);
CREATE INDEX idx_nodes_path ON nodes USING GIST(path);

-- 对话历史表
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    session_id VARCHAR(64) NOT NULL,
    messages JSONB NOT NULL DEFAULT '[]', -- 消息数组 [{role, content, timestamp}]
    model VARCHAR(100),
    token_usage INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_conversations_project ON conversations(project_id);
CREATE INDEX idx_conversations_session ON conversations(session_id);

-- API配置表（加密存储）
CREATE TABLE api_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    provider VARCHAR(50) NOT NULL, -- nvidia, openai, custom
    api_key_encrypted TEXT NOT NULL, -- AES-256-GCM加密
    base_url VARCHAR(255),
    model VARCHAR(100),
    is_active BOOLEAN DEFAULT FALSE,
    is_enabled BOOLEAN DEFAULT TRUE,
    usage_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
CREATE UNIQUE INDEX idx_active_config ON api_configs(is_active) WHERE is_active = TRUE;

-- 备份记录表
CREATE TABLE backups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT,
    backup_type VARCHAR(20) DEFAULT 'auto', -- auto, manual, crash
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '7 days'
);
CREATE INDEX idx_backups_project ON backups(project_id);
CREATE INDEX idx_backups_expires ON backups(expires_at);
```

### 模块11：缓存模块 (Cache)

- **职责**：高速缓存、会话管理、分布式锁、限流控制、实时数据
- **输入**：缓存键值、TTL配置、锁请求、限流规则
- **输出**：缓存命中、会话数据、锁状态、限流结果
- **依赖**：Redis 7、Redlock（分布式锁）
- **数据结构**：
  - `session:{id}` - 用户会话 (Hash: user_id, project_id, last_active)
  - `project:{id}:cache` - 项目缓存 (Hash: tree_data, last_saved)
  - `autosave:{project_id}` - 自动保存队列 (List: 待保存的变更)
  - `search:{query}` - 搜索结果 (String: JSON结果, TTL=3600)
  - `rate_limit:{ip}` - 限流计数 (String: 请求次数, TTL=60)
  - `lock:{resource}` - 分布式锁 (String: 锁持有者, TTL=30)
  - `stats:{metric}` - 统计指标 (Counter: api_calls, errors)
- **关键类/函数**：
  - `CacheManager` - 缓存管理器（CRUD、TTL管理）
  - `SessionStore` - 会话存储（创建、更新、过期）
  - `DistributedLock` - 分布式锁（Redlock算法、自动续期）
  - `RateLimiter` - 限流器（滑动窗口、固定窗口）
  - `CacheWarmer` - 缓存预热（启动时加载热点数据）
  - `CacheInvalidator` - 缓存失效（数据变更时清除）

---

## 4. 数据流设计

### 4.1 系统数据流全景图

```
用户操作 → 前端处理 → API请求 → 后端服务 → 数据层 → 响应返回
    │           │          │          │          │          │
    │           │          │          │          │          │
    ▼           ▼          ▼          ▼          ▼          ▼
 [操作事件]  [状态更新]   [HTTP/WS] [业务逻辑]   [CRUD]   [UI更新]

辅助流:
    ┌────────────────────────────────────────────────────────┐
    │                     自动保存流                          │
    │  用户编辑 → 防抖500ms → localStorage → 10秒定时 → 后端  │
    └────────────────────────────────────────────────────────┘

    ┌────────────────────────────────────────────────────────┐
    │                     AI生成流                          │
    │  用户输入 → 构建Prompt → 多API选择 → 流式响应 → 解析    │
    └────────────────────────────────────────────────────────┘

    ┌────────────────────────────────────────────────────────┐
    │                     自动备份流                          │
    │  每小时 → 全量备份 → 压缩加密 → 本地存储 → 清理旧备份   │
    └────────────────────────────────────────────────────────┘
```

### 4.2 关键数据处理流程

#### 流程1：用户输入想法 → AI生成项目结构

```
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ 用户输入 │───▶│ 前端验证 │───▶│ 构建提示 │───▶│ AI服务 │───▶│ 解析结构 │
│ 大白话  │ │ (zod)   │ │ Prompt │ │ 多API │ │ JSON   │
└──────────┘ └──────────┘ └──────────┘ └──────────┘ └────┬─────┘
                                                       │
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│ 渲染树形 │◀───│ 存储数据 │◀───│ 后端处理 │◀───│ 树形算法│◀───┘
│ 可视化  │ │ PostgreSQL│ │ 结构化 │ │ 嵌套集 │
└──────────┘ └──────────┘ └──────────┘ └──────────┘
```

**详细步骤：**

1. 用户在输入框描述想法，点击提交
2. 前端使用zod验证输入长度（10-2000字符）
3. 根据领域关键词（化妆品、软件等）选择对应提示词模板
4. 发送POST请求到 `/api/ai/generate` 包含上下文
5. 后端AI服务选择合适的API（优先级：激活配置 > 余额充足 > 响应速度）
6. 调用AI模型，使用流式响应(SSE)返回
7. AI返回Markdown/JSON格式，ResponseParser提取结构化数据
8. 应用树形算法转换为嵌套集模型
9. 存储到PostgreSQL nodes表（使用LTREE路径）
10. 前端接收数据，React-Flow渲染树形图

**时序要求：**
- AI回复延迟 < 3秒（正常网络条件下）
- 首屏树形渲染 < 1秒

#### 流程2：自动保存机制

```
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ 用户编辑 │───▶│ 防抖触发 │───▶│ 本地存储 │───▶│ 10秒定时 │───▶│ API保存 │
│ 节点操作 │ │ (500ms) │ │ Storage │ │ 调度器  │ │ 到数据库│
└──────────┘ └──────────┘ └──────────┘ └────┬─────┘ └────┬─────┘
                                          │            │
                                    ┌─────▼─────┐ ┌────▼────┐
                                    │ Redis缓存 │ │ 成功响应│
                                    │ 会话备份  │ │ 更新版本│
                                    └───────────┘ └─────────┘
```

**详细步骤：**

1. 用户编辑节点内容，触发onChange事件
2. 前端防抖处理（500ms延迟，避免频繁触发）
3. 立即保存到localStorage作为离线备份
4. Zustand状态更新，UI立即响应
5. 每10秒触发自动保存调度器
6. 发送PUT请求到 `/api/projects/{id}/autosave`
7. 后端接收数据，先写入Redis作为临时存储
8. 异步写入PostgreSQL（事务保证一致性）
9. 成功后返回新版本号，前端更新状态
10. 如果失败，保留Redis备份，下次重试

**可靠性保证：**
- 本地Storage备份（离线可用）
- Redis临时存储（防崩溃丢失）
- PostgreSQL持久化（ACID保证）
- 失败自动重试（3次）

#### 流程3：导出功能流程

```
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ 用户选择 │───▶│ 构建请求 │───▶│ 后端生成 │───▶│ 格式转换 │───▶│ 返回文件 │
│ 导出格式 │ │ (格式/范围)│ │ 原始数据 │ │ (PDF/MD) │ │ 下载链接 │
└──────────┘ └──────────┘ └──────────┘ └────┬─────┘ └──────────┘
                                           │
                                    ┌──────▼──────┐
                                    │  文件存储   │
                                    │ /uploads  │
                                    └─────────────┘
```

**详细步骤：**

1. 用户点击导出按钮，选择格式（PDF/Markdown/JSON/PNG）
2. 选择导出范围（整个项目/当前分支/选中节点）
3. 发送POST请求到 `/api/tree/export/{format}`
4. 后端查询PostgreSQL获取树形数据
5. 根据格式使用对应转换器：
   - **PDF**: Playwright + html-to-pdf生成
   - **Markdown**: 递归遍历转MD格式（标题层级）
   - **JSON**: 直接序列化树形结构
   - **PNG/SVG**: html-to-image库渲染
6. 临时存储到 `/uploads` 目录
7. 生成预签名URL（1小时有效期）
8. 前端收到URL，自动触发下载
9. 定时任务清理过期临时文件（24小时后）

### 4.3 状态管理策略

#### 前端状态分层

```
┌─────────────────────────────────────────────────────────┐
│                    全局状态 (Zustand)                    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │ 项目状态 │ │ API配置  │ │ UI状态   │ │ 对话状态 │  │
│  │ - current│ │ - configs│ │ - theme  │ │ - session│  │
│  │ - history│ │ - active │ │ - sidebar│ │ - history│  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
└────────────────────────────┼────────────────────────────┘
                             │
           ┌─────────────────┼─────────────────┐
           ▼                 ▼                 ▼
┌──────────────────┐ ┌──────────┐ ┌──────────────────┐
│   服务端状态      │ │ 本地状态  │ │   URL/路由状态    │
│ (React Query)    │ │(useState)│ │ (Next.js Router) │
│                  │ │          │ │                  │
│ - 项目列表缓存    │ │ - 表单   │ │ - 当前项目ID     │
│ - 搜索缓存       │ │ - 动画   │ │ - 视图模式       │
│ - 用户偏好       │ │ - 弹窗   │ │ - 过滤器         │
└──────────────────┘ └──────────┘ └──────────────────┘
```

**策略说明：**

1. **Zustand全局状态**：跨组件共享的持久化状态（项目数据、API配置、主题）
   - 使用持久化中间件同步到localStorage
   - 支持状态订阅和选择器优化

2. **React Query服务端状态**：API数据缓存、自动重取、乐观更新
   - 默认缓存5分钟
   - 窗口聚焦时自动刷新
   - 支持乐观更新（Optimistic Updates）

3. **本地useState**：组件级临时状态（表单输入、动画状态）
   - 不跨组件共享
   - 页面刷新后重置

4. **URL状态**：路由参数作为状态（当前项目ID、视图模式）
   - 支持浏览器前进后退
   - 可分享链接

### 4.4 数据持久化方案

#### 多层持久化架构

```
实时层 ──▶ 缓存层 ──▶ 主存储 ──▶ 备份层 ──▶ 归档层
   │          │          │          │          │
   │          │          │          │          │
   ▼          ▼          ▼          ▼          ▼
内存        Redis    PostgreSQL   本地文件    云存储
(State)   (30min)    (永久)     (24小时)    (可选)
```

**详细说明：**

1. **实时层（内存）**
   - **位置**：前端Zustand + 后端Python变量
   - **内容**：当前编辑状态、未提交变更
   - **持久化**：无，页面刷新丢失
   - **恢复**：从Redis/PostgreSQL重新加载

2. **缓存层（Redis）**
   - **TTL**：会话30分钟，搜索1小时，项目10分钟
   - **内容**：活跃项目缓存、用户会话、API响应、自动保存队列
   - **持久化**：RDB快照5分钟 + AOF每秒
   - **恢复**：Redis重启自动加载
   - **作用**：防崩溃、加速读取、会话保持

3. **主存储（PostgreSQL）**
   - **持久化**：完整ACID保证
   - **备份**：自动每小时导出
   - **恢复**：从备份文件或WAL日志
   - **特性**：事务、外键约束、索引优化

4. **备份层（本地文件）**
   - **位置**：`/data/backups/`
   - **策略**：每小时自动备份，保留24份
   - **格式**：压缩JSON + SQL
   - **触发**：定时任务或崩溃时

5. **归档层（可选云存储）**
   - **策略**：24小时后的备份上传云端
   - **目的**：灾难恢复、长期归档

---

## 5. 文件组织结构

### 5.1 项目目录结构

```
idea-create-everything/
├── 📁 .github/                          # GitHub配置
│   └── workflows/                        # CI/CD工作流
│       ├── frontend-ci.yml               # 前端CI（测试、构建）
│       └── backend-ci.yml                # 后端CI（测试、镜像构建）
│
├── 📁 .vscode/                           # VS Code配置
│   ├── settings.json                     # 编辑器设置
│   └── extensions.json                   # 推荐插件列表
│
├── 📁 docs/                              # 项目文档
│   ├── ARCHITECTURE.md                   # 架构文档（本文件）
│   ├── SPEC.md                           # 需求规格
│   ├── API.md                            # API接口文档
│   ├── DEPLOYMENT.md                     # 部署指南
│   └── DEVELOPMENT.md                    # 开发指南
│
├── 📁 scripts/                           # 运维脚本
│   ├── start.bat                         # Windows一键启动
│   ├── start.sh                          # Linux/Mac启动
│   ├── backup.sh                         # 手动备份脚本
│   ├── health-check.sh                   # 健康检查
│   └── setup.ps1                         # Windows环境检查
│
├── 📁 data/                              # 数据目录（Docker卷挂载）
│   ├── postgres/                         # PostgreSQL数据
│   ├── redis/                            # Redis数据
│   └── backups/                          # 备份文件
│
├── 📁 uploads/                           # 上传/导出文件
│   └── exports/                          # 导出文件临时存储
│
├── 📁 frontend/                          # 前端应用（Next.js）
│   ├── 📁 src/
│   │   ├── 📁 app/                       # Next.js App Router
│   │   │   ├── layout.tsx                # 根布局
│   │   │   ├── page.tsx                  # 首页
│   │   │   ├── globals.css               # 全局样式
│   │   │   ├── loading.tsx               # 加载状态
│   │   │   ├── error.tsx                 # 错误边界
│   │   │   ├── 📁 api/                   # API路由（可选）
│   │   │   ├── 📁 projects/              # 项目相关页面
│   │   │   │   ├── page.tsx              # 项目列表
│   │   │   │   └── [id]/                 # 项目详情（动态路由）
│   │   │   │       └── page.tsx
│   │   │   └── 📁 settings/              # 设置页面
│   │   │
│   │   ├── 📁 components/                # React组件
│   │   │   ├── 📁 ui/                    # 基础UI组件（shadcn/ui）
│   │   │   │   ├── button.tsx
│   │   │   │   ├── input.tsx
│   │   │   │   ├── dialog.tsx
│   │   │   │   └── ...
│   │   │   │
│   │   │   ├── 📁 api-config/            # API配置组件 ⏳ Phase 1
│   │   │   │   ├── ApiConfigCard.tsx
│   │   │   │   ├── ApiConfigForm.tsx
│   │   │   │   ├── ApiConfigList.tsx
│   │   │   │   ├── ModelSelector.tsx
│   │   │   │   └── BalanceChecker.tsx
│   │   │   │
│   │   │   ├── 📁 tree-view/             # 树形可视化组件 ⏳ Phase 1
│   │   │   │   ├── TreeView.tsx          # 主组件
│   │   │   │   ├── TreeNode.tsx          # 节点组件
│   │   │   │   ├── TreeEdge.tsx          # 连线组件
│   │   │   │   ├── TreeToolbar.tsx       # 工具栏
│   │   │   │   ├── NodeEditor.tsx        # 节点编辑器
│   │   │   │   ├── TreeMiniMap.tsx       # 小地图
│   │   │   │   └── hooks/
│   │   │   │       ├── useTreeData.ts
│   │   │   │       ├── useNodeDrag.ts
│   │   │   │       └── useTreeLayout.ts
│   │   │   │
│   │   │   ├── 📁 ai-chat/               # AI对话组件 ⏳ Phase 1
│   │   │   │   ├── ChatInterface.tsx     # 对话界面
│   │   │   │   ├── MessageList.tsx       # 消息列表
│   │   │   │   ├── MessageInput.tsx      # 输入框
│   │   │   │   ├── StreamingMessage.tsx  # 流式消息
│   │   │   │   ├── ContextPanel.tsx      # 上下文面板
│   │   │   │   └── hooks/
│   │   │   │       ├── useChat.ts
│   │   │   │       └── useStreaming.ts
│   │   │   │
│   │   │   ├── 📁 project/               # 项目组件
│   │   │   │   ├── ProjectCard.tsx
│   │   │   │   ├── ProjectList.tsx
│   │   │   │   ├── ProjectForm.tsx
│   │   │   │   ├── IdeaInput.tsx         # 想法输入
│   │   │   │   └── AutoSaveIndicator.tsx # 自动保存指示
│   │   │   │
│   │   │   ├── 📁 export/                # 导出组件 ⏳ Phase 3
│   │   │   │   ├── ExportDialog.tsx
│   │   │   │   ├── FormatSelector.tsx
│   │   │   │   └── ExportPreview.tsx
│   │   │   │
│   │   │   ├── 📁 layout/                # 布局组件
│   │   │   │   ├── Header.tsx
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   ├── ThemeToggle.tsx
│   │   │   │   └── ResizablePanels.tsx
│   │   │   │
│   │   │   └── 📁 common/                # 通用组件
│   │   │       ├── LoadingSpinner.tsx
│   │   │       ├── ErrorBoundary.tsx
│   │   │       ├── EmptyState.tsx
│   │   │       └── ConfirmDialog.tsx
│   │   │
│   │   ├── 📁 hooks/                     # 自定义Hooks
│   │   │   ├── useApiConfigs.ts          # API配置管理
│   │   │   ├── useProjects.ts            # 项目管理
│   │   │   ├── useAutoSave.ts            # 自动保存
│   │   │   ├── useTheme.ts               # 主题切换
│   │   │   ├── useLocalStorage.ts        # 本地存储
│   │   │   └── useKeyboardShortcut.ts    # 快捷键
│   │   │
│   │   ├── 📁 lib/                       # 工具函数
│   │   │   ├── utils.ts                  # 通用工具
│   │   │   ├── api.ts                    # API客户端（Axios封装）
│   │   │   ├── constants.ts              # 常量定义
│   │   │   ├── tree-helpers.ts           # 树形算法
│   │   │   ├── export-helpers.ts         # 导出工具
│   │   │   └── validators.ts             # 验证函数（zod）
│   │   │
│   │   ├── 📁 stores/                    # Zustand状态管理
│   │   │   ├── projectStore.ts           # 项目状态
│   │   │   ├── apiConfigStore.ts         # API配置状态
│   │   │   ├── uiStore.ts                # UI状态
│   │   │   └── chatStore.ts              # 对话状态
│   │   │
│   │   ├── 📁 types/                     # TypeScript类型
│   │   │   ├── project.ts                # 项目类型
│   │   │   ├── api.ts                    # API类型
│   │   │   ├── tree.ts                   # 树形类型
│   │   │   └── chat.ts                   # 对话类型
│   │   │
│   │   └── 📁 styles/                    # 样式文件
│   │       └── tree-view.css             # 树形视图样式
│   │
│   ├── 📁 public/                        # 静态资源
│   │   ├── favicon.ico
│   │   ├── logo.svg
│   │   ├── 📁 templates/                 # 示例模板 ⏳ Phase 2
│   │   │   ├── software-dev.json
│   │   │   ├── cosmetics.json
│   │   │   └── website.json
│   │   └── 📁 icons/                     # 图标资源
│   │
│   ├── components.json                   # shadcn/ui配置
│   ├── next.config.js                    # Next.js配置
│   ├── tailwind.config.ts                # Tailwind配置
│   ├── tsconfig.json                     # TypeScript配置
│   ├── package.json                      # 依赖管理
│   └── Dockerfile.frontend               # 前端Dockerfile
│
├── 📁 backend/                           # 后端应用（FastAPI）
│   ├── 📁 app/
│   │   ├── __init__.py
│   │   ├── main.py                       # FastAPI入口
│   │   ├── config.py                     # 配置管理（Pydantic）
│   │   │
│   │   ├── 📁 api/                       # API路由
│   │   │   ├── __init__.py
│   │   │   ├── deps.py                   # 依赖注入
│   │   │   ├── 📁 v1/                    # API版本1
│   │   │   │   ├── __init__.py
│   │   │   │   ├── router.py             # 路由聚合
│   │   │   │   ├── projects.py           # 项目路由
│   │   │   │   ├── nodes.py              # 节点路由
│   │   │   │   ├── chat.py               # 对话路由
│   │   │   │   ├── ai.py                 # AI服务路由
│   │   │   │   ├── search.py             # 搜索路由 ⏳ Phase 2
│   │   │   │   ├── configs.py            # 配置路由 ⏳ Phase 1
│   │   │   │   ├── tree.py               # 树形路由
│   │   │   │   └── backup.py             # 备份路由
│   │   │   │
│   │   │   └── errors.py                 # 错误处理
│   │   │
│   │   ├── 📁 services/                  # 业务逻辑
│   │   │   ├── __init__.py
│   │   │   ├── project_service.py        # 项目服务
│   │   │   ├── node_service.py           # 节点服务
│   │   │   ├── ai_service.py             # AI服务 ⏳ Phase 1
│   │   │   ├── chat_service.py           # 对话服务
│   │   │   ├── search_service.py         # 搜索服务 ⏳ Phase 2
│   │   │   ├── tree_service.py           # 树形服务
│   │   │   ├── export_service.py         # 导出服务 ⏳ Phase 3
│   │   │   ├── backup_service.py         # 自动备份服务
│   │   │   └── config_service.py         # 配置服务 ⏳ Phase 1
│   │   │
│   │   ├── 📁 models/                    # 数据模型（SQLAlchemy）
│   │   │   ├── __init__.py
│   │   │   ├── base.py                   # 基础模型
│   │   │   ├── project.py                # 项目模型
│   │   │   ├── node.py                   # 节点模型
│   │   │   ├── conversation.py           # 对话模型
│   │   │   ├── api_config.py             # API配置模型
│   │   │   └── backup.py                 # 备份模型
│   │   │
│   │   ├── 📁 schemas/                   # Pydantic Schema
│   │   │   ├── __init__.py
│   │   │   ├── project.py                # 项目Schema
│   │   │   ├── node.py                   # 节点Schema
│   │   │   ├── chat.py                   # 对话Schema
│   │   │   ├── ai.py                     # AI Schema
│   │   │   ├── search.py                 # 搜索Schema
│   │   │   └── config.py                 # 配置Schema
│   │   │
│   │   ├── 📁 core/                      # 核心配置
│   │   │   ├── __init__.py
│   │   │   ├── config.py                 # 应用配置（环境变量）
│   │   │   ├── database.py               # 数据库连接（SQLAlchemy）
│   │   │   ├── cache.py                  # 缓存配置（Redis）
│   │   │   ├── security.py               # 安全工具（加密、JWT）
│   │   │   ├── logging.py                # 日志配置（loguru）
│   │   │   └── events.py                 # 生命周期事件（启动/关闭）
│   │   │
│   │   ├── 📁 tasks/                     # 定时任务
│   │   │   ├── __init__.py
│   │   │   ├── scheduler.py              # 任务调度器（APScheduler）
│   │   │   ├── autosave.py               # 自动保存任务
│   │   │   ├── backup.py                 # 备份任务
│   │   │   └── cleanup.py                # 清理任务（过期文件）
│   │   │
│   │   ├── 📁 templates/                 # 提示词模板
│   │   │   ├── __init__.py
│   │   │   ├── base.py                   # 基础模板
│   │   │   ├── software_dev.py           # 软件开发模板
│   │   │   ├── cosmetics.py              # 化妆品模板
│   │   │   └── website.py                # 网站模板
│   │   │
│   │   └── 📁 utils/                     # 工具函数
│   │       ├── __init__.py
│   │       ├── tree_utils.py             # 树形算法
│   │       ├── export_utils.py           # 导出工具
│   │       ├── encryption.py             # 加密工具
│   │       └── validators.py             # 验证函数
│   │
│   ├── 📁 alembic/                       # 数据库迁移
│   │   ├── versions/                     # 迁移脚本
│   │   ├── env.py
│   │   └── alembic.ini
│   │
│   ├── 📁 tests/                         # 测试代码
│   │   ├── __init__.py
│   │   ├── conftest.py                   # Pytest配置
│   │   ├── test_projects.py
│   │   ├── test_ai.py
│   │   └── test_tree.py
│   │
│   ├── requirements.txt                  # Python依赖
│   ├── requirements-dev.txt              # 开发依赖
│   ├── pytest.ini                        # Pytest配置
│   ├── Dockerfile.backend                # 后端Dockerfile
│   └── entrypoint.sh                     # 容器入口脚本
│
├── docker-compose.yml                    # Docker编排
├── docker-compose.prod.yml               # 生产环境配置
├── .env.example                          # 环境变量模板
├── .env                                  # 实际环境变量（gitignore）
├── nginx.conf                            # Nginx配置
├── .gitignore
├── .dockerignore
└── README.md                             # 项目说明
```

### 5.2 关键文件说明

| 文件路径 | 用途 | 重要程度 | 当前状态 |
|---------|------|---------|----------|
| `docker-compose.yml` | 服务编排核心配置 | 极高 | ✅ 已完成 |
| `frontend/next.config.js` | Next.js构建设置、代理配置 | 高 | ✅ 已完成 |
| `backend/app/main.py` | FastAPI应用入口 | 高 | ✅ 已完成 |
| `backend/app/core/config.py` | 环境变量和配置管理 | 高 | ✅ 已完成 |
| `backend/app/models/` | SQLAlchemy数据模型 | 高 | ✅ 已完成 |
| `frontend/src/stores/` | Zustand全局状态 | 中 | ⏳ Phase 1 |
| `backend/app/services/ai_service.py` | AI多API适配 | 极高 | ⏳ Phase 1 |
| `frontend/src/components/tree-view/` | 树形编辑器组件 | 极高 | ⏳ Phase 1 |
| `backend/app/tasks/backup.py` | 自动备份任务 | 高 | ⏳ Phase 1 |
| `.env` | 敏感配置和API密钥 | 极高 | ✅ 已配置 |

---

## 6. 实现规划

### 6.1 开发阶段划分

#### Phase 0: 基础框架搭建（已完成 ✅）

**目标：** 建立项目骨架和核心基础设施

**已完成工作：**
- ✅ 初始化项目结构，创建目录和基础文件
- ✅ 配置Docker Compose，定义服务依赖
- ✅ 搭建Next.js前端框架，配置TypeScript + Tailwind
- ✅ 搭建FastAPI后端框架，配置数据库连接
- ✅ 设计并实现PostgreSQL数据库Schema
- ✅ 配置Redis缓存服务
- ✅ 配置Nginx反向代理
- ✅ 编写基础Dockerfile和启动脚本
- ✅ 设置开发环境热重载

**验收标准（已达成）：**
- ✅ `docker-compose up -d` 成功启动所有服务
- ✅ 前端访问 `http://localhost:3000` 显示基础页面
- ✅ 后端访问 `http://localhost:8000/docs` 显示Swagger文档
- ✅ 数据库连接正常，可执行迁移
- ✅ Redis连接正常，可读写测试
- ✅ 修改代码后热重载生效

#### Phase 1: 核心功能实现（当前优先级 ⏳）

**目标：** 完成主要业务功能，使系统可正常运行

**主要工作：**

- [ ] **API配置中心** (P0)
  - 前端：配置表单、列表展示、模型选择器、测试连接按钮
  - 后端：API配置CRUD、AES加密存储、测试接口、余额查询
  - 预计：1-2天

- [ ] **想法输入模块** (P0)
  - 前端：多行输入框、提交按钮、加载状态、字数统计
  - 后端：接收API、触发AI处理、返回任务ID
  - 预计：0.5天

- [ ] **AI对话模块** (P0)
  - 前端：对话UI、消息列表、流式输出（SSE）、Markdown渲染
  - 后端：多API适配（NVIDIA/OpenAI）、上下文管理、SSE流式响应
  - 预计：2-3天

- [ ] **树形可视化编辑器** (P0)
  - 前端：React-Flow集成、节点渲染、拖拽编辑、缩放控制、搜索过滤
  - 后端：树形数据CRUD、嵌套集算法、LTREE查询
  - 预计：2-3天

- [ ] **自动保存系统** (P0)
  - 前端：防抖保存、localStorage备份、自动保存指示器
  - 后端：定时保存、版本管理、Redis临时存储
  - 预计：1-2天

**验收标准：**
- ✅ 可在前端添加多个API配置并切换
- ✅ 输入想法后AI能返回结构化建议（< 3秒）
- ✅ 支持多轮对话，上下文连续
- ✅ 树形结构可展示、可编辑、可拖拽
- ✅ 编辑后10秒内自动保存到数据库
- ✅ 刷新页面后数据不丢失（从数据库恢复）
- ✅ 首屏加载 < 2秒

#### Phase 2: 智能功能增强（待完成 ⏳）

**目标：** 添加AI增强和搜索功能

**主要工作：**

- [ ] **联网搜索集成** (P2)
  - 后端：BraveSearch API封装、结果缓存、异步查询
  - 前端：搜索按钮、结果展示面板、搜索建议
  - 预计：1天

- [ ] **示例模板系统** (P2)
  - 创建3个领域模板（软件开发、化妆品、网站）
  - 前端：模板选择器、预览功能、快速开始
  - 预计：1天

- [ ] **领域识别** (P2)
  - 后端：关键词匹配、自动推荐模板、动态调整提示词
  - 前端：领域标签显示、模板推荐弹窗
  - 预计：0.5天

- [ ] **智能补全** (P4)
  - 根据已有内容自动建议缺失模块
  - 预计：1天

- [ ] **自动优化引擎** (P4)
  - 后台分析项目完整性
  - 定时生成优化建议
  - 预计：1天

**验收标准：**
- ✅ 点击搜索按钮能获取相关领域信息
- ✅ 可选择示例模板快速开始
- ✅ AI能识别项目领域并调整提问策略
- ✅ 系统能自动建议补充缺失内容
- ✅ 后台每小时运行一次优化分析

#### Phase 3: 完善与优化（待完成 ⏳）

**目标：** 补充边缘功能、性能优化、UI美化

**主要工作：**

- [ ] **导出功能** (P3)
  - 实现PDF、Markdown、JSON、PNG/SVG导出
  - 前端：导出对话框、格式选择、预览、下载
  - 后端：各格式生成器、文件临时存储
  - 预计：2天

- [ ] **UI/UX优化** (P3)
  - 实现深色/浅色模式切换（next-themes）
  - 添加动画和过渡效果（Framer Motion）
  - 响应式适配移动端
  - 首次启动引导教程（Tour.js）
  - 预计：2天

- [ ] **性能优化** (P3)
  - 树形大数据虚拟滚动（500+节点）
  - 图片懒加载
  - API响应缓存策略优化
  - 数据库查询优化（索引、分页）
  - 预计：1-2天

- [ ] **快捷键支持** (P3)
  - Ctrl+S保存、Ctrl+Z撤销
  - 树形编辑快捷键（添加、删除、编辑）
  - 快捷键提示面板
  - 预计：0.5天

**验收标准：**
- ✅ 可导出美观的PDF文档
- ✅ 深色模式切换无闪烁
- ✅ 500节点项目操作流畅（< 100ms响应）
- ✅ 首屏加载时间 < 2秒
- ✅ 所有常用操作支持快捷键

#### Phase 4: 测试与部署（待完成 ⏳）

**目标：** 集成测试、Docker打包、文档完善

**主要工作：**

- [ ] **自动化测试**
  - 前端：组件测试（Vitest）、E2E测试（Playwright）
  - 后端：单元测试、集成测试（pytest）
  - 覆盖率 > 70%
  - 预计：2天

- [ ] **性能测试**
  - 压力测试（并发用户）
  - 内存泄漏检测
  - 大数据量性能基准（1000节点）
  - 预计：1天

- [ ] **Docker优化**
  - 多阶段构建缩小镜像
  - 健康检查配置
  - 资源限制配置（内存、CPU）
  - 预计：0.5天

- [ ] **文档编写**
  - API文档自动生成（FastAPI原生Swagger）
  - 部署指南（Windows/Linux）
  - 用户手册（功能说明、FAQ）
  - 预计：1天

- [ ] **Windows一键启动**
  - 编写start.bat脚本
  - 预配置检查（Docker、内存）
  - 错误处理和提示
  - 预计：0.5天

**验收标准：**
- ✅ 所有核心功能通过自动化测试
- ✅ Docker镜像总大小 < 2GB
- ✅ Windows用户双击start.bat可一键启动
- ✅ 24小时压力测试无内存泄漏
- ✅ 文档完整，新用户可独立部署

### 6.2 实现优先级

按优先级排序所有功能点：

| 优先级 | 功能 | 阶段 | 原因 | 预计工时 |
|-------|------|------|------|----------|
| **P0** | Docker Compose配置 | Phase 0 | 部署依赖 | ✅ 已完成 |
| **P0** | 数据库Schema设计 | Phase 0 | 数据模型基础 | ✅ 已完成 |
| **P0** | API配置中心 | Phase 1 | AI功能前置条件 | 1-2天 |
| **P0** | AI多API适配 | Phase 1 | 核心功能 | 2-3天 |
| **P0** | 树形编辑器基础 | Phase 1 | 核心可视化 | 2-3天 |
| **P0** | 自动保存机制 | Phase 1 | 用户体验关键 | 1-2天 |
| **P1** | AI对话流式输出 | Phase 1 | 体验优化 | 1天 |
| **P1** | 树形拖拽编辑 | Phase 1 | 交互核心 | 1天 |
| **P2** | BraveSearch集成 | Phase 2 | 智能增强 | 1天 |
| **P2** | 示例模板系统 | Phase 2 | 降低使用门槛 | 1天 |
| **P2** | 领域识别 | Phase 2 | AI智能化 | 0.5天 |
| **P3** | 导出功能(PDF/MD) | Phase 3 | 交付需求 | 2天 |
| **P3** | 深色模式 | Phase 3 | 用户体验 | 0.5天 |
| **P3** | 性能优化 | Phase 3 | 质量保障 | 2天 |
| **P3** | 快捷键支持 | Phase 3 | 效率工具 | 0.5天 |
| **P4** | 自动优化引擎 | Phase 2 | 增值功能 | 1天 |
| **P4** | 智能补全 | Phase 2 | 增值功能 | 1天 |
| **P4** | 移动端适配 | Phase 3 | 边缘场景 | 0.5天 |

**总预计开发周期：** 12天（Phase 1-4）

---

## 7. 风险与约束

### 7.1 技术风险

| 风险 | 影响 | 缓解措施 | 状态 |
|------|------|----------|------|
| **AI理解大白话能力受限** | 生成的项目结构不符合预期，用户体验差 | 1. 增加多轮对话澄清机制<br>2. 提供示例引导<br>3. 支持人工编辑修正<br>4. 领域特定提示词优化 | 待验证 |
| **树形结构在大项目时过于复杂** | 用户体验下降，操作卡顿 | 1. 实现折叠/展开<br>2. 搜索过滤<br>3. 视图切换（树形/大纲）<br>4. 性能优化（虚拟滚动）<br>5. 节点分组 | 可控 |
| **联网搜索成本和延迟** | 响应慢（>3秒），API费用高 | 1. 多级缓存（Redis+本地）<br>2. 提供离线模式选项<br>3. 异步搜索（不阻塞主流程）<br>4. 搜索配额限制 | 可控 |
| **领域知识库覆盖面不足** | 小众领域建议质量低 | 1. 支持用户自定义领域模板<br>2. 预留扩展接口<br>3. 通用模板兜底 | 可控 |
| **API调用稳定性** | AI功能不可用，服务中断 | 1. 多API自动切换<br>2. 指数退避重试<br>3. 友好错误提示<br>4. 降级方案（离线模式）<br>5. 熔断机制 | 可控 |
| **Docker部署复杂性** | 用户启动困难，增加支持成本 | 1. 提供一键启动脚本（start.bat）<br>2. 完善文档（图文步骤）<br>3. 自动配置检查<br>4. 错误诊断工具 | 可控 |
| **数据丢失风险** | 用户项目丢失，信任度下降 | 1. 10秒自动保存<br>2. 每小时自动备份<br>3. 崩溃恢复机制<br>4. 多级持久化<br>5. 导出备份功能 | 可控 |

### 7.2 设计约束

#### 必须遵守的约束条件

1. **部署环境**
   - 必须支持Windows + WSL2环境
   - 必须使用Docker容器化部署
   - 必须提供一键启动脚本

2. **数据安全**
   - API密钥必须加密存储（AES-256-GCM）
   - 敏感配置不上传Git
   - 备份文件可选加密

3. **性能要求**
   - 首屏加载 < 2秒
   - 操作响应 < 100ms
   - AI回复 < 3秒
   - 支持500+节点流畅操作

4. **可靠性要求**
   - 7×24小时稳定运行
   - 自动保存间隔 < 10秒
   - 崩溃后自动恢复
   - 每小时自动备份

5. **用户体验**
   - 支持深色/浅色模式
   - 响应式设计（桌面/平板/手机）
   - 键盘快捷键支持
   - 流畅动画（Framer Motion）

6. **技术约束**
   - 前端必须使用Next.js + React
   - 后端必须使用FastAPI
   - 数据库必须使用PostgreSQL
   - 缓存必须使用Redis

#### 外部依赖约束

1. **NVIDIA API**
   - 依赖NVIDIA API服务可用性
   - 依赖API密钥余额充足
   - 有速率限制（需实现限流和重试）

2. **BraveSearch API**
   - 依赖Brave服务可用性
   - 有调用配额限制
   - 搜索结果缓存策略

3. **Docker环境**
   - 用户必须安装Docker Desktop
   - 需要至少4GB内存
   - 需要WSL2（Windows）

---

## 8. 与SPEC的对照

说明架构如何满足SPEC中的各项要求：

### 8.1 核心功能需求

| SPEC要求 | 架构满足方式 | 状态 |
|---------|-------------|------|
| 想法输入与AI交互 | AI对话模块 + AI服务模块（多API适配、流式输出） | ⏳ Phase 1 |
| 树形可视化编辑器 | 树形编辑器模块 + React-Flow + 树形服务模块 | ⏳ Phase 1 |
| API配置中心 | API配置模块 + 配置服务 + AES加密存储 | ⏳ Phase 1 |
| 自动保存机制 | 自动保存系统（防抖+定时+Redis+PostgreSQL多层） | ⏳ Phase 1 |
| 导出功能 | 导出服务模块（PDF/Markdown/JSON/PNG/SVG） | ⏳ Phase 3 |

### 8.2 技术架构需求

| SPEC要求 | 架构满足方式 | 状态 |
|---------|-------------|------|
| Docker容器化部署 | docker-compose.yml + Dockerfile + 一键启动脚本 | ✅ 已完成 |
| Next.js前端 | Next.js 15 + React 18 + TypeScript 5.3 | ✅ 已完成 |
| FastAPI后端 | FastAPI + Python 3.11 + SQLAlchemy 2.0 | ✅ 已完成 |
| PostgreSQL数据库 | PostgreSQL 15 + LTREE扩展 + Alembic迁移 | ✅ 已完成 |
| Redis缓存 | Redis 7 + 多级缓存策略 + 持久化 | ✅ 已完成 |
| 多API支持 | AI服务模块（NVIDIA + OpenAI兼容） | ⏳ Phase 1 |
| BraveSearch集成 | 搜索服务模块 + 结果缓存 | ⏳ Phase 2 |

### 8.3 用户体验需求

| SPEC要求 | 架构满足方式 | 状态 |
|---------|-------------|------|
| 美观界面 | shadcn/ui + Tailwind CSS + Framer Motion | ⏳ Phase 3 |
| 深色/浅色模式 | next-themes + ThemeProvider | ⏳ Phase 3 |
| 响应式设计 | Tailwind响应式类 + 移动端适配 | ⏳ Phase 3 |
| 流畅动画 | Framer Motion + 优化渲染 | ⏳ Phase 3 |
| 快捷键支持 | useKeyboardShortcut Hook + 全局监听 | ⏳ Phase 3 |
| 首次引导 | Tour.js或自定义引导组件 | ⏳ Phase 3 |

### 8.4 稳定性与可靠性需求

| SPEC要求 | 架构满足方式 | 状态 |
|---------|-------------|------|
| 7×24小时稳定运行 | Docker容器化 + 健康检查 + 自动重启 | ✅ 基础设施就绪 |
| 自动保存 < 10秒 | AutoSaveScheduler + Redis + PostgreSQL | ⏳ Phase 1 |
| 断点续传 | CrashRecovery + Redis临时存储 | ⏳ Phase 1 |
| 自动备份每小时 | BackupScheduler + APScheduler | ⏳ Phase 1 |
| 错误处理完善 | 全局错误边界 + 友好错误提示 + 日志记录 | ✅ 基础完成 |
| API失败自动重试3次 | RetryManager + tenacity（指数退避） | ⏳ Phase 1 |

### 8.5 性能需求

| SPEC要求 | 架构满足方式 | 状态 |
|---------|-------------|------|
| 首屏加载 < 2秒 | Next.js SSR + 代码分割 + 懒加载 | ⏳ Phase 3 |
| 操作响应 < 100ms | Zustand状态管理 + 乐观更新 + 防抖 | ⏳ Phase 1 |
| 支持1000+节点 | 虚拟滚动 + 懒加载 + 性能优化 | ⏳ Phase 3 |
| 内存占用 < 2GB | Docker资源限制 + 内存管理 + 缓存清理 | ✅ 配置就绪 |

### 8.6 安全需求

| SPEC要求 | 架构满足方式 | 状态 |
|---------|-------------|------|
| API密钥加密存储 | cryptography（AES-256-GCM）+ 环境变量 | ✅ 已配置 |
| 安全传输 | HTTPS/TLS（Nginx SSL终端） | ✅ Nginx配置就绪 |
| 限流控制 | Redis RateLimiter + 滑动窗口 | ⏳ Phase 1 |
| 输入验证 | zod（前端）+ Pydantic（后端） | ✅ 基础完成 |

---

## 9. 附录

### 9.1 术语表

| 术语 | 解释 |
|------|------|
| **MVP** | Minimum Viable Product，最小可行产品 |
| **SSE** | Server-Sent Events，服务器推送事件 |
| **LTREE** | PostgreSQL扩展，用于存储和处理树形结构数据 |
| **BFF** | Backend for Frontend，为前端定制的后端服务 |
| **ACID** | Atomicity, Consistency, Isolation, Durability，数据库事务特性 |
| **TTL** | Time To Live，缓存过期时间 |
| **Redlock** | Redis分布式锁算法 |
| **物化路径** | Materialized Path，树形数据存储模型 |

### 9.2 参考文档

- [SPEC.md](./SPEC.md) - 需求规格说明书
- [API.md](./API.md) - API接口文档
- [DEPLOYMENT.md](./DEPLOYMENT.md) - 部署指南
- [Next.js文档](https://nextjs.org/docs)
- [FastAPI文档](https://fastapi.tiangolo.com/)
- [React-Flow文档](https://reactflow.dev/)

### 9.3 待确认问题

1. **API密钥管理**：是否需要支持API密钥的版本历史（修改后可回滚）？
2. **导出格式**：是否需要支持Word文档导出（.docx）？
3. **协作功能**：MVP阶段确实不需要多用户协作吗？
4. **移动端**：是否需要原生APP，还是仅Web响应式即可？
5. **国际化**：是否需要多语言支持（中英文）？

---

**文档版本历史：**

| 版本 | 日期 | 作者 | 变更说明 |
|------|------|------|---------|
| v1.0 | 2026-02-13 | System | 初始版本 |
| v2.0 | 2026-02-14 | System | 根据SPEC完善，添加Phase状态、风险对照表 |

---

*本文档在架构设计阶段持续更新，开发过程中根据实际情况调整。*
