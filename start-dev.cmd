@echo off
rem Start Santi Audio locally: database + Next.js dev server (http://localhost:3000)
cd /d "%~dp0"
set "PATH=C:\Users\user\AppData\Roaming\nvm\v24.9.0;%PATH%"
echo Node version:
node -v
echo Starting local database...
call npx prisma dev --name santi-audio --detach
echo Creating tables / sample data if missing...
call npx prisma migrate deploy
call npx prisma generate
call npx prisma db seed
echo Starting website at http://localhost:3000 ...
call npm run dev
pause
