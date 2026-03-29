#!/bin/bash

set -e

echo "📦 Installing all dependencies..."
rm -rf node_modules
rm -rf packages/core/node_modules
rm -rf packages/cli/node_modules
rm -rf packages/prompts/node_modules
rm -rf consumer/node_modules
pnpm install

echo "🔨 Building all packages..."
pnpm build

echo "🔗 Linking CLI globally..."
cd packages/cli
pnpm link --global
cd ../..

echo "🔄 Reloading PATH..."
export PNPM_HOME="$HOME/Library/pnpm"
export PATH="$PNPM_HOME:$PATH"

echo "🧪 Running consumer eval..."
evaliphy eval consumer/evals/sample.eval.ts

echo "✅ All done!"