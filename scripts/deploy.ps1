
# Deploy Script
# Este script automatiza el despliegue en IIS para Windows.

Write-Host ">>> Iniciando Despliegue Automatico..." -ForegroundColor Cyan

# 1. Bajar cambios (Si hay git)
if (Test-Path ".git") {
    Write-Host ">>> Bajando ultimos cambios..."
    git pull
}

# 2. Instalar dependencias
Write-Host ">>> Verificando dependencias..."
pnpm install

# 3. Build (Esto borra .next y lo crea de nuevo)
Write-Host ">>> Construyendo aplicacion (pnpm build)..."
pnpm build

if ($LASTEXITCODE -ne 0) {
    Write-Host ">>> Error en el build. Cancelando." -ForegroundColor Red
    exit 1
}

# 4. Preparar Standalone (La parte tediosa que antes hacías manual)
Write-Host ">>> Preparando archivos para IIS en .next/standalone..."

$standalonePath = ".\.next\standalone"
$publicSource = ".\public"
$staticSource = ".\.next\static"
$staticParent = ".\.next\standalone\.next"

# Crear directorio padre .next dentro de standalone si no existe (raro, pero posible)
if (!(Test-Path $staticParent)) {
    New-Item -ItemType Directory -Force -Path $staticParent | Out-Null
}

# Copiar carpeta Public (Imágenes etc)
Write-Host "   - Copiando carpeta Public..."
Copy-Item -Path $publicSource -Destination $standalonePath -Recurse -Force

# Copiar carpeta Static (JS/CSS compilados)
Write-Host "   - Copiando carpeta Static..."
# Al copiar ".\.next\static" a ".\.next\standalone\.next", PowerShell crea la carpeta "static" dentro.
Copy-Item -Path $staticSource -Destination $staticParent -Recurse -Force

# 5. Copiar Configuración (web.config y .env.local)
# Como .next se borró al inicio, necesitamos volver a poner estos archivos

# Copiar iis_web.config y renombrarlo a web.config
if (Test-Path ".\iis_web.config") {
    Write-Host "   - Configurando web.config para IIS..."
    Copy-Item -Path ".\iis_web.config" -Destination "$standalonePath\web.config" -Force
} else {
    Write-Host ">>> ADVERTENCIA: No se encontro iis_web.config en la raiz." -ForegroundColor Yellow
}

# Copiar .env.local (Asegúrate de que este archivo en la raíz tenga las claves de PROD)
if (Test-Path ".\.env.local") {
    Write-Host "   - Copiando variables de entorno (.env.local)..."
    Copy-Item -Path ".\.env.local" -Destination "$standalonePath\.env.local" -Force
} else {
    Write-Host ">>> ADVERTENCIA: No se encontro .env.local en la raiz." -ForegroundColor Yellow
}

Write-Host ">>> Despliegue Completado!" -ForegroundColor Green
Write-Host ">>> Tu carpeta .next/standalone esta lista y actualizada."
Write-Host ">>> Info: Si IIS no detecta el cambio, recicla el App Pool o reinicia el sitio."

