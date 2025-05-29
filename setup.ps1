# Ruta del proyecto
$projectDir = "C:\FichaFlex_Tablet_React"

# URL del repo
$gitRepoUrl = "https://github.com/AdalmoDevelopment/FichaFlex_Tablet.git"

# Ruta del escritorio del usuario actual
$desktopPath = [Environment]::GetFolderPath("Desktop")

# Ruta del acceso directo principal
$shortcutStartPath = Join-Path $desktopPath "Start_FichaFlex.lnk"
$shortcutEnvPath = Join-Path $desktopPath "Ver_Config_ENV.lnk"

# Ruta del archivo .env
$envFilePath = Join-Path $projectDir ".env"

# Funciones para chequear git y node
function Check-Git {
    if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
        Write-Host "Git no está instalado. Instálalo desde https://git-scm.com/download/win"
        exit 1
    }
}

function Check-Node {
    if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
        Write-Host "Node.js no está instalado. Instálalo desde https://nodejs.org/en/download/"
        exit 1
    }
}

# Chequeos
Check-Git
Check-Node

# Clonar o actualizar repo
if (-not (Test-Path $projectDir)) {
    Write-Host "Carpeta no existe. Clonando repo..."
    git clone $gitRepoUrl $projectDir
} else {
    Write-Host "Carpeta existe. Actualizando repo..."
    Set-Location $projectDir
    git pull
}

# Ir al proyecto
Set-Location $projectDir

# Instalar dependencias
Write-Host "Instalando dependencias..."
npm install

# Matar procesos node.exe
$nodeProcs = Get-Process -Name node -ErrorAction SilentlyContinue
if ($nodeProcs) {
    Write-Host "Matando procesos node.exe..."
    $nodeProcs | Stop-Process -Force
    Start-Sleep 3
}

# Crear archivo .env con contenido específico
$envContent = @"
# Datos únicos que envía esta tablet junto a los datos de fichaje
# 'Can Valero'
# 'Externo'
# 'Manacor'
# 'Muro'
# 'Ses Veles Carton'
# 'Ses Veles Central'
# 'Ses Veles Cupula'
# 'Son Castello'

VITE_DELEGACION_GLOBAL = 'Ses Veles Central'

# Etiqueta versión eg: "SV v1.0.0aws"
VITE_TAG_VERSION_PREFIX = 'SV'
# *versión en package.json*
VITE_TAG_VERSION_SUFFIX = 'aws'

# Visuales
# ADALMO #7372a8 
VITE_EMPRESA_GLOBAL = 'adalmo'
VITE_BACKGROUND_COLOR = '#7372a8'
VITE_BACKGROUND_COLOR_OPTIONS = '#7372a8'
VITE_TEXT_COLOR = 'white'
VITE_TEXT_COLOR_TIME = 'white'
VITE_TEXT_COLOR_VERSION = 'white'
VITE_TEXT_COLOR_DATETIME = 'white'

#Aplicación y endpoints
VITE_HOST_GLOBAL = "192.168.50.112"

#Base de datos
DB_HOST = ""
DB_PORT = 3306
DB_USER = ""
DB_PASSWORD = ""
DB_DATABASE = ""
"@

Set-Content -Path $envFilePath -Value $envContent -Encoding UTF8

# Crear acceso directo para iniciar app
if (-not (Test-Path $shortcutStartPath)) {
    $shell = New-Object -ComObject WScript.Shell
    $shortcut = $shell.CreateShortcut($shortcutStartPath)
    $powershellPath = "$env:SystemRoot\System32\WindowsPowerShell\v1.0\powershell.exe"
    $args = "-NoExit -Command `"cd '$projectDir'; npm run dev`""
    $shortcut.TargetPath = $powershellPath
    $shortcut.Arguments = $args
    $shortcut.WorkingDirectory = $projectDir
    $shortcut.WindowStyle = 1
    $shortcut.Description = "Iniciar FichaFlex con npm run dev"
    $shortcut.Save()
}

# Crear acceso directo al .env
if (-not (Test-Path $shortcutEnvPath)) {
    $shell = New-Object -ComObject WScript.Shell
    $shortcut = $shell.CreateShortcut($shortcutEnvPath)
    $shortcut.TargetPath = $envFilePath
    $shortcut.WindowStyle = 1
    $shortcut.Description = "Ver archivo .env del proyecto"
    $shortcut.Save()
}

# Iniciar la app
Write-Host "Iniciando la app con 'npm run dev'..."
Start-Process "npm" -ArgumentList "run dev"

Write-Host "Listo. Se creó también un acceso directo al archivo .env en el escritorio."
Pause
