# Firecrawl Scraper

基于 Firecrawl 的高效异步批量文章爬取工具，配备现代化 GUI 界面。

## 功能特性

- **异步并发爬取** - 基于 Python asyncio，支持高并发批量爬取
- **断点续传** - 自动检测已完成任务，避免重复爬取
- **智能重试** - 内置指数退避重试机制，提高成功率
- **现代 GUI** - Electron + React 桌面应用，实时监控爬取进度
- **格式转换** - 自动将网页内容转换为 Markdown 格式
- **优雅停止** - 支持随时中止任务，安全退出

## 系统要求

- macOS / Linux / Windows
- Node.js >= 18
- Python >= 3.11
- [uv](https://docs.astral.sh/uv/) (Python 包管理器)
- Firecrawl 服务 (本地部署或云服务)

## 快速开始

### 1. 克隆项目

```bash
git clone <repository-url>
cd firecrawl_scraper
```

### 2. 启动应用

```bash
./start.sh
```

首次运行会自动：
- 配置 Python 虚拟环境 (通过 uv)
- 安装 Python 依赖
- 安装 Node.js 依赖
- 启动 GUI 应用

### 3. 配置 Firecrawl

启动应用后，进入 **设置** 页面配置：

| 配置项 | 说明 | 默认值 |
|--------|------|--------|
| Firecrawl URL | 服务地址 | `http://localhost:8547` |
| API Key | 认证密钥 | (需配置) |
| 输出目录 | 保存路径 | 项目根目录 |

> 本地部署 Firecrawl 可使用任意字符串作为 API Key

### 4. 开始爬取

1. 点击 **导入 JSON** 选择文章列表文件
2. 点击 **开始爬取** 启动任务
3. 实时查看进度和任务状态

## 文章列表格式

```json
{
  "articles": [
    {
      "title": "文章标题",
      "url": "https://example.com/article"
    }
  ]
}
```

## 输出文件

爬取结果保存为 Markdown 文件：

```
001_文章标题.md
002_另一篇文章.md
...
```

每个文件包含：
- 文章标题
- 原始 URL
- 爬取时间
- Markdown 格式正文

## 项目结构

```
firecrawl_scraper/
├── start.sh                 # 一键启动脚本
├── scrape_asyncio.py        # Python 爬虫核心
├── pyproject.toml           # Python 依赖配置
└── gui/                     # GUI 应用
    ├── electron/            # Electron 主进程
    └── src/                 # React 前端
```

## 命令行模式

也可以直接运行 Python 脚本 (无 GUI)：

```bash
# 配置环境变量
export FIRECRAWL_URL="http://localhost:8547"
export FIRECRAWL_API_KEY="your-api-key"
export ARTICLES_FILE="path/to/articles.json"
export OUTPUT_DIR="path/to/output"

# 运行爬虫
uv run python scrape_asyncio.py
```

## 配置参数

| 环境变量 | 说明 | 默认值 |
|----------|------|--------|
| `FIRECRAWL_URL` | Firecrawl 服务地址 | `http://localhost:8547` |
| `FIRECRAWL_API_KEY` | API 密钥 | (必填) |
| `ARTICLES_FILE` | 文章列表 JSON 路径 | `./cbre_data_center_articles.json` |
| `OUTPUT_DIR` | 输出目录 | 项目根目录 |
| `MAX_CONCURRENT` | 最大并发数 | `15` |
| `BATCH_SIZE` | 批次大小 | `50` |

## 故障排除

**连接失败**
- 确保 Firecrawl 服务正在运行
- 检查 URL 和端口配置

**任务立即结束**
- 检查设置页面的 API Key 是否已配置
- 查看控制台错误信息

**大量失败**
- 降低 `MAX_CONCURRENT` 值
- 检查目标网站是否有反爬限制

## 许可证

MIT License
