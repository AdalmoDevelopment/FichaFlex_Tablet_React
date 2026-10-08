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

# api_key de la app registrada en FichaFlex Web (POST /api/config/notification-apps). No se
# commitea: se rellena solo en la copia del instalador, no en la del repo
$notificationsApiKey = ''

# Variables que todo .env debe tener. Si a un .env ya existente le falta alguna (tablets
# instaladas antes de que existiera), se añade con este valor por defecto
$envDefaults = [ordered]@{
    FLEXA_BACK_URL        = "'http://192.168.50.206:3001'"
    NOTIFICATIONS_API_KEY = "'$notificationsApiKey'"
    PRE_PROD              = ""
}

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

# Añade al .env las variables de $envDefaults que le falten, sin tocar las que ya tiene. No
# pregunta nada: la tarea nocturna no es interactiva y un Read-Host la dejaría bloqueada
function Add-MissingEnvVars {
    $content = Get-Content -Path $envFilePath -Raw -Encoding UTF8
    $missing = @()
    foreach ($key in $envDefaults.Keys) {
        if ($content -notmatch "(?m)^\s*$key\s*=") { $missing += "$key = $($envDefaults[$key])" }
    }
    if ($missing.Count -gt 0) {
        Write-Host "Añadiendo variables nuevas al .env: $($missing -join ', ')"
        $block = "`r`n# Añadido por setup $(Get-Date -Format 'yyyy-MM-dd')`r`n" + ($missing -join "`r`n") + "`r`n"
        Add-Content -Path $envFilePath -Value $block -Encoding UTF8 -NoNewline
    }
}

# Chequeos
Check-Git
Check-Node

# Instalación nueva (sin .env): el formulario se pregunta aquí, antes de clonar, porque de la
# respuesta "tablet de test" depende la rama a clonar. El .env se escribe más abajo, cuando la
# carpeta del proyecto ya existe (git clone no admite una carpeta destino con ficheros)
$isNewInstall = -not (Test-Path $envFilePath)
if ($isNewInstall) {
    Write-Host "Vamos a configurar los valores de entorno (.env)..."

    $viteHost = Read-Host "VITE_HOST_GLOBAL (IP o dominio del backend)"
    $dbHost = Read-Host "DB_HOST (servidor base de datos)"
    $dbPort = Read-Host "DB_PORT (puerto base de datos, default 3306)"
    if (-not $dbPort) { $dbPort = 3306 }

    $dbUser = Read-Host "DB_USER"
    $dbPass = Read-Host "DB_PASSWORD"
    $dbName = Read-Host "DB_DATABASE"
    $tenantId = Read-Host "TENANT_ID"
    $clientId = Read-Host "CLIENT_ID"
    $clientSecret = Read-Host "CLIENT_SECRET"
    $esTest = Read-Host "¿Es tablet de test? (si/no)"
    $preProd = if ($esTest -match '^\s*(s|si|sí|y|yes)\s*$') { 'true' } else { '' }
}

# Rama a desplegar: PRE_PROD = true en el .env de la tablet → pre-prod; vacío o cualquier otro
# valor → main. El .env está en .gitignore, así que sobrevive al reset --hard de abajo
$branch = "main"
if ($isNewInstall) {
    if ($preProd -eq 'true') { $branch = "pre-prod" }
} else {
    $preProdLine = Select-String -Path $envFilePath -Pattern '^\s*PRE_PROD\s*=\s*[''"]?true[''"]?\s*(#.*)?$' -CaseSensitive:$false
    if ($preProdLine) { $branch = "pre-prod" }
}
Write-Host "Rama a desplegar: $branch"

# Clonar o actualizar repo
if (-not (Test-Path $projectDir)) {
    Write-Host "Carpeta no existe. Clonando repo..."
    git clone -b $branch $gitRepoUrl $projectDir
} else {
    Write-Host "Carpeta existe. Actualizando repo..."
    Set-Location $projectDir

    git reset --hard

    git fetch origin

    # -B crea la rama local si no existe (tablet que pasa a pre-prod por primera vez) y la
    # deja igual que la remota
    git checkout -B $branch "origin/$branch"

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

# Crear el .env con las respuestas del formulario (instalación nueva) o completar el existente
if ($isNewInstall) {
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

#Notificaciones (anticipos, fichajes en día no laboral) vía FichaFlex Web
FLEXA_BACK_URL = $($envDefaults.FLEXA_BACK_URL)
NOTIFICATIONS_API_KEY = $($envDefaults.NOTIFICATIONS_API_KEY)

#Tablet de test: true → el setup despliega la rama pre-prod; vacío → main
PRE_PROD = $preProd

TENANT_ID = "$tenantId"
CLIENT_ID = "$clientId"
CLIENT_SECRET = "$clientSecret"
"@

    Set-Content -Path $envFilePath -Value $envContent -Encoding UTF8
} else {
    Add-MissingEnvVars
}

# Arranque de la app: el build ya lo hace este script tras actualizar el repo, así que al
# arrancar solo se compila si falta dist (p.ej. carpeta recién clonada sin pasar por aquí)
$startCommand = "cd '$projectDir'; if (-not (Test-Path 'dist\index.html')) { npm run build }; npm run start"

# Crear acceso directo para iniciar app. Se recrea siempre para que los cambios en
# $startCommand lleguen también a las tablets ya instaladas
$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut($shortcutStartPath)
$powershellPath = "$env:SystemRoot\System32\WindowsPowerShell\v1.0\powershell.exe"
$shortcut.TargetPath = $powershellPath
$shortcut.Arguments = "-NoExit -Command `"$startCommand`""
$shortcut.WorkingDirectory = $projectDir
$shortcut.WindowStyle = 1
$shortcut.Description = "Iniciar FichaFlex"
$shortcut.Save()

# Crear acceso directo al archivo .env
if (-not (Test-Path $shortcutEnvPath)) {
    $shell = New-Object -ComObject WScript.Shell
    $shortcut = $shell.CreateShortcut($shortcutEnvPath)
    $shortcut.TargetPath = $envFilePath
    $shortcut.WindowStyle = 1
    $shortcut.Description = "Ver archivo .env del proyecto"
    $shortcut.Save()
}

# Crear acceso directo en carpeta Startup para que arranque al reiniciar (se recrea siempre,
# igual que el del escritorio)
$shortcut = $shell.CreateShortcut($startupShortcutPath)
$shortcut.TargetPath = $powershellPath
$shortcut.Arguments = "-WindowStyle Hidden -ExecutionPolicy Bypass -Command `"$startCommand`""
$shortcut.WorkingDirectory = $projectDir
$shortcut.Description = "Inicio automático FichaFlex"
$shortcut.WindowStyle = 7
$shortcut.Save()

# Permitir que la tablet responda al ping (ICMPv4 echo) desde FlexA: el panel Config > Tablets
# hace ping a la IP que reporta la app cuando deja de llegar su latido, para distinguir "app
# cerrada" (el equipo responde) de "sin red / apagada". Windows lo bloquea por defecto.
# Idempotente: solo se crea si no existe. Necesita permisos de administrador (la tarea diaria
# corre con /RL HIGHEST); si falla, la app sigue funcionando igual.
$pingRuleName = "FichaFlex - Ping desde FlexA"
netsh advfirewall firewall show rule name="$pingRuleName" > $null 2>&1
if ($LASTEXITCODE -ne 0) {
    netsh advfirewall firewall add rule name="$pingRuleName" protocol=icmpv4:8,any dir=in action=allow > $null
    if ($LASTEXITCODE -eq 0) { Write-Host "Regla de firewall '$pingRuleName' creada." }
    else { Write-Host "No se pudo crear la regla de firewall para el ping (¿sin permisos de administrador?)." }
}

# Programar tarea diaria para ejecutar este script y mantener la tablet actualizada

$taskName = "FichaFlex_AutoStart_Diario"
$scriptPath = "$projectDir\setup.ps1"  # Asegúrate que es la ruta correcta del script en C:
$hora = "00:00"

# Comando para crear tarea diaria que ejecuta el script con permisos elevados
schtasks /Create /F /SC DAILY /TN $taskName /TR "powershell -ExecutionPolicy Bypass -File `"$scriptPath`"" /ST $hora /RL HIGHEST

Write-Host "Tarea diaria '$taskName' programada para ejecutarse a las $hora cada día."

# Ejecutar la app ahora
Write-Host "Iniciando la app con 'npm run build' y luego 'npm run start'..."
npm run rebuild
npm run build
npm run start

Write-Host "Listo. Se crearon accesos directos en el escritorio y el arranque automático tras reinicio."
