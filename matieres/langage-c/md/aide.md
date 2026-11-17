---
title: Antisèche Langage C
subtitle: Installer et compiler sous VS Code, types, opérateurs, printf / scanf / fgets : l'essentiel des modules 0 à 2 sur une page.
domains: DATA, BIG DATA, IA
tags: C, gcc, VS Code, MSYS2, types, printf, scanf, fgets, strtol, division entière, débogage
niveau: Révision express
---

Mémo des premiers modules du cours de C (complété au fil des modules). Clique sur les zones masquées pour
t'auto-tester. Détail, quiz et exercices → [cours Langage C](cours.html?c=LANGC).

## Installer la toolchain (Windows)

1. VS Code + extension **C/C++** (Microsoft) : elle ne contient **aucun** compilateur.
2. [MSYS2](https://www.msys2.org/), puis dans son terminal :

```bash
pacman -S --needed base-devel mingw-w64-ucrt-x86_64-toolchain
```

3. `PATH` utilisateur += `C:\msys64\ucrt64\bin`, puis **redémarrer VS Code**.
4. Vérifier : `gcc --version`, `gdb --version`.

Projets dans un chemin **sans espaces ni accents** (`C:\dev\c`). → [Module 0](cours.html?c=LANGC&m=vscode)

## Compiler et lancer

```powershell
gcc -Wall -Wextra -std=c17 -g prog.c -o prog.exe
.\prog.exe
$LASTEXITCODE        # code de retour (Linux : echo $?)
```

| Option | Rôle |
|---|---|
| `-Wall -Wextra` | avertissements (viser **zéro**) |
| `-std=c17` | norme fixée |
| `-g` | infos pour le débogueur |
| `-O2` | optimisations |
| `-E` / `-S` / `-c` | s'arrêter après préprocesseur / assembleur / objet |

## Fichiers `.vscode`

| Fichier | Rôle | Raccourci |
|---|---|---|
| `tasks.json` | comment **compiler** | `Ctrl+Maj+B` |
| `launch.json` | comment **déboguer** | `F5` |
| `c_cpp_properties.json` | IntelliSense (`compilerPath`, `cStandard`) | |

`preLaunchTask` de `launch.json` = **même nom** que le `label` de `tasks.json`.
Saisie impossible en débogage → `"externalConsole": true`. → [Module 0](cours.html?c=LANGC&m=vscode)

## Débogueur

| Touche | Action |
|---|---|
| `F9` | point d'arrêt |
| `F5` | lancer / continuer |
| `F10` | ligne suivante |
| `F11` | entrer dans la fonction |
| `Maj+F11` | sortir de la fonction |
| `Maj+F5` | arrêter |

Vues **Variables**, **Espion**, **Pile des appels** ; clic droit sur un point d'arrêt = condition.

## Dépannage express

| Symptôme | Remède |
|---|---|
| `gcc` non reconnu | `PATH` + redémarrer VS Code |
| `Permission denied` sur le `.exe` | l'ancien programme tourne encore : `Ctrl+C` |
| saisie bloquée (Code Runner) | lancer dans le **terminal** |
| accents `Ã©` | `chcp 65001` |
| `undefined reference` | édition de liens : code de la fonction introuvable |
| `implicit declaration` | `#include` manquant (erreur depuis GCC 14) |

## Squelette d'un programme

```c
#include <stdio.h>
#include <stdlib.h>          // EXIT_SUCCESS, EXIT_FAILURE

#define TAILLE 100           // pas de = ni de ;
const double TAUX = 0.2;     // constante typée

int main(void)
{
    int n = 0;               // toujours initialiser
    printf("n = %d\n", n);
    return EXIT_SUCCESS;     // 0
}
```

Compilation : préprocesseur → compilateur → assembleur → ==éditeur de liens==. → [Module 1](cours.html?c=LANGC&m=premiers-programmes)

## Types et tailles (x86-64)

| Type | Octets | `printf` | `scanf` |
|---|---|---|---|
| `char` | 1 | `%c` | `" %c"` |
| `int` | 4 | `%d` | `%d` |
| `long` | **4 Windows / 8 Linux** | `%ld` | `%ld` |
| `long long` | 8 | `%lld` | `%lld` |
| `float` | 4 | `%f` | `%f` |
| `double` | 8 | `%f` | **`%lf`** |
| `size_t` | 8 | `%zu` | `%zu` |

Taille garantie : `<stdint.h>` → `int32_t`, `int64_t`, `uint8_t`. Bornes : `<limits.h>` → `INT_MAX`.
`bool` : `<stdbool.h>` (avant C23). Littéral `012` = **octal** (10) !

## Opérateurs et pièges de calcul

```c
17 / 5        // 3     division entière (2 int)
17 % 5        // 2     reste
-17 / 5       // -3    tronqué vers zéro
-17 % 5       // -2    signe du dividende
17 / 5.0      // 3.4   un double suffit
(double)a / b // division réelle
(double)(a/b) // TROP TARD : déjà entière
(int)3.99     // 3     troncature
x = 0         // affectation   /   x == 0   comparaison
a && b        // b non évalué si a est faux (court-circuit)
```

Flottants : jamais `==`, mais `fabs(a - b) < 1e-9`. `int` comparé à `unsigned` : `-1 < 0u` est **faux**.

## Dépassements et UB

- Non signé : modulo \( 2^n \) (`UINT_MAX + 1 == 0`), **défini**.
- Signé : `INT_MAX + 1` = **comportement indéfini**.
- Autres UB : variable non initialisée lue, division par zéro, `i = i++`, format `printf` faux.

→ [Module 1](cours.html?c=LANGC&m=premiers-programmes)

## printf : formats

```c
printf("[%5d]",   42);      // [   42]
printf("[%-5d]",  42);      // [42   ]
printf("[%05d]",  42);      // [00042]
printf("[%.2f]",  3.14159); // [3.14]
printf("[%8.3f]", 3.14159); // [   3.142]
printf("[%.3s]",  "Python");// [Pyt]
printf("100%%");            // 100%
```

`puts("x")` ajoute `\n` ; `putchar('x')` ; `fflush(stdout)` si une invite tarde à s'afficher.
→ [Module 2](cours.html?c=LANGC&m=entrees-sorties)

## scanf : les règles

```c
if (scanf("%d %lf", &n, &x) != 2) { /* saisie invalide */ }
scanf(" %c", &rep);          // l'espace saute le '\n' resté dans le tampon
scanf("%19s", nom);          // char nom[20] : largeur obligatoire, pas de &
int c; while ((c = getchar()) != '\n' && c != EOF) { }   // vider la ligne
```

- `&` devant chaque variable (sauf tableau). Tester **le retour**.
- **Jamais** `fflush(stdin)` ni `gets`.

## Lecture robuste : fgets + strtol

```c
char ligne[100];
if (fgets(ligne, sizeof ligne, stdin) != NULL) {
    ligne[strcspn(ligne, "\n")] = '\0';      // retire le '\n'
    char *fin;
    errno = 0;
    long v = strtol(ligne, &fin, 10);
    if (fin == ligne || *fin != '\0' || errno == ERANGE) { /* invalide */ }
}
```

`sscanf(ligne, "%d/%d/%d", &j, &m, &a) == 3` pour un format précis.
→ [Module 2](cours.html?c=LANGC&m=entrees-sorties)

## EOF, stderr, redirections

```c
int c;                                   // int, pas char !
while ((c = getchar()) != EOF) { }
fprintf(stderr, "Erreur\n");             // erreurs séparées des résultats
return EXIT_FAILURE;
```

EOF au clavier : `Ctrl+Z` puis Entrée (Windows), `Ctrl+D` (Linux).

| | bash / cmd | PowerShell |
|---|---|---|
| entrée | `prog < in.txt` | `Get-Content in.txt` puis pipe |
| sortie | `prog > out.txt` | `.\prog.exe > out.txt` |
| erreurs | `prog 2> err.txt` | `.\prog.exe 2> err.txt` |
