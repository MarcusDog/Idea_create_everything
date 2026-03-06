#!/bin/bash

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "======================================"
echo "  Idea Create Everything 服务状态检查"
echo "======================================"
echo ""

# Check Docker containers
echo -e "${BLUE}[1] Docker 容器状态:${NC}"
docker-compose ps
echo ""

# Check backend health
echo -e "${BLUE}[2] 后端服务健康检查:${NC}"
if curl -s http://localhost:8000/health > /dev/null; then
    echo -e "${GREEN}✓ 后端服务正常运行${NC}"
    curl -s http://localhost:8000/health | python3 -m json.tool
else
    echo -e "${RED}✗ 后端服务无法访问${NC}"
fi
echo ""

# Check frontend
echo -e "${BLUE}[3] 前端服务检查:${NC}"
if curl -s -I http://localhost:3000 | grep "200 OK" > /dev/null; then
    echo -e "${GREEN}✓ 前端服务正常运行${NC}"
else
    echo -e "${RED}✗ 前端服务无法访问${NC}"
fi
echo ""

# Check database
echo -e "${BLUE}[4] PostgreSQL 数据库检查:${NC}"
if docker exec idea_postgres pg_isready -U user > /dev/null 2>&1; then
    echo -e "${GREEN}✓ 数据库连接正常${NC}"
else
    echo -e "${RED}✗ 数据库连接失败${NC}"
fi
echo ""

# Check Redis
echo -e "${BLUE}[5] Redis 缓存检查:${NC}"
if docker exec idea_redis redis-cli ping > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Redis 连接正常${NC}"
else
    echo -e "${RED}✗ Redis 连接失败${NC}"
fi
echo ""

echo "======================================"
echo -e "${GREEN}服务访问地址:${NC}"
echo "  前端界面: http://localhost:3000"
echo "  后端API:  http://localhost:8000"
echo "  API文档:  http://localhost:8000/docs"
echo "  设置页面: http://localhost:3000/settings"
echo "======================================"
