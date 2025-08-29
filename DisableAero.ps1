here# DisableAero.ps1
# Script to disable Windows Aero effects safely
# Author: [Your Name]
# Date: August 29, 2025

Write-Host "Disabling Windows Aero Effects..."

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "Please run this script as Administrator!" -ForegroundColor Red
    exit
}

# Disable Aero Peek and Animations in Registry
Set-ItemProperty -Path "HKCU:\Software\Microsoft\Windows\DWM" -Name "EnableAeroPeek" -Value 0 -ErrorAction SilentlyContinue
Set-ItemProperty -Path "HKCU:\Software\Microsoft\Windows\DWM" -Name "Animations" -Value 0 -ErrorAction SilentlyContinue

# Stop and restart Desktop Window Manager (DWM)
net stop uxsms
net start uxsms

Write-Host "Aero effects have been disabled successfully!" -ForegroundColor Green
Write-Host "Please restart your computer if changes do not take effect immediately."
Pause
