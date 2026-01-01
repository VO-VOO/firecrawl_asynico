#!/bin/bash

# Firecrawl Scraper 启动脚本
# 首次运行会自动配置环境

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GUI_DIR="$SCRIPT_DIR/gui"

# 打印带颜色的消息
info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

success() {
    echo -e "${GREEN}[OK]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

# 检查命令是否存在
check_command() {
    if ! command -v "$1" &> /dev/null; then
        return 1
    fi
    return 0
}

# 检查必需的工具
check_requirements() {
    info "检查系统要求..."

    # 检查 uv
    if ! check_command uv; then
        error "未找到 uv，请先安装: https://docs.astral.sh/uv/getting-started/installation/"
    fi
    success "uv 已安装"

    # 检查 Node.js
    if ! check_command node; then
        error "未找到 Node.js，请先安装: https://nodejs.org/"
    fi
    success "Node.js 已安装 ($(node --version))"

    # 检查 npm
    if ! check_command npm; then
        error "未找到 npm"
    fi
    success "npm 已安装"
}

# 配置 Python 环境
setup_python() {
    info "配置 Python 环境..."

    cd "$SCRIPT_DIR"

    # 检查是否需要创建虚拟环境
    if [ ! -d ".venv" ]; then
        info "创建 Python 虚拟环境..."
        uv venv --python 3.13
        success "虚拟环境已创建"
    else
        success "虚拟环境已存在"
    fi

    # 安装依赖
    info "安装 Python 依赖..."
    uv sync
    success "Python 依赖已安装"
}

# 配置 Node.js 环境
setup_node() {
    info "配置 Node.js 环境..."

    cd "$GUI_DIR"

    # 检查是否需要安装依赖
    if [ ! -d "node_modules" ]; then
        info "安装 Node.js 依赖..."
        npm install
        success "Node.js 依赖已安装"
    else
        success "Node.js 依赖已存在"
    fi
}

# 启动应用
start_app() {
    info "启动 Firecrawl Scraper GUI..."
    echo ""

    cd "$GUI_DIR"

    # 启动开发服务器和 Electron
    npm run dev:electron
}

# 主流程
main() {
    echo ""
    echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║      Firecrawl Scraper 启动脚本        ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
    echo ""

    check_requirements
    echo ""

    setup_python
    echo ""

    setup_node
    echo ""

    start_app
}

main
