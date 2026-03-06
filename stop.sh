#!/bin/bash

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "======================================"
echo "  停止 Idea Create Everything 服务"
echo "======================================"
echo ""

echo -e "${YELLOW}正在停止服务...${NC}"
docker-compose down

echo ""
echo -e "${GREEN}✓ 所有服务已停止${NC}"
echo ""
echo -e "${YELLOW}提示：${NC}"
echo "  如需删除数据卷，请运行: docker-compose down -v"
echo "  如需重新启动，请运行: ./start.sh"
echo ""
