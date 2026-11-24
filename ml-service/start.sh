#!/bin/bash
# Orion ML Service — startup script
# Usage: bash start.sh
set -e
cd "$(dirname "$0")"

# If .venv doesn't exist, create it with python3
if [ ! -d ".venv" ]; then
  echo "📦 Creating virtual environment (.venv)..."
  python3 -m venv .venv
fi

# Activate virtual environment
source .venv/bin/activate

echo "🔍 Installing / verifying dependencies..."
pip install -r requirements.txt

echo "🚀 Starting Orion Entity Resolution ML Service on http://localhost:8003..."
python er_model.py
