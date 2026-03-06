#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "===================================="
echo "  Idea Create Everything 启动程序"
echo "===================================="
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}[错误] 未检测到Docker，请先安装Docker${NC}"
    echo "下载地址: https://www.docker.com/get-started"
    exit 1
fi

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo -e "${RED}[错误] Docker未运行，请启动Docker${NC}"
    exit 1
fi

# Check if docker-compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}[错误] 未检测到docker-compose${NC}"
    echo "请安装: sudo apt-get install docker-compose (Linux)"
    echo "或: brew install docker-compose (Mac)"
    exit 1
fi

echo -e "${GREEN}[1/4] 停止现有容器...${NC}"
docker-compose down 2>/dev/null

echo -e "${GREEN}[2/4] 构建镜像...${NC}"
docker-compose build

if [ $? -ne 0 ]; then
    echo -e "${RED}[错误] 构建失败${NC}"
    exit 1
fi

echo -e "${GREEN}[3/4] 启动服务...${NC}"
docker-compose up -d

if [ $? -ne 0 ]; then
    echo -e "${RED}[错误] 启动失败${NC}"
    exit 1
fi

echo -e "${GREEN}[4/4] 等待服务就绪...${NC}"
sleep 10

echo ""
echo "===================================="
echo -e "${GREEN}  启动成功！${NC}"
echo "===================================="
echo ""
echo "前端地址: http://localhost:3000"
echo "后端API:  http://localhost:8000"
echo "API文档:  http://localhost:8000/docs"
echo ""
echo -e "${YELLOW}提示: 使用 'docker-compose logs -f' 查看日志${NC}"
echo -e "${YELLOW}提示: 使用 'docker-compose down' 停止服务${NC}"
echo ""
