<#
.SYNOPSIS
  Cote PROF : recupere les dernieres evolutions du site (branche main) dans la branche Cours.

.DESCRIPTION
  A lancer DEPUIS le worktree des cours (le dossier ...-cours, branche "Cours").
  Fusionne "main" dans "Cours" pour que le worktree du prof ait toujours la derniere
  architecture/design du site avant de rediger. Refuse de tourner s'il reste des
  modifications non commit (pour eviter un merge sur un travail en cours).

.EXAMPLE
  powershell -File scripts\cours-sync.ps1
#>
[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
Set-Location (Resolve-Path "$PSScriptRoot\..").Path

$branch = (git rev-parse --abbrev-ref HEAD).Trim()
if ($branch -ne 'Cours') {
  Write-Warning "Tu n'es pas sur la branche 'Cours' (actuel : $branch)."
  Write-Warning "Ce script est prevu pour le worktree des cours. Abandon."
  return
}

if (git status --porcelain) {
  Write-Warning "Des modifications ne sont pas encore commit. Commit-les avant de synchroniser."
  git status --short
  return
}

git fetch origin 2>$null | Out-Null

Write-Host "Fusion de 'main' dans 'Cours'..."
git merge --no-edit main
if ($LASTEXITCODE -ne 0) {
  Write-Warning "Conflit de fusion. Resous-le, puis termine avec : git commit"
  return
}

Write-Host ""
Write-Host "OK : la branche 'Cours' est a jour avec le site (main)."
