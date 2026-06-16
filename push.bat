@echo off
cd /d "C:\Users\franc\OneDrive\Documentos\claude\riqqsburgers-web"
if exist ".git\index.lock" del /f ".git\index.lock"
git add -A
git commit -m "feat(landing): tooltip contrast, stats icons, hero trust badges, social proof, pricing guarantee chip"
git push origin main
pause
