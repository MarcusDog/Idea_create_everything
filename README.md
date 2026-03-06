# Idea Create Everything

> 将任何想法转化为完整的树状项目结构，借助AI助手和联网搜索，系统化地实现你的创意。

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![Next.js 14](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)

## 🌟 特性

### 核心功能
- 🎯 **智能创意分解** - 输入想法，AI自动生成多级项目结构
- 🌳 **可视化树形编辑器** - 拖拽式操作，实时编辑节点关系
- 🤖 **AI智能助手** - 集成Claude API，提供实时建议和内容生成
- 🔍 **联网搜索** - BraveSearch集成，获取市场数据和竞品信息
- 📊 **多种导出格式** - 支持Markdown、JSON、思维导图等

### 项目管理
- 📁 **项目管理** - 创建、编辑、删除多个项目
- 📋 **模板系统** - 预设多个行业模板（软件开发、化妆品品牌、内容创作等）
- 💾 **自动保存** - 本地存储+云端同步，数据永不丢失
- 🎨 **深色模式** - 护眼模式，随系统自动切换
- ⌨️ **快捷键支持** - 提升操作效率

### 技术架构
- ⚡ **高性能** - FastAPI + Next.js 14，极速响应
- 🗄️ **数据持久化** - PostgreSQL + Redis缓存
- 🐳 **容器化部署** - Docker Compose一键启动
- 🔐 **数据安全** - API密钥本地存储，数据加密传输

## 🚀 快速开始

### 方法一：Docker Compose（推荐）

#### Windows
```bash
# 双击运行 start.bat，或在命令行执行：
start.bat
```

#### Linux/Mac
```bash
# 赋予执行权限并运行
chmod +x start.sh
./start.sh
```

服务启动后访问：
- 前端界面：http://localhost:3000
- 后端API：http://localhost:8000
- API文档：http://localhost:8000/docs

### 方法二：本地开发

#### 环境要求
- Python 3.11+
- Node.js 20+
- PostgreSQL 15+
- Redis 7+

#### 后端启动
```bash
cd backend

# 创建虚拟环境
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 安装依赖
pip install -r requirements.txt

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，配置数据库等信息

# 运行数据库迁移
alembic upgrade head

# 启动服务
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### 前端启动
```bash
cd frontend

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env.local
# 编辑 .env.local，设置 NEXT_PUBLIC_API_URL

# 启动开发服务器
npm run dev
```

## ⚙️ 配置说明

### API密钥配置

访问 http://localhost:3000/settings 配置API密钥：

#### Claude API Key
- 用于AI助手功能
- 获取地址：https://console.anthropic.com/
- 格式：`sk-ant-xxxxx`

#### BraveSearch API Key
- 用于联网搜索功能
- 获取地址：https://brave.com/search/api/
- 格式：`BSAxxxxx`

> 💡 API密钥仅保存在浏览器本地，不会上传到服务器

### 环境变量

#### 后端 (.env)
```env
# Database
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/idea_create

# Redis
REDIS_URL=redis://localhost:6379/0

# API Keys (可选，优先使用前端配置)
CLAUDE_API_KEY=your_claude_api_key
BRAVE_API_KEY=your_brave_api_key

# Security
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256

# CORS
CORS_ORIGINS=["http://localhost:3000"]

# Environment
DEBUG=True
ENVIRONMENT=development
```

#### 前端 (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## 📖 使用指南

### 创建项目

#### 方法1：从想法开始
1. 在首页输入框描述你的想法
2. 点击"开始创造"，AI自动生成项目结构
3. 在树形编辑器中进一步完善

#### 方法2：使用模板
1. 点击"使用模板快速开始"
2. 选择适合的行业模板
3. 基于模板修改和扩展

### 编辑节点
- **添加节点**：点击节点上的"+"按钮或使用快捷键 `Ctrl+N`
- **编辑节点**：双击节点或点击编辑按钮
- **删除节点**：选中节点后按 `Delete` 或 `Backspace`
- **移动节点**：拖拽节点到新位置
- **改变状态**：点击节点状态标签切换（待办/进行中/已完成）

### AI助手
1. 点击"AI助手"按钮打开面板
2. 输入问题或需求
3. AI提供建议和内容生成
4. 可将AI回复直接添加到节点

### 联网搜索
1. 点击"搜索"按钮打开搜索面板
2. 选择"网页搜索"或"市场分析"
3. 输入关键词搜索
4. 查看搜索结果，点击链接查看详情

### 导出项目
- **Markdown**：导出为结构化文档
- **JSON**：导出为数据格式，便于程序处理
- **思维导图**：导出为FreeMind格式

## ⌨️ 快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl+S` | 保存项目 |
| `Ctrl+N` | 新建节点 |
| `Ctrl+Z` | 撤销 |
| `Ctrl+Shift+Z` / `Ctrl+Y` | 重做 |
| `Delete` / `Backspace` | 删除选中节点 |
| `Ctrl+0` | 适应视图 |
| `Ctrl+/` | 切换AI助手 |
| `Ctrl+K` | 切换搜索 |

## 🏗️ 技术栈

### 前端
- **框架**：Next.js 14 (App Router)
- **UI**：React 18 + TailwindCSS
- **可视化**：React Flow（树形图）
- **状态管理**：React Hooks
- **HTTP客户端**：Fetch API

### 后端
- **框架**：FastAPI
- **数据库**：PostgreSQL 15 + SQLAlchemy 2.0
- **缓存**：Redis 7
- **ORM**：SQLAlchemy (异步)
- **迁移**：Alembic
- **验证**：Pydantic

### AI & 搜索
- **AI模型**：Claude 3.5 Sonnet (Anthropic)
- **搜索引擎**：BraveSearch API

### 部署
- **容器化**：Docker + Docker Compose
- **反向代理**：Nginx
- **进程管理**：Uvicorn (ASGI Server)

## 📁 项目结构

```
Idea_create_everything/
├── backend/                 # 后端服务
│   ├── app/
│   │   ├── api/            # API路由
│   │   ├── core/           # 核心配置
│   │   ├── models/         # 数据模型
│   │   ├── schemas/        # Pydantic模式
│   │   ├── services/       # 业务逻辑
│   │   └── main.py         # 应用入口
│   ├── alembic/            # 数据库迁移
│   ├── requirements.txt    # Python依赖
│   └── Dockerfile.backend  # 后端Docker配置
│
├── frontend/               # 前端应用
│   ├── src/
│   │   ├── app/           # Next.js页面
│   │   ├── components/    # React组件
│   │   ├── lib/           # 工具函数
│   │   ├── hooks/         # 自定义Hooks
│   │   └── data/          # 静态数据
│   ├── public/            # 静态资源
│   ├── package.json       # 前端依赖
│   └── Dockerfile.frontend # 前端Docker配置
│
├── docker-compose.yml     # Docker编排配置
├── start.bat              # Windows启动脚本
├── start.sh               # Linux/Mac启动脚本
└── README.md              # 项目文档
```

## 🤝 贡献

欢迎贡献代码、报告问题或提出建议！

### 开发流程
1. Fork本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开Pull Request

### 代码规范
- Python: PEP 8
- TypeScript/React: ESLint + Prettier
- Git Commit: Conventional Commits

## 📝 待办事项

- [ ] 用户认证和多用户支持
- [ ] 项目协作和分享功能
- [ ] 更多导出格式（PDF、PPT）
- [ ] 移动端适配
- [ ] 离线PWA支持
- [ ] 更多AI模型支持（GPT-4、文心一言等）
- [ ] 项目版本控制
- [ ] 插件系统

## 📄 许可证

本项目采用 MIT 许可证。详见 [LICENSE](LICENSE) 文件。

## 🙏 致谢

- [FastAPI](https://fastapi.tiangolo.com/) - 高性能Web框架
- [Next.js](https://nextjs.org/) - React框架
- [React Flow](https://reactflow.dev/) - 可视化图形库
- [Anthropic Claude](https://www.anthropic.com/) - AI能力支持
- [BraveSearch](https://brave.com/search/api/) - 搜索服务

---

⭐ 如果这个项目对你有帮助，请给一个Star！
