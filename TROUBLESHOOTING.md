# 故障排除指南

## 常见问题解决方案

### 1. 前端显示 "Failed to fetch" 错误

**症状**：页面左下角或控制台显示 TypeError: Failed to fetch

**原因**：
- 后端API服务未启动或无法访问
- CORS配置问题
- 网络连接问题

**解决方案**：

#### 检查服务状态
```bash
./check-status.sh
```

确保所有服务都是 "healthy" 状态。

#### 检查后端连接
```bash
curl http://localhost:8000/health
```

应该返回：
```json
{
  "status": "healthy",
  "version": "0.1.0",
  "environment": "development"
}
```

#### 重启服务
```bash
docker-compose restart backend frontend
```

#### 清除浏览器缓存
1. 打开浏览器开发者工具（F12）
2. 在Network标签页，勾选 "Disable cache"
3. 刷新页面（Ctrl+Shift+R 强制刷新）

### 2. 数据库连接错误

**症状**：后端日志显示 UUID 或 PostgreSQL 错误

**解决方案**：
```bash
# 重启数据库和后端
docker-compose restart postgres backend

# 等待几秒后检查
docker-compose logs backend
```

### 3. 项目无法保存

**症状**：保存项目时失败

**解决方案**：
- 检查是否是 `local-*` 开头的本地项目（这些项目只存在于浏览器）
- 检查后端API是否正常
- 查看浏览器控制台的详细错误信息

### 4. 页面样式丢失或显示异常

**解决方案**：
```bash
# 重新构建前端
docker-compose build frontend
docker-compose restart frontend

# 清除浏览器缓存后刷新
```

### 5. Docker容器无法启动

**症状**：`docker-compose up` 失败

**解决方案**：
```bash
# 停止所有容器
docker-compose down

# 清理旧镜像和容器
docker system prune -f

# 重新构建并启动
docker-compose build
docker-compose up -d

# 查看日志
docker-compose logs -f
```

### 6. 端口被占用

**症状**：ERROR: port is already allocated

**解决方案**：
```bash
# 查看端口占用
sudo lsof -i :3000  # 前端
sudo lsof -i :8000  # 后端
sudo lsof -i :5432  # PostgreSQL

# 停止占用端口的进程
kill -9 <PID>

# 或修改 docker-compose.yml 中的端口映射
```

## 开发模式错误处理

### 禁用 Next.js 错误覆盖层

如果觉得开发模式下的错误提示太烦人，可以：

1. **暂时忽略**：这些错误通常是 API 暂时不可用，不影响实际功能
2. **使用生产模式**：
   ```bash
   # 在 docker-compose.yml 中将 NODE_ENV 改为 production
   # 然后重启
   docker-compose restart frontend
   ```

### 查看详细日志

```bash
# 实时查看所有服务日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres

# 查看最后50行日志
docker-compose logs --tail=50 backend
```

## 性能优化

### 前端加载慢

**解决方案**：
- 首次访问会编译代码，需要等待几秒
- 后续访问会快很多
- 生产环境会预先构建，速度更快

### API响应慢

**解决方案**：
- 检查数据库连接
- 查看Redis缓存是否正常
- 检查网络连接

## 获取帮助

如果以上方法都无法解决问题：

1. **查看完整日志**：
   ```bash
   docker-compose logs > debug.log
   ```

2. **检查系统资源**：
   ```bash
   docker stats
   ```

3. **重新开始**：
   ```bash
   docker-compose down -v  # 警告：会删除所有数据
   docker-compose up -d
   ```

## 常用命令速查

```bash
# 启动所有服务
docker-compose up -d

# 停止所有服务
docker-compose down

# 重启服务
docker-compose restart [service-name]

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f [service-name]

# 进入容器
docker-compose exec backend bash
docker-compose exec frontend sh

# 重新构建
docker-compose build [service-name]
```
