<#
.SYNOPSIS
  Cree (ou repare) le worktree Git dedie a la redaction de cours (session "Professeur IABD").

.DESCRIPTION
  Deux sessions travaillent sur le meme depot sans se marcher dessus :
    - Session SITE (architecture et fonctionnalites) -> dossier principal, branche "main".
    - Session PROF (redaction de cours)              -> ce worktree, branche "Cours".

  Un worktree est un 2e dossier de travail qui partage le meme .git. Chaque branche
  evolue de son cote ; on integre ensuite les cours avec scripts\integrer-cours.ps1.

  Script idempotent : on peut le relancer, il ne casse rien.

.EXAMPLE
  powershell -File scripts\worktree-prof.ps1
#>
[CmdletBinding()]
param(
  [string]$Path   = (Join-Path (Split-Path (Resolve-Path "$PSScriptRoot\..").Path) 'Studies_sheatsheets_for_IABD-cours'),
  [string]$Branch = 'Cours'
)

$ErrorActionPreference = 'Stop'

$repo = (Resolve-Path "$PSScriptRoot\..").Path
Set-Location $repo

git rev-parse --is-inside-work-tree *> $null
if ($LASTEXITCODE -ne 0) { throw "Ce dossier n'est pas un depot Git : $repo" }

Write-Host "Depot principal : $repo"
Write-Host "Worktree prof   : $Path"
Write-Host "Branche prof    : $Branch"
Write-Host ""

git fetch origin 2>$null | Out-Null

$branchExists = [bool](git branch --list $Branch)

if (Test-Path $Path) {
  Write-Host "OK : le dossier existe deja ($Path). Worktree probablement en place."
  git worktree list
  return
}

if ($branchExists) {
  Write-Host "Branche '$Branch' existante -> ajout du worktree..."
  git worktree add $Path $Branch
} else {
  Write-Host "Creation de la branche '$Branch' depuis main + worktree..."
  git worktree add -b $Branch $Path main
}

Write-Host ""
Write-Host "Termine. Liste des worktrees :"
git worktree list
Write-Host ""
Write-Host "-> Ouvre la session du PROF avec ce dossier comme espace de travail :"
Write-Host "   $Path"
