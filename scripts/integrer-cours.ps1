<#
.SYNOPSIS
  Cote SITE : integre les cours du prof (branche Cours) dans main, valide, puis pousse.

.DESCRIPTION
  A lancer DEPUIS le dossier principal (branche "main"). Fusionne la branche "Cours"
  (remplie par la session du prof) dans "main", lance la validation du site
  (ci/validate_site.py) et pousse si tout est vert.

  Comme les deux worktrees partagent le meme .git, la branche "Cours" est visible
  directement : pas besoin de la pousser au prealable.

.PARAMETER Branch
  Branche a integrer (defaut : Cours).

.PARAMETER NoPush
  Ne pas pousser automatiquement apres l'integration.

.EXAMPLE
  powershell -File scripts\integrer-cours.ps1
#>
[CmdletBinding()]
param(
  [string]$Branch = 'Cours',
  [switch]$NoPush
)

$ErrorActionPreference = 'Stop'
Set-Location (Resolve-Path "$PSScriptRoot\..").Path

$current = (git rev-parse --abbrev-ref HEAD).Trim()
if ($current -ne 'main') {
  Write-Warning "Tu n'es pas sur 'main' (actuel : $current). Place-toi sur main avant d'integrer."
  return
}

if (git status --porcelain) {
  Write-Warning "Des modifications ne sont pas commit sur main. Commit-les d'abord."
  git status --short
  return
}

if (-not (git branch --list $Branch)) {
  Write-Warning "La branche '$Branch' n'existe pas. Rien a integrer."
  return
}

git fetch origin 2>$null | Out-Null

Write-Host "Fusion de '$Branch' dans 'main'..."
git merge --no-ff --no-edit $Branch
if ($LASTEXITCODE -ne 0) {
  Write-Warning "Conflit de fusion. Resous-le puis termine avec : git commit"
  return
}

Write-Host ""
Write-Host "Validation du site (ci/validate_site.py)..."
$env:PYTHONIOENCODING = 'utf-8'
py ci/validate_site.py
if ($LASTEXITCODE -ne 0) {
  Write-Warning "La validation a echoue. Corrige avant de pousser (le merge est deja fait en local)."
  return
}

if ($NoPush) {
  Write-Host ""
  Write-Host "OK : cours integres dans main (non pousses, -NoPush)."
  return
}

Write-Host ""
Write-Host "Push vers origin/main..."
git push
Write-Host "OK : cours integres et pousses."
