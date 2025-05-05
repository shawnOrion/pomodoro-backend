# reset-history.ps1
# WARNING: This will wipe all git history and recreate it clean

Write-Host "Deleting .git folder..."
Remove-Item -Recurse -Force .git

Write-Host ".git removed. Re-initializing Git..."
git init

Write-Host "Adding all files..."
git add .

Write-Host "Creating new initial commit..."
git commit -m "Clean slate - reset history, removed secrets"

Write-Host "Setting remote origin..."
git remote add origin https://github.com/shawnOrion/pomodoro-backend.git

Write-Host "Force pushing to main branch..."
git branch -M main
git push -f origin main

Write-Host "History reset and pushed to GitHub!"