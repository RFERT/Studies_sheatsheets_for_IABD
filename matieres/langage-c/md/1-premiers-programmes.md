---
title: Module 1 — Premiers programmes, types et opérateurs
subtitle: Ce que fait vraiment le compilateur, comment le C range les nombres en mémoire, et les pièges de calcul qui piègent même les développeurs confirmés.
domains: DATA, BIG DATA, IA
tags: main, compilation, préprocesseur, éditeur de liens, types, int, double, char, sizeof, const, define, opérateurs, division entière, modulo, cast, conversion, dépassement, overflow, comportement indéfini, stdint
niveau: Débutant
duree: 75 min
objectifs: Décrire les **4 étapes** de la compilation et reconnaître une erreur de compilation d'une erreur d'**édition de liens** ; déclarer des variables avec le **bon type** et connaître leurs tailles ; écrire des constantes (`const`, `#define`, littéraux) ; prédire le résultat d'une expression (**division entière**, modulo, priorités, conversions, cast) ; repérer les **dépassements** et les **comportements indéfinis**.
---

## 1. Anatomie d'un programme C

```c
#include <stdio.h>                 // (1) directive du préprocesseur : importe des déclarations

#define TVA 0.20                    // (2) macro : remplacée par 0.20 avant la compilation

int main(void)                      // (3) fonction principale, point d'entrée
{                                   // (4) début du bloc
    double prix_ht = 50.0;          // (5) déclaration + initialisation d'une variable
    double prix_ttc = prix_ht * (1 + TVA);
    printf("Prix TTC : %.2f euros\n", prix_ttc);   // (6) appel de fonction
    return 0;                       // (7) code de retour vers le système
}                                   // (8) fin du bloc
```

| Élément | À retenir |
|---|---|
| `#include <stdio.h>` | colle le contenu du fichier d'en-tête `stdio.h` (déclarations de `printf`, `scanf`…) |
| `#define` | remplacement de texte **avant** la compilation (pas de `=`, pas de `;`) |
| `int main(void)` | le programme commence toujours par `main` ; `void` = aucun paramètre |
| `{ … }` | un **bloc** : regroupe des instructions et délimite la portée des variables |
| `;` | termine **chaque instruction** (pas les blocs, ni les `#include`) |
| `return 0;` | code de sortie : 0 = succès |

::: info Le C est sensible à la casse et aux types
`Prix` et `prix` sont deux variables différentes. Et chaque variable a un **type fixé une fois pour toutes** :
contrairement à Python, `prix_ht = "cinquante";` est refusé par le compilateur si `prix_ht` est un `double`.
:::

## 2. De la source à l'exécutable : les 4 étapes

Quand tu tapes `gcc hello.c -o hello.exe`, GCC enchaîne en réalité **quatre outils** :

```text
hello.c ──(1) préprocesseur──▶ hello.i ──(2) compilateur──▶ hello.s ──(3) assembleur──▶ hello.o ──(4) éditeur de liens──▶ hello.exe
           #include, #define           C → assembleur          assembleur → code machine          + bibliothèque C (printf…)
```

| Étape | Ce qu'elle fait | Voir le résultat |
|---|---|---|
| 1. Préprocesseur | colle les `#include`, remplace les `#define`, retire les commentaires | `gcc -E hello.c -o hello.i` |
| 2. Compilation | vérifie la syntaxe et les types, traduit en assembleur | `gcc -S hello.c` → `hello.s` |
| 3. Assemblage | traduit l'assembleur en code machine (fichier **objet**) | `gcc -c hello.c` → `hello.o` |
| 4. Édition de liens | assemble les `.o` et les bibliothèques en un exécutable | `gcc hello.o -o hello.exe` |

::: def Déclaration vs définition
`stdio.h` contient seulement la **déclaration** de `printf` (son nom, ses paramètres, son type de retour) : de quoi
permettre au compilateur de vérifier ton appel. Le **code** de `printf` (sa définition) est déjà compilé dans la
**bibliothèque C** du système ; c'est l'**éditeur de liens** (*linker*) qui le relie à ton programme.
:::

::: tip Savoir qui se plaint
- `error: …` avec un numéro de ligne → erreur de **compilation** (syntaxe, type) : regarde ta ligne.
- `undefined reference to 'calcul'` → erreur d'**édition de liens** : la fonction est **déclarée** mais son code est
  introuvable (faute de frappe dans le nom, fichier `.c` oublié dans la commande de compilation…).
:::

::: quiz Quiz 1.1
Ton programme appelle `calculer_moyenne()`, déclarée en haut du fichier, mais dont tu as oublié d'écrire le corps. À quel moment l'erreur apparaît-elle ?
- [ ] Au préprocesseur, car la fonction n'est pas dans un `#include`
- [ ] À la compilation, à la ligne de l'appel
- [x] À l'édition de liens : `undefined reference to 'calculer_moyenne'`
- [ ] À l'exécution, par un plantage
> La **déclaration** suffit au compilateur pour valider l'appel (bon nombre d'arguments, bons types). C'est seulement en assemblant l'exécutable que l'éditeur de liens cherche le **code** de la fonction et ne le trouve pas. C'est pour cela que le message ne cite pas de numéro de ligne de ton `.c`.
:::

## 3. Variables : déclarer, initialiser, portée

```c
int age;                 // déclaration seule : valeur INDÉTERMINÉE (n'importe quoi)
int annee = 2026;        // déclaration + initialisation (à préférer)
double x = 1.5, y = 2.0; // plusieurs variables du même type
age = 21;                // affectation plus tard
```

::: warn Variable non initialisée = valeur aléatoire
En Python, utiliser une variable non définie lève une erreur. En C, une variable **locale** non initialisée
contient ce qui traînait en mémoire : lire sa valeur est un **comportement indéfini**. `-Wall` le signale souvent
(`'age' is used uninitialized`). Règle simple : **initialise toujours** à la déclaration.
:::

Une variable n'existe que dans le **bloc** `{ }` où elle est déclarée (sa **portée**) :

```c
int main(void)
{
    int total = 0;
    for (int i = 0; i < 3; i++) {   // i n'existe que dans la boucle
        int carre = i * i;           // carre n'existe que dans ce bloc
        total += carre;
    }
    // printf("%d", i);    → erreur : 'i' undeclared
    return total;           // OK : total est encore visible
}
```

Règles de nommage : lettres, chiffres et `_`, sans commencer par un chiffre ; pas de mot-clé (`int`, `for`…).
Convention courante en C : `snake_case` pour les variables et fonctions, `MAJUSCULES` pour les macros.

## 4. Les types de base

Le type dit au compilateur **combien d'octets** réserver et **comment interpréter** les bits.

| Type | Taille typique (x86-64) | Plage typique | Format `printf` |
|---|---|---|---|
| `char` | 1 octet (toujours) | −128 à 127 (souvent) | `%c` (caractère) / `%d` |
| `short` | 2 octets | −32 768 à 32 767 | `%hd` |
| `int` | 4 octets | environ ± 2,1 milliards | `%d` |
| `long` | **4 octets sous Windows**, 8 sous Linux | dépend du système ! | `%ld` |
| `long long` | 8 octets | environ ± 9,2 × 10¹⁸ | `%lld` |
| `float` | 4 octets | ~7 chiffres significatifs | `%f` |
| `double` | 8 octets | ~15-16 chiffres significatifs | `%f` |
| `unsigned int` | 4 octets | 0 à environ 4,29 milliards | `%u` |
| `size_t` | 8 octets (64 bits) | tailles et indices, ≥ 0 | `%zu` |

::: warn La norme ne fixe que des minimums
Le standard C garantit seulement `char` = 1 octet, `int` ≥ 16 bits, `long` ≥ 32 bits, `long long` ≥ 64 bits.
Le cas réel le plus piégeux : **`long` fait 32 bits sous Windows et 64 bits sous Linux**. Un programme qui
compte des octets de fichier dans un `long` peut marcher sur le serveur et déborder sur ton PC.
:::

Pour une taille **garantie**, utilise `<stdint.h>` :

```c
#include <stdint.h>
#include <stdio.h>

int main(void)
{
    int8_t   petit  = -100;            // exactement 8 bits signés
    uint8_t  pixel  = 255;             // 0..255 : un canal de couleur d'une image
    int32_t  compte = 2000000000;      // exactement 32 bits
    int64_t  octets = 5000000000;      // exactement 64 bits (pas de surprise Windows/Linux)
    printf("%d %d %d %lld\n", petit, pixel, compte, (long long)octets);
    printf("int = %zu octets, long = %zu octets, double = %zu octets\n",
           sizeof(int), sizeof(long), sizeof(double));
    return 0;
}
```

::: def L'opérateur `sizeof`
`sizeof(type)` ou `sizeof variable` donne la taille **en octets**, calculée à la compilation. Son résultat est de
type `size_t` (entier non signé) : on l'affiche avec **`%zu`**, pas `%d`.
:::

::: info `bool` en C
Avant C23, il n'y a pas de type booléen « natif » visible : on inclut `<stdbool.h>` pour avoir `bool`, `true` et
`false`. Une condition est **fausse si elle vaut 0** et **vraie sinon** : `if (n)` signifie `if (n != 0)`.
:::

::: data Les types, c'est de la mémoire… et de l'argent
Un jeu de données de 100 millions de valeurs occupe **800 Mo** en `double` (8 octets) mais **400 Mo** en `float`
et **100 Mo** en `uint8_t`. C'est exactement le choix que tu fais en Pandas/NumPy avec `dtype=np.float32` ou
`np.uint8` : ces dtypes **sont** les types C sous-jacents.
:::

::: quiz Quiz 1.2
Tu stockes la taille d'un fichier vidéo de 3 Go (3 000 000 000 octets). Quel type est sûr **à la fois** sous Windows et sous Linux ?
- [ ] `int`
- [ ] `long`
- [x] `int64_t` (ou `long long`)
- [ ] `short`
> 3 milliards dépasse la limite d'un `int` 32 bits (environ 2,1 milliards). `long` fait 64 bits sous Linux mais seulement **32 bits sous Windows** : il déborderait sur ton PC. `int64_t` garantit 64 bits partout (`long long` aussi, au moins 64 bits).
:::

## 5. Constantes et littéraux

| Écriture | Type | Valeur |
|---|---|---|
| `42` | `int` | quarante-deux |
| `0x2A` | `int` (hexadécimal) | 42 |
| `052` | `int` (**octal** !) | 42 |
| `42u` / `42L` / `42LL` | `unsigned` / `long` / `long long` | 42 |
| `3.14` | `double` | 3,14 |
| `3.14f` | `float` | 3,14 (moins précis) |
| `1e-3` | `double` | 0,001 |
| `'A'` | caractère (valeur entière `int`) | 65 en ASCII |
| `"texte"` | chaîne (tableau de `char` terminé par `'\0'`) | voir module 4 |

::: warn Le zéro de tête
En C, un nombre qui commence par `0` est en **base 8**. `int code_postal = 075010;` ne vaut **pas** 75010 mais
31240 (75010 lu en octal)… Et `09` est même une erreur, car 9 n'existe pas en octal.
:::

Deux façons de nommer une constante :

```c
#include <stdio.h>

#define TAILLE_MAX 100          // macro : remplacement de texte, sans type, sans ;
const double G = 9.81;          // vraie variable typée, en lecture seule

int main(void)
{
    int tableau[TAILLE_MAX];    // OK : la macro devient 100
    printf("%zu octets, g = %.2f\n", sizeof tableau, G);
    // G = 10.0;                → erreur : assignment of read-only variable 'G'
    return 0;
}
```

::: tip `const` ou `#define` ?
Préfère `const` pour une valeur typée (le compilateur vérifie le type, le débogueur l'affiche). Garde `#define`
pour ce qui doit être connu du préprocesseur (tailles de tableaux classiques, compilation conditionnelle).
Piège classique : `#define TVA 0.20;` (avec `;`) colle le `;` partout où `TVA` apparaît.
:::

## 6. Opérateurs arithmétiques : attention à la division

```c
int a = 17, b = 5;
printf("%d\n", a + b);     // 22
printf("%d\n", a / b);     // 3   ← division ENTIÈRE (partie décimale perdue)
printf("%d\n", a % b);     // 2   ← reste (modulo)
printf("%f\n", a / 2.0);   // 8.500000 ← un double dans l'opération → division réelle
printf("%d\n", -17 / 5);   // -3  ← tronqué vers zéro
printf("%d\n", -17 % 5);   // -2  ← le reste a le signe du dividende
```

::: theorem Règle de la division
Si **les deux** opérandes de `/` sont entiers, la division est **entière** et le résultat est **tronqué vers zéro**
(depuis C99). Il suffit qu'**un seul** opérande soit flottant pour obtenir une division réelle. Et toujours :
\[ a = (a / b) \times b + (a \% b) \]
:::

::: py Côté Python
| Opération | Python 3 | C (entiers) |
|---|---|---|
| `17 / 5` | `3.4` | `3` |
| `-17 // 5` (Python) / `-17 / 5` (C) | `-4` (arrondi vers −∞) | `-3` (tronqué vers 0) |
| `-17 % 5` | `3` | `-2` |

Le `/` du C sur des entiers ressemble à `//` de Python… sauf pour les nombres **négatifs** !
:::

### Incrémentation et affectations composées

```c
int n = 5;
n += 3;       // n = n + 3  → 8
n *= 2;       // n = n * 2  → 16
n++;          // n = n + 1  → 17
int x = n++;  // POSTfixe : x reçoit 17, PUIS n passe à 18
int y = ++n;  // PRÉfixe : n passe à 19, PUIS y reçoit 19
```

::: warn Une variable, une modification par expression
`i = i++ + ++i;` ou `printf("%d %d", i, i++);` sont des **comportements indéfinis** : le résultat dépend du
compilateur. Ne modifie jamais une variable deux fois (ou ne la lis pas et la modifies pas) dans la même expression.
:::

Code à prédire pour le quiz suivant :

```c
double r1 = 5 / 2 * 2.0;
double r2 = 2.0 * 5 / 2;
int    r3 = 7 % 3 + 10 / 4;
```

::: quiz Quiz 1.3
Que valent `r1`, `r2` et `r3` dans le code ci-dessus ?
- [ ] `5.0`, `5.0`, `3`
- [x] `4.0`, `5.0`, `3`
- [ ] `4.0`, `4.0`, `2`
- [ ] `5.0`, `5.0`, `4`
> Les opérateurs `*` `/` `%` ont la même priorité et s'évaluent **de gauche à droite**. `r1` : `5 / 2` (deux entiers) donne `2`, puis `2 * 2.0` = `4.0`. `r2` : `2.0 * 5` = `10.0` (double), puis `10.0 / 2` = `5.0`. `r3` : `7 % 3` = `1`, `10 / 4` = `2` (entière), total `3`. Même opérandes, ordre différent, résultat différent !
:::

## 7. Comparaisons, logique et priorités

Les comparaisons (`==`, `!=`, `<`, `<=`, `>`, `>=`) renvoient un `int` : **1** si vrai, **0** si faux.
Les opérateurs logiques combinent des conditions :

```c
int age = 20, inscrit = 1;
int ok = (age >= 18) && inscrit;   // ET : vrai si les deux le sont      → 1
int ko = (age < 18) || !inscrit;   // OU : vrai si l'un des deux l'est   → 0
                                   // !  : NON
// Évaluation paresseuse (court-circuit) :
// dans A && B, B n'est PAS évalué si A est faux ; dans A || B, B n'est pas évalué si A est vrai.
int d = 0;
if (d != 0 && 100 / d > 2) { }     // sûr : la division n'est jamais faite si d vaut 0
```

::: warn `=` n'est pas `==`
`if (x = 0)` **affecte** 0 à `x`, puis teste 0 (faux) : le bloc n'est jamais exécuté et `x` est écrasé.
Avec `-Wall`, GCC prévient : *suggest parentheses around assignment used as truth value*. Encore une raison
de compiler avec les avertissements.
:::

Priorités, de la plus forte à la plus faible (les plus utiles) :

```text
1. ()  appels, [] indices          5. == !=
2. !  ++  --  - (unaire)  (cast)   6. &&
3. *  /  %                         7. ||
4. +  -  puis  <  <=  >  >=        8. =  +=  -=  *=  /=  (affectations, en dernier)
```

::: tip En cas de doute : des parenthèses
`(a + b) * c`, `(x > 0) && (y > 0)` : les parenthèses ne coûtent rien et rendent le code lisible pour ton
binôme (et pour toi dans trois semaines).
:::

::: quiz Quiz 1.4
Que vaut `r` après `int a = 0, b = 5; int r = (a != 0) && (b / a > 1);` ?
- [ ] Le programme plante : division par zéro
- [x] `0`, sans division par zéro
- [ ] `1`
- [ ] Comportement indéfini
> `&&` est évalué **paresseusement** : `a != 0` est faux, donc le résultat est déjà connu (0) et `b / a` n'est **jamais calculé**. C'est un idiome très courant pour protéger une opération risquée.
:::

## 8. Conversions de types et cast

Dans une expression mêlant plusieurs types, le C **convertit automatiquement** vers le type le plus « large » :
`char`/`short` → `int` → `long` → `long long` → `float` → `double`.

```c
int    n = 7;
double m = n / 2;             // 3.0  : division entière AVANT la conversion en double
double p = (double)n / 2;     // 3.5  : cast → n devient 7.0 avant la division
int    q = 3.99;              // 3    : un double rangé dans un int est TRONQUÉ (pas arrondi)
int    r = (int)-3.99;        // -3   : tronqué vers zéro
char   c = 'A' + 2;           // 'C'  : un char est un petit entier (65 + 2 = 67)
```

::: def Cast (conversion explicite)
`(type) expression` convertit la valeur dans le type indiqué. Le cast agit sur **la valeur qui suit
immédiatement** : `(double)(n / 2)` vaut `3.0` (division déjà faite), `(double)n / 2` vaut `3.5`.
:::

### Le piège signé / non signé

```c
#include <stdio.h>

int main(void)
{
    int negatif = -1;
    unsigned int zero = 0;
    if (negatif < zero) {
        printf("-1 < 0, logique\n");
    } else {
        printf("Surprise : -1 n'est pas < 0 !\n");   // c'est CETTE ligne qui s'affiche
    }
    return 0;
}
```

Quand on compare un `int` et un `unsigned int`, le signé est converti en **non signé** : `-1` devient
4 294 967 295. `-Wextra` signale ce genre de comparaison (*comparison of integer expressions of different
signedness*). C'est fréquent avec `size_t` (tailles) comparé à un indice `int`.

### Les flottants ne sont pas exacts

```c
#include <math.h>     // fabs
#include <stdio.h>

int main(void)
{
    double a = 0.1 + 0.2;
    if (a == 0.3) printf("egal\n");                 // ne s'affiche PAS
    printf("%.17f\n", a);                            // 0.30000000000000004
    if (fabs(a - 0.3) < 1e-9) printf("proche\n");   // la bonne façon de comparer
    return 0;
}
```

::: info Pourquoi ?
Un `double` stocke le nombre en **binaire** (norme IEEE 754). 0,1 n'a pas d'écriture binaire finie, comme 1/3
n'a pas d'écriture décimale finie : il est arrondi. Ne compare jamais deux flottants avec `==` ; compare leur
**écart** à une petite tolérance. (Sous Linux, ajoute `-lm` à la compilation pour `fabs` et `math.h`.)
:::

::: quiz Quiz 1.5
Que vaut `moyenne` après `int somme = 29, n = 4; double moyenne = (double)(somme / n);` ?
- [ ] `7.25`
- [x] `7.0`
- [ ] `7`
- [ ] Erreur de compilation
> Les parenthèses forcent d'abord `somme / n` entre deux `int` : division entière, résultat `7`. Le cast arrive trop tard et convertit `7` en `7.0`. Pour obtenir `7.25`, il faut convertir **avant** la division : `(double)somme / n`.
:::

## 9. Dépassements et comportement indéfini

Un type a une plage finie. Que se passe-t-il quand on la dépasse ?

```c
#include <limits.h>
#include <stdio.h>

int main(void)
{
    unsigned int u = UINT_MAX;   // 4294967295
    u = u + 1;                   // repart à 0 : défini par la norme (arithmétique modulo 2^32)
    printf("u = %u\n", u);

    int s = INT_MAX;             // 2147483647
    // s = s + 1;                → DÉPASSEMENT SIGNÉ : comportement INDÉFINI
    printf("INT_MAX = %d, INT_MIN = %d\n", s, INT_MIN);
    return 0;
}
```

::: def Comportement indéfini (*undefined behavior*, UB)
Situation pour laquelle la norme C **n'impose rien** : le programme peut sembler marcher, afficher n'importe quoi,
planter… ou se comporter différemment une fois optimisé avec `-O2`. Exemples : variable non initialisée lue,
dépassement d'un entier **signé**, division par zéro, accès hors d'un tableau, double modification dans une expression.
:::

::: warn « Mais ça marche chez moi ! »
Un UB peut donner le « bon » résultat aujourd'hui et un faux demain (autre compilateur, autre option). Un programme
correct n'en contient **aucun**. Les avertissements (`-Wall -Wextra`) et, sous Linux, l'option
`-fsanitize=undefined` (module 10) aident à les débusquer.
:::

::: theorem Signé vs non signé
- Dépassement d'un entier **non signé** : défini, le calcul se fait **modulo** \( 2^n \) (il « fait le tour »).
- Dépassement d'un entier **signé** : **comportement indéfini**.
:::

::: quiz Quiz 1.6
Un `uint8_t` (0 à 255) vaut 250. On lui ajoute 10 et on range le résultat dans le même `uint8_t`. Que vaut-il ?
- [ ] 260
- [ ] 255 (il sature)
- [x] 4
- [ ] Comportement indéfini
> Les entiers **non signés** fonctionnent modulo \( 2^8 = 256 \) : 260 mod 256 = 4. Ils ne « saturent » pas au maximum. Ce n'est pas un UB, car le débordement non signé est parfaitement défini par la norme. C'est d'ailleurs un piège classique en traitement d'image : éclaircir un pixel trop fort le rend… presque noir.
:::

## 10. Exercices

::: exo Exercice 1.1 — Conversion de températures
Écris un programme qui convertit 37,5 °C en Fahrenheit (\( F = C \times 9/5 + 32 \)) et affiche le résultat avec
une décimale. **Piège** : que donne la formule écrite `c * (9 / 5) + 32` ? Explique.
?? Voir la solution
```c
#include <stdio.h>

int main(void)
{
    double c = 37.5;
    double f = c * 9.0 / 5.0 + 32.0;
    printf("%.1f C = %.1f F\n", c, f);      // 37.5 C = 99.5 F
    return 0;
}
```

Avec `c * (9 / 5) + 32`, les parenthèses forcent `9 / 5` entre deux **entiers** : division entière, résultat `1`.
On obtiendrait donc `37.5 * 1 + 32 = 69.5`, faux. Écrire `9.0 / 5.0` (ou laisser la multiplication par `c`, un
`double`, se faire en premier) donne bien la division réelle.
:::

::: exo Exercice 1.2 — Décomposer une durée
Une vidéo dure `int total = 7384;` secondes. Affiche-la au format `2 h 03 min 04 s` en utilisant **uniquement**
la division entière et le modulo. (Indice : `%02d` affiche un entier sur 2 chiffres avec un zéro devant.)
?? Voir la solution
```c
#include <stdio.h>

int main(void)
{
    int total = 7384;
    int heures   = total / 3600;           // 2
    int minutes  = (total % 3600) / 60;    // 184 / 60 = 3
    int secondes = total % 60;             // 4
    printf("%d h %02d min %02d s\n", heures, minutes, secondes);
    return 0;
}
```

C'est l'usage typique du couple `/` et `%` : `/` donne le nombre de « paquets complets », `%` ce qui reste.
On l'utilise aussi pour convertir un indice 1D en coordonnées 2D d'une image : `ligne = i / largeur`,
`colonne = i % largeur`.
:::

::: exo Exercice 1.3 — Explorer sa machine
Écris un programme qui affiche la taille en octets de `char`, `short`, `int`, `long`, `long long`, `float`,
`double` et `size_t`, ainsi que `INT_MAX` et `LLONG_MAX`. Compare avec un camarade sous Linux / macOS.
?? Voir la solution
```c
#include <limits.h>
#include <stdio.h>

int main(void)
{
    printf("char      : %zu\n", sizeof(char));
    printf("short     : %zu\n", sizeof(short));
    printf("int       : %zu\n", sizeof(int));
    printf("long      : %zu\n", sizeof(long));
    printf("long long : %zu\n", sizeof(long long));
    printf("float     : %zu\n", sizeof(float));
    printf("double    : %zu\n", sizeof(double));
    printf("size_t    : %zu\n", sizeof(size_t));
    printf("INT_MAX   : %d\n", INT_MAX);
    printf("LLONG_MAX : %lld\n", LLONG_MAX);
    return 0;
}
```

Sous Windows 64 bits (MSYS2) : `long` = **4**. Sous Linux / macOS 64 bits : `long` = **8**. Tout le reste est
identique (1, 2, 4, 8, 4, 8, 8). C'est la différence entre les modèles de données **LLP64** (Windows) et
**LP64** (Unix).
:::

::: exo Exercice 1.4 — Chasse aux bugs (sans compiler)
Trouve les **4** problèmes de ce programme, puis vérifie en le compilant avec `-Wall -Wextra`.

```c
#include <stdio.h>
#define REMISE 0.1;

int main(void)
{
    int prix = 080;
    int quantite;
    double total = prix * quantite * (1 - REMISE);
    if (total = 0) printf("Gratuit !\n");
    printf("%d\n", total);
    return 0;
}
```
?? Voir la solution
1. `#define REMISE 0.1;` : le `;` est collé dans l'expression → `(1 - 0.1;)` → erreur de syntaxe. Enlever le `;`.
2. `080` : nombre **octal** invalide (8 n'existe pas en base 8) → erreur. Écrire `80`.
3. `quantite` est **non initialisée** : sa valeur est indéterminée (UB). L'initialiser.
4. `if (total = 0)` est une **affectation** : il faut `==` (et pour un `double`, comparer plutôt une tolérance).
5. Bonus : `printf("%d\n", total)` affiche un `double` avec `%d` → format incorrect (UB) ; utiliser `%f`.

Les points 1 et 2 sont des **erreurs** qui bloquent la compilation ; une fois corrigés, `-Wall -Wextra` signale
les points 3, 4 et 5 par des **avertissements**.
:::

::: culture Culture & histoire — quand les entiers débordent pour de vrai
- **1972-1974** : le premier « hello, world » apparaît dans un tutoriel de **Brian Kernighan** pour le langage B,
  puis dans son mémo *Programming in C: A Tutorial* aux Bell Labs. Le livre K&R (1978) le rend célèbre.
- **1996, Ariane 5 (vol 501)** : 37 secondes après le décollage, la conversion d'un flottant 64 bits trop grand
  vers un entier 16 bits signé provoque une erreur dans le logiciel de guidage (écrit en Ada). La fusée est
  détruite. Le code avait été repris d'Ariane 4, plus lente, où la valeur ne dépassait jamais la plage.
- **2014, YouTube** : le compteur de vues de *Gangnam Style* approche \( 2^{31} - 1 \) = 2 147 483 647, la limite
  d'un entier 32 bits signé. YouTube passe le compteur en 64 bits.
- **19 janvier 2038, 03:14:07 UTC** : les systèmes qui stockent l'heure Unix (secondes depuis 1970) dans un entier
  32 bits signé déborderont. C'est le « bug de l'an 2038 », d'où la migration vers un `time_t` 64 bits.

- [cppreference : types arithmétiques du C](https://en.cppreference.com/w/c/language/arithmetic_types)
- [Rapport de la commission d'enquête Ariane 501 (ESA)](https://www.esa.int/Newsroom/Press_Releases/Ariane_501_-_Presentation_of_Inquiry_Board_report)
- [Problème de l'an 2038 (Wikipédia)](https://fr.wikipedia.org/wiki/Bug_de_l%27an_2038)
:::

## 11. Synthèse

::: goal À retenir absolument
- Compilation = **préprocesseur → compilateur → assembleur → éditeur de liens**. `undefined reference` = problème
  d'édition de liens (code de la fonction introuvable).
- **Initialise** toujours tes variables ; une variable vit dans son **bloc**.
- Tailles : `char` 1, `int` 4, `double` 8 ; `long` = 4 sous Windows, 8 sous Linux → `<stdint.h>` pour une taille garantie.
  `sizeof` s'affiche avec `%zu`.
- `int / int` = **division entière tronquée vers zéro** ; un seul `double` suffit pour une division réelle.
  `(double)a / b` ≠ `(double)(a / b)`.
- `=` affecte, `==` compare ; `&&` et `||` court-circuitent.
- Ne compare pas des flottants avec `==` ; attention au mélange **signé / non signé**.
- Débordement **non signé** = modulo (défini) ; **signé** = comportement **indéfini**.
:::

Prochaine étape : le **module 2**, pour dialoguer avec l'utilisateur : `printf` en détail, `scanf` et ses pièges,
et la lecture **sûre** d'une saisie.
