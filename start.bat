@echo off
chcp 65001 >nul
title Idea Create Everything - 启动脚本

echo ====================================
echo   Idea Create Everything 启动程序
echo ====================================
echo.

:: 检查Docker是否安装
where docker >nul 2>nul
if %errorlevel% neq 0 (
    echo [错误] 未检测到Docker，请先安装Docker Desktop
    echo 下载地址: https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

:: 检查Docker是否运行
docker info >nul 2>nul
if %errorlevel% neq 0 (
    echo [错误] Docker未运行，请启动Docker Desktop
    pause
    exit /b 1
)

echo [1/4] 停止现有容器...
docker-compose down >nul 2>nul

echo [2/4] 构建镜像...
docker-compose build

if %errorlevel% neq 0 (
    echo [错误] 构建失败
    pause
    exit /b 1
)

echo [3/4] 启动服务...
docker-compose up -d

if %errorlevel% neq 0 (
    echo [错误] 启动失败
    pause
    exit /b 1
)

echo [4/4] 等待服务就绪...
timeout /t 10 /nobreak >nul

echo.
echo ====================================
echo   启动成功！
echo ====================================
echo.
echo 前端地址: http://localhost:3000
echo 后端API:  http://localhost:8000
echo API文档:  http://localhost:8000/docs
echo.
echo 按任意键查看日志，或关闭窗口
pause >nul

:: 显示日志
docker-compose logs -f
