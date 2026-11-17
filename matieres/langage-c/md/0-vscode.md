---
title: Module 0 — Coder en C sur VS Code (guide des manips)
subtitle: Installer un compilateur, configurer VS Code, compiler, exécuter et déboguer ton premier programme C, pas à pas et sans galère.
domains: DATA, BIG DATA, IA
tags: VS Code, gcc, MSYS2, MinGW-w64, WSL, tasks.json, launch.json, gdb, débogueur, IntelliSense, compilation, PATH
niveau: Débutant
duree: 60 min
objectifs: Comprendre le trio **éditeur / compilateur / débogueur** ; installer **GCC** avec MSYS2 et l'ajouter au `PATH` ; compiler et lancer un programme **dans le terminal** puis **avec le bouton ▷** ; configurer `tasks.json`, `launch.json` et `c_cpp_properties.json` ; poser des **points d'arrêt** et suivre une variable ; diagnostiquer les erreurs d'installation les plus courantes.
---

## 1. Ce qu'il faut vraiment pour coder en C

En Python, tu tapes `py script.py` et ça tourne : l'**interpréteur** lit ton code et l'exécute au fil de l'eau.
En C, il y a une étape de plus : un **compilateur** traduit d'abord ton code source en **programme exécutable**
(un `.exe` sous Windows), et c'est ce fichier qu'on lance.

::: def Les trois outils (à ne pas confondre)
- **L'éditeur** (VS Code) : là où tu écris le texte du programme. Il ne sait **pas** compiler tout seul.
- **Le compilateur** (GCC, Clang ou MSVC) : transforme `hello.c` en `hello.exe`.
- **Le débogueur** (GDB, LLDB…) : exécute le programme pas à pas pour inspecter les variables.

L'ensemble compilateur + éditeur de liens + débogueur + bibliothèques s'appelle une **toolchain** (chaîne d'outils).
:::

::: warn L'erreur n° 1 des débutants
Installer seulement VS Code et l'extension C/C++, puis s'étonner que « rien ne compile ».
**L'extension C/C++ ne contient aucun compilateur** : elle ne fait que piloter celui que tu installes à côté.
:::

| Outil | Rôle | Ce qu'on va utiliser |
|---|---|---|
| Éditeur | écrire, naviguer, autocompléter | **VS Code** + extension **C/C++** (Microsoft) |
| Compilateur | `.c` → `.exe` | **GCC** (via MSYS2 / MinGW-w64) |
| Débogueur | pas à pas, variables | **GDB** (installé avec GCC) |
| Terminal | lancer les commandes | terminal intégré de VS Code (PowerShell) |

::: py Côté Python
| | Python | C |
|---|---|---|
| Exécution | interprété (`py script.py`) | compilé puis exécuté (`gcc` → `.exe`) |
| Erreurs de type | détectées **à l'exécution** | beaucoup détectées **à la compilation** |
| Vitesse | lente sur les boucles pures | très rapide (code machine natif) |
| Mémoire | gérée automatiquement | **gérée par toi** (on y viendra au module 6) |

Le compilateur est donc un allié : il relit ton code **avant** qu'il tourne. Apprends à aimer ses messages.
:::

## 2. Choisir sa voie sous Windows

Il existe trois façons sérieuses d'obtenir un compilateur C sous Windows. Toutes marchent avec VS Code.

| Option | Ce que c'est | Points forts | Limites |
|---|---|---|---|
| **MSYS2 + MinGW-w64 (UCRT64)** ⭐ | GCC et GDB compilés pour Windows | simple, natif, produit de vrais `.exe`, recommandé par la doc VS Code | pas de Valgrind ni d'AddressSanitizer |
| **WSL** (Ubuntu dans Windows) | un vrai Linux intégré à Windows | environnement identique aux serveurs, Valgrind et sanitizers dispo | un peu plus lourd, fichiers côté Linux |
| **MSVC** (Visual Studio Build Tools) | le compilateur de Microsoft (`cl.exe`) | référence sous Windows | options différentes de GCC, doit être lancé depuis la « Developer Command Prompt » |

::: tip Notre choix pour ce cours
On commence avec **MSYS2 / GCC** (sections 3 à 9) : c'est le chemin le plus court vers un programme qui tourne.
Au **module 6** (mémoire dynamique), on ajoutera **WSL** pour profiter de Valgrind et d'AddressSanitizer,
indispensables pour traquer les fuites mémoire. La section 12 explique déjà comment l'installer.
:::

::: quiz Quiz 0.1
Tu viens d'installer VS Code et l'extension C/C++. Tu tapes `gcc hello.c` dans le terminal et tu obtiens « gcc n'est pas reconnu ». Quelle est la cause la plus probable ?
- [ ] L'extension C/C++ est mal installée
- [x] Aucun compilateur GCC n'est installé, ou son dossier n'est pas dans le `PATH`
- [ ] Le fichier doit s'appeler `hello.cpp`
- [ ] Il faut d'abord lancer le débogueur
> L'extension C/C++ n'embarque **aucun** compilateur. Windows cherche `gcc.exe` dans les dossiers listés par la variable `PATH` : si GCC n'est pas installé ou que son dossier `bin` n'y figure pas, la commande est inconnue. Renommer en `.cpp` ne changerait rien (ce serait même du C++), et le débogueur a lui aussi besoin d'un programme compilé.
:::

## 3. Étape 1 — Installer VS Code et l'extension C/C++

1. Installe **VS Code** depuis [code.visualstudio.com](https://code.visualstudio.com/) (si ce n'est pas déjà fait).
2. Ouvre la vue **Extensions** : `Ctrl+Maj+X`.
3. Cherche **C/C++** et installe celle publiée par **Microsoft** (identifiant `ms-vscode.cpptools`).
   Le pack **C/C++ Extension Pack** l'inclut, avec CMake Tools en bonus (utile au module 9).

::: info Ce que l'extension t'apporte
- **IntelliSense** : autocomplétion, infos au survol, soulignement des erreurs pendant la frappe ;
- le **bouton ▷** (Run / Debug C/C++ File) qui compile et lance le fichier actif ;
- l'intégration du **débogueur** GDB (points d'arrêt, variables, pile d'appels) ;
- le **formatage** du code (clang-format est inclus).
:::

## 4. Étape 2 — Installer GCC avec MSYS2

[[MSYS2|environnement qui fournit sous Windows des outils Unix et des builds natifs de GCC, mis à jour avec le gestionnaire de paquets pacman]]
est la méthode recommandée par la documentation officielle de VS Code.

1. Télécharge l'installeur sur [msys2.org](https://www.msys2.org/) et lance-le (Windows 10 64 bits récent ou Windows 11).
2. Garde le dossier proposé : **`C:\msys64`**. Note-le, on en a besoin plus bas.
3. À la fin, laisse cochée la case **Run MSYS2 now** : une fenêtre de terminal MSYS2 s'ouvre.
4. Dans ce terminal, installe la toolchain (GCC, GDB, make…) :

```bash
pacman -S --needed base-devel mingw-w64-ucrt-x86_64-toolchain
```

5. Appuie sur **Entrée** pour accepter tous les paquets proposés, puis tape **`Y`** pour confirmer.

::: def UCRT64, MINGW64, CLANG64 ?
MSYS2 propose plusieurs « environnements ». **UCRT64** compile tes programmes avec la bibliothèque C moderne
de Windows (Universal C Runtime) : c'est celui recommandé aujourd'hui. Les compilateurs installés se trouvent
dans **`C:\msys64\ucrt64\bin`**.
:::

### Ajouter GCC au PATH

Pour que Windows (et VS Code) trouvent `gcc.exe` depuis n'importe quel terminal :

1. Menu Démarrer → tape **« variables d'environnement »** → *Modifier les variables d'environnement pour votre compte*.
2. Dans **Variables utilisateur**, sélectionne **`Path`** → **Modifier** → **Nouveau**.
3. Ajoute : `C:\msys64\ucrt64\bin` → **OK** → **OK**.

### Vérifier l'installation

Ferme **tous** les terminaux (et VS Code), rouvre-les, puis tape :

```powershell
gcc --version
gdb --version
where.exe gcc      # doit afficher C:\msys64\ucrt64\bin\gcc.exe
```

::: warn « gcc n'est pas reconnu » alors que tout est installé ?
Un programme lit le `PATH` **au moment où il démarre**. Un terminal (ou un VS Code) ouvert **avant** la modification
garde l'ancien `PATH`. Ferme complètement VS Code (toutes les fenêtres) et rouvre-le. Si ça ne marche toujours pas,
vérifie que le dossier `C:\msys64\ucrt64\bin` contient bien `gcc.exe`.
:::

::: quiz Quiz 0.2
Tu as ajouté `C:\msys64\ucrt64\bin` au `PATH` pendant que VS Code était ouvert. Dans son terminal, `gcc --version` échoue toujours. Que faire ?
- [ ] Réinstaller MSYS2
- [ ] Ajouter aussi `C:\msys64` au `PATH`
- [x] Fermer et rouvrir VS Code pour qu'il relise le `PATH`
- [ ] Utiliser `g++` à la place de `gcc`
> Les variables d'environnement sont copiées au lancement d'un processus. VS Code et ses terminaux ont été lancés avant ta modification : ils ne la voient pas. Un simple redémarrage de VS Code suffit. Ajouter `C:\msys64` ne servirait à rien (gcc est dans `ucrt64\bin`) et `g++` est dans le même dossier, donc il serait introuvable aussi.
:::

## 5. Étape 3 — Créer un dossier de travail propre

::: warn Évite les espaces et les accents dans les chemins
Certains outils de la toolchain GNU gèrent mal les chemins comme `C:\Users\toi\Documents\ESGI\Troisième année\…`
(accents, espaces). Les symptômes sont déroutants : débogueur qui ne s'arrête pas, fichier « introuvable »…
Range tes projets C dans un chemin **simple** : par exemple `C:\dev\c`.
:::

Dans un terminal PowerShell :

```powershell
mkdir C:\dev\c\hello
cd C:\dev\c\hello
code .
```

`code .` ouvre VS Code **sur ce dossier**, qui devient ton **espace de travail** (*workspace*). Accepte la
question de confiance (*Yes, I trust the authors*) puisque c'est ton dossier.

::: tip Un dossier par projet
VS Code range sa configuration (compilation, débogage, IntelliSense) dans un sous-dossier **`.vscode`** de
l'espace de travail. Un dossier par projet (ou un dossier « exercices » par module) garde tout bien rangé.
Ouvre toujours le **dossier** (`code .` ou *Fichier → Ouvrir le dossier*), pas un fichier isolé.
:::

## 6. Étape 4 — Ton premier programme, compilé à la main

Crée un fichier **`hello.c`** (icône *Nouveau fichier* dans l'explorateur) et colle :

```c
#include <stdio.h>          // déclare printf (bibliothèque d'entrées/sorties standard)

int main(void)              // point d'entrée : l'exécution commence ici
{
    printf("Bonjour, le C !\n");   // \n = retour à la ligne
    return 0;               // 0 = « tout s'est bien passé » (code de retour)
}
```

Ouvre le terminal intégré (`Ctrl+ù` sur clavier AZERTY, ou *Affichage → Terminal*) et compile :

```powershell
gcc -Wall -Wextra -std=c17 -g hello.c -o hello.exe
.\hello.exe
```

Résultat : `Bonjour, le C !`. Tu viens de faire en deux commandes tout ce que fera le bouton ▷.

| Option | Signification | Pourquoi l'utiliser |
|---|---|---|
| `-Wall` | active les avertissements courants | attrape des bugs avant l'exécution |
| `-Wextra` | encore plus d'avertissements | comparaisons signé/non signé, paramètres inutilisés… |
| `-std=c17` | norme C17 | comportement prévisible quelle que soit la version de GCC |
| `-g` | ajoute les infos de débogage | indispensable pour GDB et les points d'arrêt |
| `-o hello.exe` | nom du fichier produit | sinon GCC crée `a.exe` |
| `-O2` | optimisations (plus tard) | programme plus rapide, mais débogage moins lisible |

::: info Pourquoi fixer `-std=c17` ?
Chaque version de GCC a une norme **par défaut** différente (GCC 15 est passé à C23, les versions précédentes
utilisaient C17). En l'écrivant explicitement, ton code se comporte pareil sur ta machine, celle de l'école et
le serveur de correction.
:::

::: tip Le code de retour
`return 0;` n'est pas décoratif : c'est le **code de sortie** du programme, lu par le terminal ou un script.
Dans PowerShell, affiche-le avec `$LASTEXITCODE` juste après l'exécution (sous Linux : `echo $?`).
Par convention : `0` = succès, autre chose = erreur.
:::

::: quiz Quiz 0.3
Pourquoi ajoute-t-on `-g` à la commande de compilation pendant l'apprentissage ?
- [ ] Pour que le programme soit plus rapide
- [x] Pour inclure les informations qui permettent au débogueur de relier le code machine aux lignes du `.c`
- [ ] Pour compiler en mode graphique
- [ ] Pour activer tous les avertissements
> `-g` insère les **symboles de débogage** : noms des variables, numéros de ligne… Sans eux, GDB ne sait pas où placer ton point d'arrêt ni afficher tes variables. Les avertissements, c'est `-Wall`/`-Wextra` ; la vitesse, c'est `-O2`.
:::

## 7. Étape 5 — Le bouton ▷ et `tasks.json`

Ouvre `hello.c`, clique sur le **▷** en haut à droite de l'éditeur → **Run C/C++ File**, puis choisis
**C/C++: gcc.exe build and debug active file** (la toute première fois seulement). Le programme est compilé
et sa sortie s'affiche dans le **terminal**.

En coulisse, VS Code a créé **`.vscode/tasks.json`** : la recette de compilation. Remplace-la par cette
version adaptée au C, avec les bons avertissements :

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "type": "cppbuild",
      "label": "C/C++: gcc.exe build active file",
      "command": "C:\\msys64\\ucrt64\\bin\\gcc.exe",
      "args": [
        "-fdiagnostics-color=always",
        "-Wall", "-Wextra", "-std=c17", "-g",
        "${file}",
        "-o",
        "${fileDirname}\\${fileBasenameNoExtension}.exe"
      ],
      "options": { "cwd": "${fileDirname}" },
      "problemMatcher": ["$gcc"],
      "group": { "kind": "build", "isDefault": true },
      "detail": "Compile le fichier C actif avec les avertissements"
    }
  ]
}
```

| Élément | Rôle |
|---|---|
| `command` | le compilateur à lancer (chemin complet) |
| `args` | ses options, **dans l'ordre** où on les taperait |
| `${file}` | le fichier actuellement ouvert |
| `${fileDirname}` / `${fileBasenameNoExtension}` | son dossier / son nom sans `.c` → `hello.exe` à côté de `hello.c` |
| `problemMatcher: $gcc` | transforme les messages de GCC en erreurs cliquables (panneau **Problèmes**) |
| `isDefault: true` | tâche lancée par **`Ctrl+Maj+B`** (Build) |

::: tip Compiler plusieurs fichiers `.c`
Pour un projet en plusieurs fichiers (module 9), remplace `"${file}"` par `"${fileDirname}\\*.c"` :
le GCC de MSYS2 développe le joker `*`. Au-delà de quelques fichiers, on passera à un **Makefile** ou à **CMake**.
:::

::: warn Le piège de Code Runner
L'extension populaire **Code Runner** (bouton ▶ « Run Code ») affiche par défaut la sortie dans le panneau
**Sortie**, qui est en **lecture seule** : un programme qui attend une saisie (`scanf`) **reste bloqué**.
Soit tu ne l'utilises pas (le ▷ de l'extension C/C++ suffit), soit tu ajoutes dans tes réglages :
`"code-runner.runInTerminal": true`.
:::

## 8. Étape 6 — Déboguer : points d'arrêt, pas à pas, variables

Le débogueur est l'outil qui fait passer de « ça ne marche pas » à « je vois **pourquoi** ». Teste-le sur ce
programme volontairement buggé :

```c
#include <stdio.h>

int main(void)
{
    int somme = 0;
    for (int i = 1; i < 5; i++) {      // on voulait additionner 1 à 5…
        somme += i;
    }
    printf("1 + 2 + 3 + 4 + 5 = %d\n", somme);   // affiche 10, pas 15 !
    return 0;
}
```

1. Clique dans la **marge** à gauche de la ligne `somme += i;` (ou `F9`) : un point rouge apparaît.
2. Lance **Debug C/C++ File** (menu du ▷) ou **`F5`**.
3. L'exécution s'arrête sur la ligne. À gauche, la vue **Variables** montre `i` et `somme`.
4. Avance avec **`F10`** et regarde `i` évoluer : 1, 2, 3, 4… puis la boucle s'arrête **avant** 5. Bug trouvé : il fallait `i <= 5`.

| Touche | Action |
|---|---|
| `F9` | poser / retirer un point d'arrêt |
| `F5` | démarrer le débogage / continuer jusqu'au prochain point d'arrêt |
| `F10` | pas à pas **principal** (exécute la ligne, sans entrer dans les fonctions) |
| `F11` | pas à pas **détaillé** (entre dans la fonction appelée) |
| `Maj+F11` | sortir de la fonction en cours |
| `Maj+F5` | arrêter le débogage |

::: tip Trois vues à connaître
- **Variables** : valeurs actuelles (survole aussi une variable dans le code).
- **Espion** (*Watch*) : ajoute une expression à suivre, par ex. `somme * 2` ou `i <= 5`.
- **Pile des appels** (*Call Stack*) : la chaîne de fonctions qui a mené ici (précieux avec la récursivité).

Clic droit sur un point d'arrêt → **Modifier le point d'arrêt** : il ne s'arrête que si une **condition** est
vraie (par ex. `i == 4`). Idéal pour une boucle de 10 000 tours.
:::

### `launch.json` : personnaliser le débogage

Menu du ▷ → **Add Debug Configuration** → choisis **C/C++: gcc.exe build and debug active file**. VS Code crée
`.vscode/launch.json` :

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "C/C++: gcc.exe build and debug active file",
      "type": "cppdbg",
      "request": "launch",
      "program": "${fileDirname}\\${fileBasenameNoExtension}.exe",
      "args": [],
      "stopAtEntry": false,
      "cwd": "${fileDirname}",
      "environment": [],
      "externalConsole": false,
      "MIMode": "gdb",
      "miDebuggerPath": "C:\\msys64\\ucrt64\\bin\\gdb.exe",
      "preLaunchTask": "C/C++: gcc.exe build active file"
    }
  ]
}
```

- `preLaunchTask` doit porter **exactement** le même nom que le `label` de `tasks.json` : on recompile avant chaque débogage.
- `args` : arguments passés au programme (on s'en servira avec `argc`/`argv` au module 8), ex. `["notes.csv"]`.
- `stopAtEntry: true` : s'arrêter dès la première ligne de `main`.
- `externalConsole: true` : lance le programme dans une **fenêtre séparée**. Si la saisie clavier (`scanf`) ne
  fonctionne pas pendant le débogage, c'est le premier réglage à essayer.

::: quiz Quiz 0.4
Tu débogues une boucle et l'exécution est arrêtée sur la ligne `resultat = calcul(x);`. Tu veux voir ce qui se passe **à l'intérieur** de `calcul`. Quelle touche ?
- [ ] `F10`
- [x] `F11`
- [ ] `F9`
- [ ] `Maj+F5`
> `F11` (*Step Into*) entre dans la fonction appelée. `F10` (*Step Over*) exécuterait `calcul` d'un coup et passerait à la ligne suivante ; `F9` pose un point d'arrêt ; `Maj+F5` arrête tout.
:::

## 9. Étape 7 — IntelliSense et les erreurs du compilateur

### Configurer IntelliSense

Si `#include <stdio.h>` est souligné en rouge alors que la compilation marche, IntelliSense ne sait pas quel
compilateur utiliser. Palette de commandes (`Ctrl+Maj+P`) → **C/C++: Select IntelliSense Configuration** →
**Use gcc.exe**. Ou crée `.vscode/c_cpp_properties.json` :

```json
{
  "configurations": [
    {
      "name": "Win32",
      "compilerPath": "C:/msys64/ucrt64/bin/gcc.exe",
      "cStandard": "c17",
      "intelliSenseMode": "windows-gcc-x64",
      "includePath": ["${workspaceFolder}/**"]
    }
  ],
  "version": 4
}
```

::: info IntelliSense ≠ compilateur
Les vagues rouges d'IntelliSense sont une **estimation** en temps réel. La vérité, c'est ce que dit **GCC** lors
de la compilation. En cas de désaccord, fie-toi au compilateur… puis corrige la configuration d'IntelliSense.
:::

### Lire un message d'erreur

```c
#include <stdio.h>

int main(void)
{
    int age = 20
    printf("%d\n", age);
    return 0;
}
```

```text
hello.c: In function 'main':
hello.c:5:17: error: expected ',' or ';' before 'printf'
    5 |     int age = 20
      |                 ^
      |                 ;
```

Format : **`fichier:ligne:colonne: type: message`**. Le point-virgule manque à la fin de la **ligne 5** ; GCC s'en
rend compte en lisant `printf` sur la ligne suivante et propose même la correction (le `;` sous la flèche). Avec le
*problem matcher*, l'erreur apparaît aussi dans le panneau **Problèmes** (`Ctrl+Maj+M`) : un clic t'emmène à la ligne.

| Type | Que faire |
|---|---|
| `error` | la compilation **échoue**, pas d'exécutable : corrige obligatoirement |
| `warning` | le programme est produit **mais** il y a probablement un bug : corrige aussi ! |
| `note` | complément d'information sur le message précédent |

::: tip Méthode
1. Corrige **la première erreur** seulement, puis recompile : une seule faute (un `;` oublié, une accolade
   manquante) peut provoquer une avalanche d'erreurs en cascade.
2. Vise **zéro warning**. En C, un avertissement ignoré devient souvent un bug à l'exécution.
:::

::: warn Fonction utilisée sans `#include`
Oublier `#include <stdio.h>` puis appeler `printf` provoque « implicit declaration of function 'printf' ».
Les anciennes versions de GCC se contentaient d'un warning ; **depuis GCC 14, c'est une erreur**. Bonne nouvelle :
c'était presque toujours un bug.
:::

::: exo Exercice 0.1 — Configurer une compilation exigeante
1. Crée un dossier `C:\dev\c\module0` et ouvre-le dans VS Code.
2. Écris un programme `carre.c` qui affiche les carrés de 1 à 10 (une ligne par nombre, ex. `3 -> 9`).
3. Mets en place un `tasks.json` qui compile avec `-Wall -Wextra -std=c17 -g`, puis compile avec `Ctrl+Maj+B`.
4. Lance le programme dans le terminal et affiche son code de retour.
?? Voir la solution
```c
#include <stdio.h>

int main(void)
{
    for (int n = 1; n <= 10; n++) {
        printf("%d -> %d\n", n, n * n);
    }
    return 0;
}
```

`tasks.json` : reprends celui de la section 7 (les options sont déjà dans `args`). Puis dans le terminal :

```powershell
.\carre.exe
$LASTEXITCODE     # affiche 0
```

Points de contrôle : le fichier `carre.exe` apparaît **à côté** de `carre.c` (grâce à `${fileDirname}`), et
`Ctrl+Maj+B` ne demande plus quelle tâche lancer (grâce à `isDefault: true`).
:::

::: exo Exercice 0.2 — Enquête au débogueur
Ce programme devrait afficher la moyenne de 4 notes (14, 9, 17, 12 → 13). Il affiche `Moyenne : 12.000000`.
Pose un point d'arrêt sur la ligne de la moyenne, observe `total` et `moyenne`, et trouve **les deux** bugs.

```c
#include <stdio.h>

int main(void)
{
    int notes[4] = {14, 9, 17, 11};
    int total = 0;
    for (int i = 0; i < 4; i++) {
        total += notes[i];
    }
    double moyenne = total / 4;
    printf("Moyenne : %f\n", moyenne);
    return 0;
}
```
?? Voir la solution
Deux problèmes, que le débogueur rend visibles :

1. **Donnée** : la dernière note vaut `11` au lieu de `12` → `total` vaut 51 au lieu de 52 (visible dans *Variables*).
2. **Division entière** : `total / 4` divise deux `int`, donc le résultat est **tronqué** (51 / 4 donne 12, pas 12,75)
   **avant** d'être rangé dans le `double`. Correction : `double moyenne = total / 4.0;` ou `(double)total / 4`.

Avec la note 12 et `4.0`, on obtient `13.000000`. On reviendra en détail sur la division entière au module 1 :
c'est l'un des pièges les plus fréquents du C.
:::

## 10. Confort : formatage et raccourcis

Pour un code toujours bien indenté : *Fichier → Préférences → Paramètres*, cherche **Format On Save** et coche-le.
L'extension C/C++ utilise **clang-format** ; `Maj+Alt+F` formate à la demande.

| Raccourci | Action |
|---|---|
| `Ctrl+Maj+P` | palette de commandes (tout est dedans) |
| `Ctrl+P` | ouvrir un fichier par son nom |
| `Ctrl+ù` | afficher / masquer le terminal (AZERTY) |
| `Ctrl+Maj+B` | compiler (tâche par défaut) |
| `Ctrl+Maj+M` | panneau Problèmes |
| `Ctrl+:` | commenter / décommenter la ligne (AZERTY) |
| `F12` | aller à la définition (d'une fonction, d'une variable…) |
| `F2` | renommer un symbole partout |
| `Alt+clic` | curseurs multiples |

::: info Configurer une fois pour toutes
Les réglages globaux (`Format On Save`, police…) sont dans tes **paramètres utilisateur**. Les fichiers
`tasks.json` / `launch.json` sont propres à **un** espace de travail : copie le dossier `.vscode` d'un projet
à l'autre pour ne pas tout refaire.
:::

## 11. Dépannage : les problèmes classiques

| Symptôme | Cause probable | Solution |
|---|---|---|
| `gcc` n'est pas reconnu | `PATH` non configuré ou non relu | section 4, puis **redémarrer VS Code** |
| `cannot open output file hello.exe: Permission denied` | l'ancien `hello.exe` **tourne encore** (souvent bloqué sur un `scanf`) | l'arrêter (`Ctrl+C` dans son terminal, ou poubelle 🗑 du terminal) puis recompiler |
| Le programme attend une saisie mais on ne peut rien taper | sortie dans le panneau **Sortie** (Code Runner) | lancer dans le **terminal** (section 7) |
| `scanf` ignoré pendant le débogage | console intégrée du débogueur | `"externalConsole": true` dans `launch.json` |
| Les accents s'affichent `Ã©` | la console Windows n'est pas en UTF-8 | taper `chcp 65001` dans le terminal avant de lancer (détails au module 2) |
| `The value of miDebuggerPath is invalid` | GDB absent ou mauvais chemin | vérifier `C:\msys64\ucrt64\bin\gdb.exe` et la toolchain |
| `#include <stdio.h>` souligné en rouge | IntelliSense mal configuré | *C/C++: Select IntelliSense Configuration* → gcc |
| Le point d'arrêt est ignoré (cercle gris) | compilé sans `-g`, ou chemin avec accents | ajouter `-g`, travailler dans `C:\dev\…` |
| Le `.exe` est lent à démarrer ou supprimé | l'antivirus analyse les nouveaux exécutables | patienter ; en dernier recours, exclure `C:\dev` de l'analyse |

::: quiz Quiz 0.5
Tu recompiles et l'éditeur de liens affiche `cannot open output file prog.exe: Permission denied`. Ton code n'a rien de suspect. Que se passe-t-il le plus probablement ?
- [ ] Il faut lancer VS Code en administrateur
- [ ] Ton disque est plein
- [x] Une exécution précédente de `prog.exe` est toujours en cours, donc Windows verrouille le fichier
- [ ] GCC n'a pas le droit d'écrire du C17
> Sous Windows, un exécutable **en cours d'exécution** ne peut pas être remplacé. C'est typique quand le programme précédent attend encore une saisie dans un autre terminal. Arrête-le (`Ctrl+C`) et recompile. Les droits administrateur ne sont pas nécessaires pour écrire dans ton propre dossier.
:::

## 12. Alternative : coder en C sous WSL (Linux)

[[WSL|Windows Subsystem for Linux : un vrai noyau Linux qui tourne dans Windows, sans machine virtuelle à gérer]]
te donne un environnement identique à celui des serveurs et des TP sous Linux. On s'en servira au module 6
pour Valgrind et AddressSanitizer.

```powershell
# PowerShell en ADMINISTRATEUR, une seule fois, puis redémarrer
wsl --install
```

Au redémarrage, Ubuntu s'ouvre et te demande un nom d'utilisateur et un mot de passe. Puis, **dans Ubuntu** :

```bash
sudo apt update
sudo apt install build-essential gdb valgrind   # gcc, make, gdb, valgrind
mkdir -p ~/c/hello && cd ~/c/hello
code .                                          # ouvre VS Code connecté à WSL
```

Dans VS Code, installe l'extension **WSL** (Microsoft) ; l'extension C/C++ doit être installée **côté WSL**
(VS Code le propose). Les chemins deviennent Linux : `gcc` et `gdb` sont dans `/usr/bin`, l'exécutable s'appelle
`hello` (sans `.exe`) et se lance avec `./hello`.

::: tip Garde tes fichiers côté Linux
Travailler dans `~/…` (le disque Linux) est beaucoup plus rapide que dans `/mnt/c/…` (le disque Windows vu depuis
Linux). L'explorateur Windows y accède via `\\wsl$`.
:::

::: jobs Où le C sert dans la vraie vie (et en Data/IA)
| Domaine | Exemples concrets |
|---|---|
| Systèmes d'exploitation | noyau Linux, une grande partie de Windows et de macOS |
| Bases de données | SQLite, PostgreSQL, Redis |
| Data / IA | CPython (l'interpréteur Python), le cœur de NumPy, de nombreux noyaux de calcul |
| Embarqué & IoT | microcontrôleurs, automobile, objets connectés, firmware |
| Réseau & sécurité | serveurs (nginx), OpenSSL, outils système |
:::

::: data Pourquoi un étudiant IABD apprend le C
Quand tu écris `np.sum(tableau)` en Python, la boucle tourne en **C** compilé : c'est pour ça qu'elle est
des dizaines de fois plus rapide qu'une boucle `for` en Python pur. Comprendre le C, c'est comprendre la
**mémoire**, les **types** et le **coût réel** du calcul, ce qui fait de meilleurs data engineers et ML engineers.
:::

::: exo Exercice 0.3 — Check-list d'installation
Sans regarder le cours, écris la liste ordonnée des étapes pour passer d'un PC vierge à « je débogue `hello.c`
avec un point d'arrêt dans VS Code ». Puis compare.
?? Voir la solution
1. Installer **VS Code**.
2. Installer l'extension **C/C++** de Microsoft.
3. Installer **MSYS2**, puis la toolchain : `pacman -S --needed base-devel mingw-w64-ucrt-x86_64-toolchain`.
4. Ajouter **`C:\msys64\ucrt64\bin`** au `PATH` utilisateur.
5. **Redémarrer** VS Code / les terminaux et vérifier `gcc --version` et `gdb --version`.
6. Créer un dossier **sans espaces ni accents** (`C:\dev\c\hello`) et l'ouvrir avec `code .`.
7. Écrire `hello.c`, compiler (▷ ou `gcc -Wall -Wextra -std=c17 -g hello.c -o hello.exe`).
8. Poser un point d'arrêt (`F9`) et lancer le débogage (`F5`).

Si tu as oublié l'étape 5, c'est normal : c'est **la** cause n° 1 des « ça ne marche pas » ! Pour réviser :
le compilateur installé par MSYS2 s'appelle ==gcc== et le débogueur ==gdb==.
:::

::: culture Culture & histoire — du C à VS Code
- **1969-1973, Bell Labs** : **Ken Thompson** et **Dennis Ritchie** créent Unix. Ritchie conçoit le **C** (successeur
  du langage **B** de Thompson) pour réécrire Unix dans un langage de haut niveau, mais assez proche de la machine
  pour remplacer l'assembleur. Pari réussi : Unix devient portable sur d'autres ordinateurs.
- **1978** : **Brian Kernighan** et Dennis Ritchie publient *The C Programming Language* (« le K&R »), qui
  popularise le célèbre programme `hello, world`.
- **1989-1990** : première norme ANSI puis ISO (C89/C90). Suivront C99, C11, C17 et C23.
- **1987** : **Richard Stallman** publie **GCC** dans le cadre du projet GNU, le compilateur libre qui deviendra
  omniprésent. **MinGW** (*Minimalist GNU for Windows*) puis **MinGW-w64** l'ont porté sous Windows.
- **2015** : Microsoft annonce **Visual Studio Code**, éditeur gratuit et open source, devenu l'un des plus
  utilisés au monde.

Ritchie et Thompson ont reçu le prix Turing en 1983 pour Unix. Le C a plus de 50 ans et reste l'un des langages
les plus utilisés : l'interpréteur Python officiel (CPython) est lui-même écrit en C.

- [Doc officielle : utiliser GCC avec MinGW dans VS Code](https://code.visualstudio.com/docs/cpp/config-mingw)
- [Doc officielle : C/C++ dans VS Code avec WSL](https://code.visualstudio.com/docs/cpp/config-wsl)
- [MSYS2](https://www.msys2.org/)
- [Dennis Ritchie : The Development of the C Language](https://www.bell-labs.com/usr/dmr/www/chist.html)
:::

## 13. Synthèse

::: goal À retenir absolument
- VS Code **édite**, GCC **compile**, GDB **débogue**. L'extension C/C++ ne fait que relier les trois.
- Installation Windows : **MSYS2** → `pacman -S --needed base-devel mingw-w64-ucrt-x86_64-toolchain` → ajouter
  `C:\msys64\ucrt64\bin` au `PATH` → **redémarrer** VS Code.
- Compilation de référence : `gcc -Wall -Wextra -std=c17 -g fichier.c -o fichier.exe`, puis `.\fichier.exe`.
- `tasks.json` = comment compiler (`Ctrl+Maj+B`) ; `launch.json` = comment déboguer (`F5`) ;
  `c_cpp_properties.json` = comment IntelliSense comprend ton code.
- Débogage : `F9` point d'arrêt, `F10` ligne suivante, `F11` entrer dans la fonction, vue **Variables**.
- Projets dans un chemin **sans espaces ni accents**. Corriger la **première** erreur d'abord, viser **zéro warning**.
:::

Prochaine étape : le **module 1**, pour comprendre ce que fait vraiment le compilateur et maîtriser types,
variables et opérateurs.
