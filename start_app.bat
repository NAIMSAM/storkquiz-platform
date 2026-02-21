@echo off
echo ===================================================
echo      DEMARRAGE DE STORKQUIZ AI (VERSION PRO)
echo ===================================================
cd /d "%~dp0"

IF NOT EXIST "node_modules" (
    echo [INFO] Installation des dependances en cours...
    call npm install
)

echo [INFO] Lancement du serveur...
start http://localhost:5173
call npm run dev

pause
