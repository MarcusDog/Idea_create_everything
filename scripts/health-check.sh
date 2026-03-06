#!/bin/bash

# Health check script

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "Checking service health..."

# Check Frontend
echo -n "Frontend (http://localhost:3000): "
if curl -s http://localhost:3000 > /dev/null; then
    echo -e "${GREEN}OK${NC}"
else
    echo -e "${RED}FAIL${NC}"
fi

# Check Backend
echo -n "Backend API (http://localhost:8000/health): "
if curl -s http://localhost:8000/health > /dev/null; then
    echo -e "${GREEN}OK${NC}"
else
    echo -e "${RED}FAIL${NC}"
fi

# Check PostgreSQL
echo -n "PostgreSQL (localhost:5432): "
if pg_isready -h localhost -p 5432 -q 2>/dev/null; then
    echo -e "${GREEN}OK${NC}"
else
    echo -e "${RED}FAIL${NC}"
fi

# Check Redis
echo -n "Redis (localhost:6379): "
if redis-cli -h localhost -p 6379 ping > /dev/null 2>&1; then
    echo -e "${GREEN}OK${NC}"
else
    echo -e "${RED}FAIL${NC}"
fi

echo ""
echo "Health check complete."
