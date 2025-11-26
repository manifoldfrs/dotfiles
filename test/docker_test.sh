#!/bin/bash
set -e

cd "$(dirname "$0")/.."

echo "Building Docker test image..."
docker build -t dotfiles-test -f test/Dockerfile .

echo ""
echo "Running tests in Docker container..."
echo ""
docker run --rm dotfiles-test
