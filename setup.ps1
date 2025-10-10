# Ruta del proyecto
$projectDir = "C:\FichaFlex_Tablet_React"

# URL del repo
$gitRepoUrl = "https://github.com/AdalmoDevelopment/FichaFlex_Tablet.git"

# Ruta del escritorio del usuario actual
$desktopPath = [Environment]::GetFolderPath("Desktop")

# Ruta del archivo .env
$envFilePath = Join-Path $projectDir ".env"

# Rutas de accesos directos
$shortcutStartPath = Join-Path $desktopPath "Start_FichaFlex.lnk"
$shortcutEnvPath = Join-Path $desktopPath "Ver_Config_ENV.lnk"
$startupShortcutPath = "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup\FichaFlex_Autostart.lnk"

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
    git add *
    git stash
    git clean -fd
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

# Crear archivo .env con contenido específico si no existe
if (-not (Test-Path $envFilePath)) {
    Write-Host "Vamos a configurar los valores de entorno (.env)..."

    $viteHost = Read-Host "VITE_HOST_GLOBAL (IP o dominio del backend)"
    $dbHost = Read-Host "DB_HOST (servidor base de datos)"
    $dbPort = Read-Host "DB_PORT (puerto base de datos, default 3306)"
    if (-not $dbPort) { $dbPort = 3306 }

    $dbUser = Read-Host "DB_USER"
    $dbPass = Read-Host "DB_PASSWORD"
    $dbName = Read-Host "DB_DATABASE"

    $envContent = @"
# Datos únicos que envía esta tablet junto a los datos de fichaje
VITE_DELEGACION_GLOBAL = 'Ses Veles Central'
VITE_TAG_VERSION_PREFIX = 'SV'
VITE_TAG_VERSION_SUFFIX = 'aws'
VITE_EMPRESA_GLOBAL = 'adalmo'
VITE_BACKGROUND_COLOR = '#7372a8'
VITE_BACKGROUND_COLOR_OPTIONS = '#7372a8'
VITE_TEXT_COLOR = 'white'
VITE_TEXT_COLOR_TIME = 'white'
VITE_TEXT_COLOR_VERSION = 'white'
VITE_TEXT_COLOR_DATETIME = 'white'
VITE_HOST_GLOBAL = "$viteHost"
DB_HOST = "$dbHost"
DB_PORT = $dbPort
DB_USER = "$dbUser"
DB_PASSWORD = "$dbPass"
DB_DATABASE = "$dbName"
"@

    Set-Content -Path $envFilePath -Value $envContent -Encoding UTF8
}

# Crear acceso directo para iniciar app (con build previo)
if (-not (Test-Path $shortcutStartPath)) {
    $shell = New-Object -ComObject WScript.Shell
    $shortcut = $shell.CreateShortcut($shortcutStartPath)
    $powershellPath = "$env:SystemRoot\System32\WindowsPowerShell\v1.0\powershell.exe"
    $args = "-NoExit -Command `"cd '$projectDir'; npm run build; npm run start`""
    $shortcut.TargetPath = $powershellPath
    $shortcut.Arguments = $args
    $shortcut.WorkingDirectory = $projectDir
    $shortcut.WindowStyle = 1
    $shortcut.Description = "Iniciar FichaFlex con build y start"
    $shortcut.Save()
}

# Crear acceso directo al archivo .env
if (-not (Test-Path $shortcutEnvPath)) {
    $shell = New-Object -ComObject WScript.Shell
    $shortcut = $shell.CreateShortcut($shortcutEnvPath)
    $shortcut.TargetPath = $envFilePath
    $shortcut.WindowStyle = 1
    $shortcut.Description = "Ver archivo .env del proyecto"
    $shortcut.Save()
}

# Crear acceso directo en carpeta Startup para que arranque al reiniciar
if (-not (Test-Path $startupShortcutPath)) {
    $shell = New-Object -ComObject WScript.Shell
    $shortcut = $shell.CreateShortcut($startupShortcutPath)
    $powershellPath = "$env:SystemRoot\System32\WindowsPowerShell\v1.0\powershell.exe"
    $args = "-WindowStyle Hidden -ExecutionPolicy Bypass -Command `"cd '$projectDir'; npm run build; npm run start`""
    $shortcut.TargetPath = $powershellPath
    $shortcut.Arguments = $args
    $shortcut.WorkingDirectory = $projectDir
    $shortcut.Description = "Inicio automático FichaFlex"
    $shortcut.WindowStyle = 7
    $shortcut.Save()
}

# Programar tarea diaria para ejecutar este script y mantener la tablet actualizada

$taskName = "FichaFlex_AutoStart_Diario"
$scriptPath = "$projectDir\setup.ps1"  # Asegúrate que es la ruta correcta del script en C:
$hora = "00:00"

# Comando para crear tarea diaria que ejecuta el script con permisos elevados
schtasks /Create /F /SC DAILY /TN $taskName /TR "powershell -ExecutionPolicy Bypass -File `"$scriptPath`"" /ST $hora /RL HIGHEST

Write-Host "Tarea diaria '$taskName' programada para ejecutarse a las $hora cada día."

# Ejecutar la app ahora
Write-Host "Iniciando la app con 'npm run re/build' y luego 'npm run start'..."
npm run rebuild
npm run build
npm run start

Write-Host "Listo. Se crearon accesos directos en el escritorio y el arranque automático tras reinicio."
