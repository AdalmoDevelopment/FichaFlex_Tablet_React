# Ruta del proyecto
$projectDir = "C:\FichaFlex_Tablet_React"

# URL del repo
$gitRepoUrl = "https://github.com/AdalmoDevelopment/FichaFlex_Tablet.git"

# Ruta del escritorio del usuario actual
$desktopPath = [Environment]::GetFolderPath("Desktop")

# Ruta del acceso directo que vamos a crear en el escritorio
$shortcutPath = Join-Path $desktopPath "Start_FichaFlex.lnk"

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

# Crear acceso directo en el escritorio para iniciar la app con powershell.exe -NoExit -Command "cd '...' ; npm run dev"
if (-not (Test-Path $shortcutPath)) {
    Write-Host "Creando acceso directo en el escritorio..."

    $shell = New-Object -ComObject WScript.Shell
    $shortcut = $shell.CreateShortcut($shortcutPath)

    # Ruta a powershell.exe
    $powershellPath = "$env:SystemRoot\System32\WindowsPowerShell\v1.0\powershell.exe"

    # Comando para ejecutar en el acceso directo
    $args = "-NoExit -Command `"cd '$projectDir'; npm run dev`""

    $shortcut.TargetPath = $powershellPath
    $shortcut.Arguments = $args
    $shortcut.WorkingDirectory = $projectDir
    $shortcut.WindowStyle = 1  # Normal window
    $shortcut.Description = "Iniciar FichaFlex con npm run dev"
    $shortcut.Save()
} else {
    Write-Host "El acceso directo ya existe en el escritorio."
}

# Iniciar la app directamente también desde este script
Write-Host "Iniciando la app con 'npm run dev'..."
Start-Process "npm" -ArgumentList "run dev"

Write-Host "Listo. Usa el acceso directo en el escritorio para iniciar la app en el futuro."
Pause
