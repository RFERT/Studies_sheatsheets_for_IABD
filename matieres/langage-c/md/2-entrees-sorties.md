---
title: Module 2 — Entrées/sorties console : printf, scanf, fgets
subtitle: Afficher proprement, lire une saisie sans se faire piéger par le tampon, et écrire une lecture d'entier vraiment robuste.
domains: DATA, BIG DATA, IA
tags: printf, scanf, fgets, sscanf, strtol, getchar, putchar, puts, stdin, stdout, stderr, EOF, tampon, buffer, format, redirection, UTF-8, chcp, entrées sorties
niveau: Débutant
duree: 75 min
objectifs: Maîtriser les **formats** de `printf` (largeur, précision, alignement) ; utiliser `scanf` correctement (`&`, `%lf`, valeur de retour) et comprendre le **`'\n'` resté dans le tampon** ; lire une ligne avec **`fgets`** et la convertir avec `sscanf` / **`strtol`** ; lire jusqu'à **EOF** ; écrire les erreurs sur **`stderr`** ; rediriger les flux et gérer les **accents** dans la console Windows.
---

## 1. Trois flux ouverts d'office

Au démarrage de tout programme C, trois **flux** (*streams*) sont déjà ouverts, déclarés dans `<stdio.h>` :

| Flux | Rôle | Par défaut | Fonctions typiques |
|---|---|---|---|
| `stdin` | entrée standard | le clavier | `scanf`, `fgets`, `getchar` |
| `stdout` | sortie standard | le terminal | `printf`, `puts`, `putchar` |
| `stderr` | sortie d'erreur | le terminal | `fprintf(stderr, …)`, `perror` |

::: def Tampon (*buffer*)
Les flux passent par une **mémoire tampon** : ce que tu tapes au clavier n'est envoyé au programme qu'à l'appui sur
**Entrée** (avec le `'\n'` !), et ce que tu affiches peut attendre dans le tampon de `stdout` avant d'apparaître.
Comprendre ce tampon, c'est comprendre 90 % des bugs de saisie en C.
:::

::: tip Une invite qui n'apparaît pas ?
Si tu affiches `printf("Ton age : ");` (sans `\n`) juste avant une saisie et que le texte n'apparaît pas à temps,
force l'envoi du tampon avec **`fflush(stdout);`**. Un `\n` en fin de message le vide souvent aussi.
:::

## 2. `printf` en détail

`printf(format, valeurs…)` remplace chaque **spécificateur** `%…` du format par la valeur suivante.

| Spécificateur | Type attendu | Exemple | Affiche |
|---|---|---|---|
| `%d` / `%i` | `int` | `printf("%d", 42)` | `42` |
| `%u` | `unsigned int` | `printf("%u", 42u)` | `42` |
| `%ld` / `%lld` | `long` / `long long` | `printf("%lld", 5000000000LL)` | `5000000000` |
| `%zu` | `size_t` | `printf("%zu", sizeof(int))` | `4` |
| `%f` | `double` (et `float`) | `printf("%f", 3.14)` | `3.140000` |
| `%e` | `double`, notation scientifique | `printf("%e", 1234.5)` | `1.234500e+03` |
| `%g` | `double`, la forme la plus courte | `printf("%g", 0.0001)` | `0.0001` |
| `%c` | caractère | `printf("%c", 'A')` | `A` |
| `%s` | chaîne | `printf("%s", "data")` | `data` |
| `%x` / `%X` | `unsigned`, hexadécimal | `printf("%x", 255)` | `ff` |
| `%p` | adresse (`void *`) | `printf("%p", (void *)&n)` | une adresse, ex. `000000a1b2c3d4e8` |
| `%%` | le caractère `%` | `printf("100%%")` | `100%` |

::: warn Le format DOIT correspondre au type
`printf("%d", 3.5)` ou `printf("%f", 7)` ne convertissent **rien** : c'est un comportement indéfini qui affiche
n'importe quoi. Compile avec `-Wall` : GCC vérifie les formats (*format '%d' expects argument of type 'int'…*).
:::

### Largeur, précision, alignement

La forme générale est `%[drapeaux][largeur][.précision]type` :

```c
#include <stdio.h>

int main(void)
{
    printf("[%5d]\n", 42);       // [   42]  largeur 5, aligné à droite
    printf("[%-5d]\n", 42);      // [42   ]  '-' : aligné à gauche
    printf("[%05d]\n", 42);      // [00042]  '0' : complète avec des zéros
    printf("[%+d]\n", 42);       // [+42]    '+' : affiche toujours le signe
    printf("[%.2f]\n", 3.14159); // [3.14]   2 décimales (arrondi)
    printf("[%8.3f]\n", 3.14159);// [   3.142] largeur 8 dont 3 décimales
    printf("[%.3s]\n", "Python");// [Pyt]    au plus 3 caractères
    printf("[%*d]\n", 6, 42);    // [    42] largeur donnée en argument
    return 0;
}
```

Séquences d'échappement utiles dans les chaînes : `\n` (retour à la ligne), `\t` (tabulation), `\\` (antislash),
`\"` (guillemet), `\'` (apostrophe), `\0` (caractère nul, fin de chaîne).

::: tip Tableaux alignés
Combine largeur et alignement pour produire des rapports lisibles, par exemple
`printf("%-12s %8.2f\n", nom, montant);` : noms alignés à gauche sur 12 colonnes, montants à droite sur 8.
:::

Deux fonctions plus simples quand il n'y a rien à formater :

```c
puts("Bienvenue");    // affiche la chaîne + un '\n' automatique
putchar('X');         // affiche un seul caractère
```

::: info `printf` renvoie quelque chose
`printf` renvoie le **nombre de caractères** écrits (ou une valeur négative en cas d'erreur). Rarement utile pour
l'affichage, mais pratique pour aligner des colonnes « à la main ».
:::

Code à prédire pour le quiz :

```c
printf("[%6.1f|%-4d|%03d]\n", 2.75, 7, 5);
```

::: quiz Quiz 2.1
Qu'affiche la ligne ci-dessus ?
- [ ] `[2.75|7|5]`
- [x] `[   2.8|7   |005]`
- [ ] `[2.8   |   7|500]`
- [ ] `[  2.75|7   |005]`
> `%6.1f` : une décimale (2,75 arrondi à `2.8`), sur 6 caractères alignés à droite → 3 espaces + `2.8`. `%-4d` : `7` aligné à gauche sur 4 → `7` + 3 espaces. `%03d` : 3 chiffres complétés par des zéros → `005`.
:::

## 3. `scanf` : lire une saisie formatée

`scanf` est le miroir de `printf` : il lit `stdin` selon un format et **range** les valeurs dans tes variables.
Pour qu'il puisse les modifier, on lui donne leur **adresse** avec `&` (les pointeurs arrivent au module 5).

```c
#include <stdio.h>

int main(void)
{
    int age;
    double taille;
    printf("Age et taille (m) : ");
    int lus = scanf("%d %lf", &age, &taille);   // & obligatoire, %lf pour un double
    if (lus != 2) {
        printf("Saisie invalide\n");
        return 1;
    }
    printf("%d ans, %.2f m\n", age, taille);
    return 0;
}
```

| Format `scanf` | Variable | Remarque |
|---|---|---|
| `%d` | `int` | ignore les espaces et retours à la ligne avant le nombre |
| `%ld` / `%lld` | `long` / `long long` | |
| `%f` | **`float`** | |
| `%lf` | **`double`** | ⚠️ différent de `printf` où `%f` suffit |
| `%c` | `char` | ne saute **pas** les espaces (lit même un `'\n'`) |
| `" %c"` | `char` | l'espace avant `%c` saute les blancs : à utiliser |
| `%19s` | tableau `char[20]` | lit **un mot** (s'arrête au premier espace), au plus 19 caractères |

::: def Valeur de retour de `scanf`
`scanf` renvoie le **nombre de variables correctement remplies**, ou `EOF` si l'entrée se termine avant toute
conversion. **Teste-la toujours** : c'est le seul moyen de savoir si l'utilisateur a tapé un nombre.
:::

::: warn Les 4 erreurs classiques de `scanf`
1. **Oublier `&`** : `scanf("%d", age);` → `scanf` écrit à une adresse au hasard → plantage. (`-Wall` prévient.)
2. **`%f` pour un `double`** : la valeur lue est fausse. Pour un `double`, c'est **`%lf`**.
3. **`%s` sans largeur** : `scanf("%s", nom)` déborde si le mot est plus long que le tableau → toujours `%19s`
   pour un `char nom[20]`.
4. **Ne pas tester le retour** : si l'utilisateur tape `abc` au lieu d'un nombre, la variable n'est pas remplie.
:::

::: quiz Quiz 2.2
Quelle ligne lit correctement un `double prix` ?
- [ ] `scanf("%f", &prix);`
- [x] `scanf("%lf", &prix);`
- [ ] `scanf("%lf", prix);`
- [ ] `scanf("%d", &prix);`
> Avec `scanf`, `%f` attend l'adresse d'un `float` (4 octets) et `%lf` celle d'un `double` (8 octets) : un mauvais format remplit mal la variable. Sans `&`, `scanf` reçoit la **valeur** de `prix` au lieu de son adresse. Attention, c'est l'inverse de `printf`, où `%f` convient très bien pour un `double`.
:::

## 4. Le piège du `'\n'` resté dans le tampon

```c
#include <stdio.h>

int main(void)
{
    int age;
    char reponse;
    printf("Age : ");
    scanf("%d", &age);                 // l'utilisateur tape 21 puis Entrée → tampon : "21\n"
    printf("Continuer (o/n) ? ");
    scanf("%c", &reponse);             // lit… le '\n' laissé par la saisie précédente !
    printf("Reponse = [%c]\n", reponse);   // affiche un saut de ligne, sans attendre la saisie
    return 0;
}
```

`scanf("%d")` consomme `21` mais **laisse le `'\n'`** dans le tampon. Le `%c` suivant le lit immédiatement, sans
attendre l'utilisateur. Deux corrections :

```c
scanf(" %c", &reponse);    // 1. l'espace avant %c saute tous les blancs, '\n' compris

int c;                     // 2. vider le reste de la ligne après chaque scanf
while ((c = getchar()) != '\n' && c != EOF) { }
```

### Saisie invalide : la boucle infinie

```c
int n;
printf("Un nombre : ");
while (scanf("%d", &n) != 1) {          // l'utilisateur tape "abc"
    printf("Invalide, recommence : ");
    // sans vidage, "abc" reste dans le tampon : scanf échoue à l'infini !
    int c;
    while ((c = getchar()) != '\n' && c != EOF) { }   // on jette la ligne fautive
}
```

::: warn `fflush(stdin)` n'est pas la solution
Tu verras souvent `fflush(stdin);` sur Internet. La norme C ne définit `fflush` que pour les flux de **sortie** :
sur `stdin`, c'est un comportement indéfini (qui « marche » avec certaines bibliothèques Windows et pas ailleurs).
Utilise la boucle `getchar()` ci-dessus.
:::

::: quiz Quiz 2.3
Après `scanf("%d", &n);` (saisie : `42` + Entrée), le programme exécute `scanf("%c", &rep);`. Que contient `rep` ?
- [ ] Le prochain caractère tapé par l'utilisateur
- [x] Le caractère `'\n'` resté dans le tampon
- [ ] `'4'`
- [ ] Rien : `scanf` renvoie 0
> `%d` s'arrête juste avant le `'\n'` et le laisse dans le tampon. `%c` lit **n'importe quel** caractère, espaces et retours à la ligne compris : il prend ce `'\n'` sans attendre. `" %c"` (avec un espace) aurait sauté les blancs.
:::

## 5. La méthode robuste : lire une ligne avec `fgets`

Les professionnels lisent rarement directement avec `scanf`. Ils lisent **toute la ligne** dans un tableau, puis
l'analysent : le tampon est vidé à chaque fois, et une saisie invalide ne bloque rien.

```c
#include <stdio.h>
#include <string.h>

int main(void)
{
    char ligne[100];
    printf("Ton prenom : ");
    if (fgets(ligne, sizeof ligne, stdin) == NULL) {   // NULL = fin d'entrée ou erreur
        return 1;
    }
    ligne[strcspn(ligne, "\n")] = '\0';    // retire le '\n' final s'il est présent
    printf("Bonjour %s !\n", ligne);
    return 0;
}
```

::: def `fgets(tab, taille, flux)`
Lit au plus `taille - 1` caractères **jusqu'au `'\n'` inclus**, ajoute le `'\0'` final et renvoie `tab`
(ou `NULL` à la fin de l'entrée). Contrairement à `scanf("%s")`, elle lit les **espaces** et ne déborde jamais
si on lui donne la vraie taille (`sizeof ligne`).
:::

::: tip `strcspn` en une ligne
`strcspn(ligne, "\n")` renvoie la position du premier `'\n'` (ou la longueur de la chaîne s'il n'y en a pas).
Y écrire `'\0'` coupe la chaîne à cet endroit : c'est l'idiome standard pour « nettoyer » une ligne lue par `fgets`.
:::

Une fois la ligne lue, on la convertit avec **`sscanf`** (un `scanf` qui lit dans une chaîne) :

```c
char ligne[100];
int jour, mois, annee;
if (fgets(ligne, sizeof ligne, stdin) != NULL &&
    sscanf(ligne, "%d/%d/%d", &jour, &mois, &annee) == 3) {
    printf("Date valide : %02d/%02d/%04d\n", jour, mois, annee);
} else {
    printf("Format attendu : JJ/MM/AAAA\n");
}
```

::: warn N'utilise jamais `gets`
`gets(tab)` lisait une ligne **sans limite de taille** : impossible à utiliser sans risque de débordement.
Elle a été **retirée de la norme en C11**. Les compilateurs récents refusent ou avertissent : utilise `fgets`.
:::

## 6. Lire un entier de façon vraiment sûre : `strtol`

`sscanf(ligne, "%d", &n)` accepte `12abc` (il lit 12 et ignore la suite) et ne détecte pas un nombre trop grand.
Pour une validation stricte, on utilise **`strtol`** (*string to long*) de `<stdlib.h>` :

```c
#include <errno.h>
#include <stdbool.h>
#include <stdio.h>
#include <stdlib.h>

/* Demande un entier entre min et max ; recommence tant que la saisie est invalide.
   Renvoie false si l'entrée se termine (EOF). */
bool lire_entier(const char *invite, int min, int max, int *resultat)
{
    char ligne[100];
    for (;;) {
        printf("%s", invite);
        fflush(stdout);
        if (fgets(ligne, sizeof ligne, stdin) == NULL) {
            return false;                            // fin de l'entrée
        }
        errno = 0;
        char *fin;
        long valeur = strtol(ligne, &fin, 10);       // base 10
        while (*fin == ' ' || *fin == '\t') fin++;   // tolère les espaces après le nombre
        if (fin == ligne || (*fin != '\n' && *fin != '\0')) {
            printf("  -> Ce n'est pas un nombre entier.\n");
        } else if (errno == ERANGE || valeur < min || valeur > max) {
            printf("  -> Le nombre doit etre entre %d et %d.\n", min, max);
        } else {
            *resultat = (int)valeur;
            return true;
        }
    }
}

int main(void)
{
    int note;
    if (lire_entier("Note sur 20 : ", 0, 20, &note)) {
        printf("Note enregistree : %d/20\n", note);
    }
    return 0;
}
```

| Vérification | Ce qu'elle détecte |
|---|---|
| `fin == ligne` | aucun chiffre lu (`abc`, ligne vide) |
| `*fin` n'est ni `'\n'` ni `'\0'` | des caractères après le nombre (`12abc`) |
| `errno == ERANGE` | nombre trop grand pour un `long` |
| `valeur < min` ou `> max` | hors de la plage métier |

::: info Les notions en avance
Cette fonction utilise `char *fin`, `*resultat` et `const char *` : ce sont des **pointeurs** (module 5). Pour
l'instant, retiens le mode d'emploi ; garde-la dans un coin, tu pourras la réutiliser dans tous tes TP.
:::

::: data Valider les entrées, un réflexe de data engineer
Un pipeline de données passe son temps à **parser** du texte (CSV, logs, formulaires). Les règles sont les mêmes
qu'ici : lire la ligne entière, convertir avec contrôle, rejeter proprement les valeurs invalides au lieu de
planter ou, pire, d'enregistrer silencieusement une valeur fausse. `strtol` est le cousin C de
`pd.to_numeric(..., errors="coerce")`.
:::

::: quiz Quiz 2.4
L'utilisateur tape `15 euros` puis Entrée. Que fait `lire_entier` (plage 0 à 20) ?
- [ ] Elle accepte 15
- [x] Elle refuse : il reste des caractères après le nombre
- [ ] Elle refuse : 15 est hors plage
- [ ] Elle plante
> `strtol` lit `15` et `fin` pointe ensuite sur l'espace. La boucle saute les espaces, puis `fin` arrive sur `e` : ni `'\n'` ni `'\0'`, donc la saisie est refusée. Avec `sscanf("%d")`, `15` aurait été accepté en ignorant « euros » sans prévenir.
:::

## 7. Lire caractère par caractère, jusqu'à EOF

```c
#include <stdio.h>

int main(void)
{
    int c;                                // int, PAS char : EOF n'est pas un caractère
    long lignes = 0, caracteres = 0;
    while ((c = getchar()) != EOF) {
        caracteres++;
        if (c == '\n') lignes++;
    }
    printf("%ld lignes, %ld caracteres\n", lignes, caracteres);
    return 0;
}
```

::: def EOF (*End Of File*)
Constante (en général −1) renvoyée par `getchar`, `scanf`… quand il n'y a **plus rien à lire**. Au clavier, on
la provoque avec **`Ctrl+Z` puis Entrée** sous Windows, **`Ctrl+D`** sous Linux / macOS. Avec un fichier
redirigé, elle arrive naturellement à la fin du fichier.
:::

::: warn `char c = getchar();` est un bug
`getchar` renvoie un `int` pour pouvoir distinguer les 256 valeurs d'octet possibles **et** `EOF`. Rangé dans un
`char`, `EOF` peut être confondu avec un vrai caractère (ou jamais détecté) : boucle infinie ou arrêt prématuré.
:::

Le même schéma marche avec `scanf`, très pratique pour traiter « autant de nombres que l'utilisateur en donne » :

```c
double x, somme = 0;
int n = 0;
while (scanf("%lf", &x) == 1) {   // s'arrête à EOF ou au premier mot non numérique
    somme += x;
    n++;
}
if (n > 0) printf("Moyenne de %d valeurs : %.2f\n", n, somme / n);
```

## 8. `stderr`, codes de retour et redirections

Les messages d'erreur vont sur **`stderr`**, pas sur `stdout` : ainsi, si on redirige les résultats dans un
fichier, les erreurs restent visibles à l'écran.

```c
#include <stdio.h>
#include <stdlib.h>

int main(void)
{
    double a, b;
    if (scanf("%lf %lf", &a, &b) != 2) {
        fprintf(stderr, "Erreur : deux nombres attendus\n");
        return EXIT_FAILURE;          // 1 : signale l'échec au terminal ou au script
    }
    if (b == 0) {
        fprintf(stderr, "Erreur : division par zero\n");
        return EXIT_FAILURE;
    }
    printf("%g\n", a / b);
    return EXIT_SUCCESS;              // 0
}
```

| Shell | Envoyer un fichier en entrée | Sortie dans un fichier | Erreurs dans un fichier |
|---|---|---|---|
| Linux (bash) / cmd | `./prog < data.txt` | `./prog > res.txt` | `./prog 2> err.txt` |
| **PowerShell** | `Get-Content data.txt` puis pipe vers `.\prog.exe` | `.\prog.exe > res.txt` | `.\prog.exe 2> err.txt` |

::: warn PowerShell ne connaît pas `<`
Dans le terminal par défaut de VS Code sous Windows (PowerShell), `.\prog.exe < data.txt` provoque une erreur :
l'opérateur `<` est réservé. Utilise un pipe, `Get-Content data.txt | .\prog.exe`, ou passe par cmd :
`cmd /c "prog.exe < data.txt"`.
:::

::: tip Tester sans retaper
Mets tes saisies de test dans un fichier `test.txt` et redirige-le vers ton programme : tu rejoues le même scénario
en une commande. C'est la base des tests automatisés de TP (et des correcteurs automatiques type Moulinette).
:::

::: quiz Quiz 2.5
Pourquoi écrire `fprintf(stderr, "Erreur…")` plutôt que `printf("Erreur…")` ?
- [ ] `stderr` affiche le texte en rouge
- [ ] `printf` ne peut pas afficher d'erreurs
- [x] Pour que les erreurs restent séparées des résultats, même quand `stdout` est redirigé vers un fichier
- [ ] Pour que le programme s'arrête automatiquement
> `stdout` et `stderr` sont deux flux distincts : `.\prog.exe > res.txt` ne capture que `stdout`, et les erreurs restent à l'écran (ou vont dans leur propre fichier avec `2>`). Ni la couleur ni l'arrêt du programme ne dépendent du flux : c'est `return EXIT_FAILURE` qui signale l'échec.
:::

## 9. Les accents dans la console Windows

Tu écris `printf("Été à Paris\n");` et le terminal affiche `Ã‰tÃ© Ã  Paris`. Pourquoi ? VS Code enregistre ton
fichier en **UTF-8** et GCC recopie ces octets tels quels dans le programme. Mais la console Windows française
interprète par défaut les octets avec une autre table (la page de codes **850**).

| Solution | Comment | Portée |
|---|---|---|
| Passer le terminal en UTF-8 | taper `chcp 65001` avant de lancer le programme | la session de terminal |
| Le faire depuis le programme | voir le code ci-dessous | ce programme, sous Windows |
| Éviter les accents | écrire `Ete a Paris` dans les messages | partout (solution des TP rapides) |

```c
#include <stdio.h>
#ifdef _WIN32
#include <windows.h>
#endif

int main(void)
{
#ifdef _WIN32
    SetConsoleOutputCP(65001);    /* 65001 = UTF-8 ; uniquement sous Windows */
#endif
    printf("Été à Paris : 25 °C\n");
    return 0;
}
```

::: info Et la saisie ?
Lire des caractères accentués au clavier dans la console Windows reste capricieux (ils occupent plusieurs octets
en UTF-8). Pour l'instant, fais tes tests de saisie sans accents : on étudiera la représentation des chaînes au
module 4. Sous Linux / WSL, la console est en UTF-8 par défaut : le problème n'existe pas.
:::

## 10. Exercices

::: exo Exercice 2.1 — Calculatrice
Écris une calculatrice qui lit une expression `nombre opérateur nombre` (ex. `12.5 * 4`), affiche le résultat avec
2 décimales, gère `+ - * /`, refuse la division par zéro et les opérateurs inconnus (message sur `stderr`, code de
retour 1).
?? Voir la solution
```c
#include <stdio.h>
#include <stdlib.h>

int main(void)
{
    double a, b, r;
    char op;
    printf("Calcul (ex. 12.5 * 4) : ");
    if (scanf("%lf %c %lf", &a, &op, &b) != 3) {    // " %c" non nécessaire ici : l'espace du format saute les blancs
        fprintf(stderr, "Format attendu : nombre operateur nombre\n");
        return EXIT_FAILURE;
    }
    switch (op) {
        case '+': r = a + b; break;
        case '-': r = a - b; break;
        case '*': r = a * b; break;
        case '/':
            if (b == 0) {
                fprintf(stderr, "Division par zero\n");
                return EXIT_FAILURE;
            }
            r = a / b;
            break;
        default:
            fprintf(stderr, "Operateur inconnu : %c\n", op);
            return EXIT_FAILURE;
    }
    printf("%.2f %c %.2f = %.2f\n", a, op, b, r);
    return EXIT_SUCCESS;
}
```

Le format `"%lf %c %lf"` contient des **espaces** : chacun saute les blancs éventuels, donc `12.5*4` et
`12.5 * 4` fonctionnent tous les deux. Le `switch` est détaillé au module 3.
:::

::: exo Exercice 2.2 — Ticket de caisse aligné
Lis des lignes `article quantité prix_unitaire` (ex. `Cafe 2 1.80`) jusqu'à EOF, puis affiche un ticket aligné :
nom sur 12 colonnes à gauche, quantité sur 4, total de la ligne sur 8 avec 2 décimales, puis le total général.
Teste avec un fichier : `Get-Content achats.txt | .\ticket.exe`.
?? Voir la solution
```c
#include <stdio.h>

int main(void)
{
    char nom[32];
    int qte;
    double pu, total = 0;
    printf("%-12s %4s %8s\n", "Article", "Qte", "Montant");
    printf("-------------------------\n");
    while (scanf("%31s %d %lf", nom, &qte, &pu) == 3) {   // nom : pas de & (tableau, module 4)
        double ligne = qte * pu;
        total += ligne;
        printf("%-12s %4d %8.2f\n", nom, qte, ligne);
    }
    printf("-------------------------\n");
    printf("%-12s %4s %8.2f\n", "TOTAL", "", total);
    return 0;
}
```

`%31s` protège le tableau `nom[32]` (31 caractères + `'\0'`). La boucle s'arrête à la fin du fichier (EOF) ou à
la première ligne mal formée. Pour un tableau, on ne met **pas** de `&` : son nom désigne déjà une adresse (module 4).
:::

::: exo Exercice 2.3 — Menu robuste
En réutilisant `lire_entier` (section 6), écris un menu en boucle :
`1. Convertir des euros en dollars` / `2. Convertir des dollars en euros` / `0. Quitter`.
Le choix doit être validé (0 à 2), les montants lus avec `scanf("%lf")` et vérifiés. Le programme doit survivre à
n'importe quelle saisie (lettres, ligne vide, `Ctrl+Z`).
?? Voir la solution
```c
/* ... coller ici les #include et la fonction lire_entier de la section 6 ... */

int main(void)
{
    const double TAUX = 1.08;      /* 1 euro = 1,08 dollar (valeur d'exemple) */
    int choix;
    while (lire_entier("\n1. EUR -> USD\n2. USD -> EUR\n0. Quitter\nChoix : ", 0, 2, &choix)) {
        if (choix == 0) break;
        double montant;
        printf("Montant : ");
        if (scanf("%lf", &montant) != 1 || montant < 0) {
            printf("  -> Montant invalide.\n");
        } else if (choix == 1) {
            printf("  %.2f EUR = %.2f USD\n", montant, montant * TAUX);
        } else {
            printf("  %.2f USD = %.2f EUR\n", montant, montant / TAUX);
        }
        int c;                                    /* vide la fin de ligne laissée par scanf */
        while ((c = getchar()) != '\n' && c != EOF) { }
    }
    printf("Au revoir !\n");
    return 0;
}
```

Le vidage après le `scanf` est indispensable : sinon le `'\n'` (ou des lettres invalides) seraient lus par le
`fgets` de `lire_entier` au tour suivant, qui afficherait « Ce n'est pas un nombre entier » sans raison. Encore plus
robuste : lire le montant aussi avec `fgets` + `strtod` (la version `double` de `strtol`).
:::

::: culture Culture & histoire — stdio, gets et les chaînes de format
- **Vers 1973** : **Mike Lesk** écrit aux Bell Labs une bibliothèque d'entrées/sorties « portable » pour le C.
  Elle devient **stdio** (`printf`, `scanf`, `FILE`…), standardisée avec Unix V7 (1979) puis avec la norme C89.
  Le principe des flux `stdin` / `stdout` / `stderr` et des redirections `<` `>` vient de la philosophie Unix :
  « des petits programmes qui lisent du texte et en écrivent ».
- **1988, le ver Morris** : l'un des premiers vers d'Internet exploite notamment un débordement de tampon dans le
  service `fingerd`, qui lisait sa requête avec… `gets`. `gets` sera dépréciée en C99 puis **supprimée en C11**.
- **Vers 2000, les attaques par chaîne de format** : écrire `printf(saisie)` au lieu de `printf("%s", saisie)`
  permet à un attaquant de glisser des `%x` (lire la mémoire) ou `%n` (y **écrire**) dans sa saisie. Toujours
  passer les données comme **arguments**, jamais comme format.

- [cppreference : printf et ses formats](https://en.cppreference.com/w/c/io/fprintf)
- [cppreference : scanf](https://en.cppreference.com/w/c/io/fscanf)
- [cppreference : strtol](https://en.cppreference.com/w/c/string/byte/strtol)
- [OWASP : Format string attack](https://owasp.org/www-community/attacks/Format_string_attack)
:::

## 11. Synthèse

::: goal À retenir absolument
- `printf` : `%d` int, `%f` double, `%c` char, `%s` chaîne, `%zu` size_t, `%%` pour `%`. Largeur et précision :
  `%8.2f`, `%-12s`, `%05d`. Le format doit **correspondre** au type.
- `scanf` : `&` devant les variables, **`%lf` pour un `double`**, largeur pour `%s` (`%19s`), **tester la valeur
  de retour**.
- Le `'\n'` reste dans le tampon après `scanf("%d")` : `" %c"` ou boucle `getchar()` pour le vider ;
  **jamais** `fflush(stdin)`.
- Méthode robuste : **`fgets` + `strcspn`** pour lire la ligne, puis `sscanf` ou **`strtol`** pour la convertir.
- `getchar` renvoie un **`int`** ; EOF = `Ctrl+Z` puis Entrée (Windows), `Ctrl+D` (Linux).
- Erreurs sur **`stderr`**, `return EXIT_FAILURE` ; PowerShell : `Get-Content f.txt | .\prog.exe` (pas de `<`).
- Accents : `chcp 65001` ou `SetConsoleOutputCP(65001)`.
:::

Prochaine étape : le **module 3** (à venir) : conditions, boucles et fonctions.
