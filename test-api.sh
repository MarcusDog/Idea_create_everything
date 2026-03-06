#!/bin/bash

echo "=== 测试前后端连接 ==="
echo ""

# 测试后端健康检查
echo "1. 测试后端健康状态..."
HEALTH=$(curl -s http://localhost:8000/health)
if [ $? -eq 0 ]; then
    echo "✓ 后端连接成功"
    echo "  响应: $HEALTH"
else
    echo "✗ 后端连接失败"
    exit 1
fi

echo ""

# 测试项目API
echo "2. 测试项目列表API..."
PROJECTS=$(curl -s http://localhost:8000/api/v1/projects/)
if [ $? -eq 0 ]; then
    echo "✓ 项目API连接成功"
    echo "  响应: $PROJECTS"
else
    echo "✗ 项目API连接失败"
    exit 1
fi

echo ""

# 测试前端
echo "3. 测试前端服务..."
FRONTEND=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)
if [ "$FRONTEND" = "200" ]; then
    echo "✓ 前端服务正常 (HTTP $FRONTEND)"
else
    echo "✗ 前端服务异常 (HTTP $FRONTEND)"
    exit 1
fi

echo ""

# 检查Docker服务状态
echo "4. 检查Docker服务状态..."
docker-compose ps

echo ""
echo "=== 所有测试通过! ==="
echo ""
echo "现在可以访问："
echo "  前端: http://localhost:3000"
echo "  后端: http://localhost:8000"
echo ""
echo "如果浏览器仍显示错误，请："
echo "  1. 清除浏览器缓存 (Ctrl+Shift+Delete)"
echo "  2. 强制刷新页面 (Ctrl+Shift+R)"
echo "  3. 打开浏览器开发者工具 (F12) 查看 Network 标签"
