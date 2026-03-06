#!/bin/bash

# Start script for Idea Create Everything

set -e

echo "Starting Idea Create Everything..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Error: Docker is not installed"
    exit 1
fi

# Check if docker-compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "Error: Docker Compose is not installed"
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "Creating .env from template..."
    cp .env.example .env
    echo "Please edit .env file with your configuration"
fi

echo "Building and starting services..."
docker-compose up --build -d

echo ""
echo "==================================="
echo "Services are starting..."
echo ""
echo "Frontend: http://localhost:3000"
echo "Backend API: http://localhost:8000"
echo "API Docs: http://localhost:8000/docs"
echo "Nginx: http://localhost"
echo "==================================="
echo ""
echo "To stop: docker-compose down"
echo "To view logs: docker-compose logs -f"
echo ""
