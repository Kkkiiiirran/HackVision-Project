<#
PowerShell helper to create a venv for the Agents folder and install requirements.
Usage (PowerShell):
  cd <workspace>/Agents
  .\setup.ps1

This script will:
 - create a virtual environment in `Agents/.venv`
 - activate it in the current shell (instructions shown)
 - upgrade pip and install packages from requirements.txt
#>

$venvPath = Join-Path $PSScriptRoot ".venv"
$pythonLauncher = "py"

Write-Host "Agents setup script"
Write-Host "Working directory: $PSScriptRoot"

if (-not (Test-Path "$PSScriptRoot\requirements.txt")) {
    Write-Host "requirements.txt not found in $PSScriptRoot" -ForegroundColor Yellow
    exit 1
}

# Create venv if missing
if (-not (Test-Path $venvPath)) {
    Write-Host "Creating virtual environment at $venvPath..."
    & $pythonLauncher -3 -m venv $venvPath
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to create virtualenv using '$pythonLauncher'. Try running this script with a full python path (set PYTHON_BIN) or install Python." -ForegroundColor Red
        exit 2
    }
} else {
    Write-Host ".venv already exists, skipping creation."
}

# Activate instructions
$activateScript = Join-Path $venvPath "Scripts\Activate.ps1"
if (-not (Test-Path $activateScript)) {
    Write-Host "Activation script not found at $activateScript" -ForegroundColor Red
    exit 3
}

Write-Host "To activate the venv in your current PowerShell session run:" -ForegroundColor Cyan
Write-Host "    & '$activateScript'" -ForegroundColor Green

# Run install inside a new process so we don't need the caller to activate manually
Write-Host "Installing requirements into the venv... (this runs pip inside the venv)" -ForegroundColor Cyan
$venvPython = Join-Path $venvPath "Scripts\python.exe"
& $venvPython -m pip install --upgrade pip
& $venvPython -m pip install -r (Join-Path $PSScriptRoot 'requirements.txt')

if ($LASTEXITCODE -ne 0) {
    Write-Host "pip install reported errors. Check the output above." -ForegroundColor Red
    exit 4
}

Write-Host "Installation complete. Run the following to activate the venv in this shell:" -ForegroundColor Green
Write-Host "    & '$activateScript'" -ForegroundColor Green
Write-Host "Then run: python main.py" -ForegroundColor Green

exit 0
