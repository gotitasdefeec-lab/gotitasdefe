@echo off
echo Iniciando servicios de Tienda Gotitas de Fe...

:: 1. Iniciar Backend (Puerto 4001)
echo Iniciando Backend...
cd "c:\Users\USER\Desktop\tienda-ecomerce-main\mock\backend"
start "Tienda Backend" cmd /k "npm start"

:: 2. Iniciar Ngrok (Túnel para internet)
echo Iniciando Ngrok...
start "Tienda Ngrok" "C:\Users\USER\ngrok\ngrok.exe" http --domain=vitaminic-yusuf-unnourishing.ngrok-free.dev 4001

echo.
echo Servicios iniciados en ventanas separadas.
echo NO CIERRES las ventanas nuevas si quieres que el sitio siga funcionando.
echo Puedes cerrar esta ventana.
timeout /t 5
exit
