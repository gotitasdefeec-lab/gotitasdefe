@echo off
echo Iniciando servicios de Tienda Gotitas de Fe...

:: 1. Iniciar Backend (Puerto 4001)
echo Iniciando Backend...
cd "c:\Users\USER\Desktop\tienda-ecomerce-main\mock\backend"
start "Tienda Backend" cmd /k "npm start"

echo.
echo Backend iniciado en ventana separada.
echo Cloudflare Tunnel ya esta corriendo en segundo plano.
echo El backend estara disponible en: https://api.gotasdefe.com
echo.
echo NO CIERRES la ventana del backend si quieres que el sitio siga funcionando.
echo Puedes cerrar esta ventana.
timeout /t 5
exit

