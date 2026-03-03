#!/bin/bash

# Smart Git Sync Script
# Automatically pulls, merges, and pushes changes

echo "🔄 Syncing with remote..."

# Check if there are uncommitted changes
if [[ -n $(git status -s) ]]; then
  echo "📝 Found uncommitted changes. Committing..."
  git add -A
  git commit -m "sync: auto-commit before push"
fi

# Fetch latest from remote
echo "📥 Fetching latest from origin..."
git fetch origin

# Pull with merge strategy (handles conflicts better)
echo "🔀 Pulling and merging..."
if git pull origin main --no-rebase; then
  echo "✅ Pull successful"
else
  echo "❌ Pull failed. You may need to resolve conflicts manually."
  exit 1
fi

# Push to remote
echo "📤 Pushing to origin..."
if git push origin main; then
  echo "✅ Push successful!"
  echo "🎉 All synced up!"
else
  echo "❌ Push failed. Please check the error above."
  exit 1
fi

git status
