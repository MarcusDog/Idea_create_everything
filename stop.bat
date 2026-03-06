@echo off
chcp 65001 >nul
title Idea Create Everything - 停止服务

echo ======================================
echo   停止 Idea Create Everything 服务
echo ======================================
echo.

echo [停止中] 正在停止服务...
docker-compose down

echo.
echo [完成] 所有服务已停止
echo.
echo 提示：
echo   如需删除数据卷，请运行: docker-compose down -v
echo   如需重新启动，请运行: start.bat
echo.
pause
