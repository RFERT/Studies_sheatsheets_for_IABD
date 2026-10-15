---
title: Module 0 — Python avancé & idiomatique
subtitle: Le Python qu'on attend d'un professionnel : écrire un code *pythonique*, lisible, efficace et robuste. On suppose que tu connais déjà la syntaxe de base ; ici on muscle les idiomes qui font la différence en data et en entretien.
domains: DATA, BIG DATA, IA
objectifs: Maîtriser les compréhensions et générateurs ; comprendre itérateurs et `lazy evaluation` ; écrire décorateurs et context managers ; annoter avec `typing` ; structurer avec dataclasses et méthodes spéciales ; exploiter `functools`/`itertools` ; gérer les erreurs proprement ; utiliser la syntaxe moderne (f-strings, walrus, `match`).
---

## 1. Entrées / sorties & scripts

La fonction `input()` lit une ligne au clavier et renvoie **toujours une chaîne** (`str`). À toi de convertir.

```python
nom = input("Ton prénom : ")        # renvoie str
age = int(input("Ton âge : "))     # conversion explicite
prix = float(input("Prix : "))

# Plusieurs nombres sur une ligne : "3 5 8"
nums = [int(x) for x in input().split()]
```

::: info Piège classique
`int(input())` lève `ValueError` si l'utilisateur tape autre chose qu'un entier. En production, on encadre avec `try/except` (voir §10).
:::

### Sortie : print & f-strings

```python
print("a", "b", sep="-", end="!\n")   # a-b!
print(f"{nom} a {age} ans")            # f-string (le plus lisible)
import sys; print("erreur", file=sys.stderr)  # vers stderr
```

### Script exécutable & arguments

```python
import sys

def main():
    print("Arguments :", sys.argv[1:])  # python prog.py a b -> ['a','b']

if __name__ == "__main__":        # ne s'exécute QUE si lancé directement
    main()
```

::: info Lien Data
Pour de vrais outils en ligne de commande, on utilise `argparse` (standard) ou `click`/`typer`. Le garde `if __name__ == "__main__"` permet d'*importer* un script sans déclencher son exécution — essentiel pour les tests.
:::

::: quiz Quiz 1.1
Que renvoie `input()` quand l'utilisateur tape `42` ?
- [ ] L'entier `42`
- [x] La chaîne `"42"`
- [ ] Un `float` `42.0`
- [ ] Une liste `['4','2']`
> <code>input()</code> renvoie toujours une <code>str</code>. Pour obtenir un nombre, il faut convertir : <code>int(input())</code> ou <code>float(input())</code>.
:::

## 2. Compréhensions (list / dict / set)

Une compréhension remplace une boucle `+ append` par une expression concise et plus rapide.

```python
# Liste
carres = [x**2 for x in range(10)]
pairs  = [x for x in range(20) if x % 2 == 0]   # filtre
grille = [(i, j) for i in range(3) for j in range(3)]  # double boucle

# Dict & set
carte = {mot: len(mot) for mot in ["a", "bb", "ccc"]}
uniques = {x % 5 for x in range(20)}
```

::: info if … else dans une compréhension
```
signe = ["+" if x > 0 else "-" for x in nums]  # ternaire AVANT le for
pos   = [x for x in nums if x > 0]            # filtre APRÈS le for
```
:::

::: info Lisibilité
Une compréhension sur 3 niveaux devient illisible. Au-delà de 2 `for` ou d'une logique complexe, repasse à une boucle classique ou un générateur.
:::

::: quiz Quiz 2.1
Quelle expression garde uniquement les mots de plus de 3 lettres ?
- [ ] `[m if len(m) > 3 for m in mots]`
- [ ] `[m for m in mots if len(m) > 3 else None]`
- [x] `[m for m in mots if len(m) > 3]`
- [ ] `[for m in mots: len(m) > 3]`
> Le <strong>filtre</strong> se place après le <code>for</code> avec un simple <code>if</code> (sans <code>else</code>). Un <code>if/else</code> ne sert qu'à transformer la valeur et se met <em>avant</em> le <code>for</code>.
:::

## 3. Générateurs & itérateurs ⭐

Un **générateur** produit ses valeurs *à la demande* (lazy) au lieu de tout stocker en mémoire : idéal pour les gros volumes de données.

```python
def compte(n):
    i = 0
    while i < n:
        yield i          # "pause" et renvoie, reprend ensuite
        i += 1

for x in compte(3):
    print(x)             # 0, 1, 2
```

::: info Pourquoi c'est crucial en Data
Lire un fichier de 50 Go ligne par ligne, streamer des batches vers un modèle, enchaîner des transformations sans copier : le générateur garde une empreinte mémoire **constante**.
:::

### Expression génératrice (parenthèses)

```python
somme = sum(x**2 for x in range(1000000))  # aucune liste créée
```

### Le protocole d'itération

Un objet est *itérable* s'il implémente `__iter__` ; un *itérateur* implémente `__next__` et lève `StopIteration` à la fin. `for` fait tout ça pour toi.

```python
it = iter([10, 20])
next(it)   # 10
next(it)   # 20
next(it)   # lève StopIteration
```

- **Générateur** = fonction avec `yield` ; s'épuise après un parcours (on ne peut pas le relire).
- **Lazy** : rien n'est calculé tant qu'on ne consomme pas.
- `sum`, `any`, `all`, `max`, `min` consomment directement un générateur.

::: quiz Quiz 3.1
Principal avantage d'un générateur sur une liste pour traiter 10 millions de lignes ?
- [x] Mémoire quasi constante (valeurs produites à la demande)
- [ ] Il trie automatiquement les données
- [ ] Il est toujours plus précis
- [ ] Il peut être parcouru une infinité de fois
> Le générateur ne garde pas tout en mémoire : il produit chaque valeur à la demande. Revers : il s'épuise après un seul parcours.
:::

## 4. Fonctions : *args, **kwargs, closures, lambda

```python
def f(a, b=10, *args, **kwargs):
    # a : positionnel · b : défaut · args : tuple · kwargs : dict
    print(a, b, args, kwargs)

f(1, 2, 3, 4, x=5)   # 1 2 (3, 4) {'x': 5}

# Déballage (unpacking)
args = [1, 2]; kw = {"x": 9}
f(*args, **kw)
```

::: info Piège n°1 des entretiens : argument par défaut mutable
```
def ajoute(x, liste=[]):   # ❌ la liste est partagée entre appels !
    liste.append(x); return liste
ajoute(1); ajoute(2)        # [1, 2] au lieu de [2]
```
:::

### Closures (fonctions qui capturent leur environnement)

```python
def multiplieur(k):
    def interne(x):
        return x * k      # capture k
    return interne

double = multiplieur(2); double(5)   # 10
```

### lambda (fonction anonyme, 1 expression)

```python
paires = sorted(mots, key=lambda m: len(m))  # tri par longueur
max(points, key=lambda p: p[1])            # max selon la 2e coord
```

## 5. Décorateurs ⭐

Un décorateur **enveloppe** une fonction pour en modifier le comportement sans toucher son code : logging, cache, timing, authentification, retry…

```python
import functools, time

def chrono(fn):
    @functools.wraps(fn)          # garde nom/doc de fn
    def wrapper(*args, **kwargs):
        t0 = time.perf_counter()
        r = fn(*args, **kwargs)
        print(f"{fn.__name__} : {time.perf_counter()-t0:.4f}s")
        return r
    return wrapper

@chrono                          # sucre pour : lent = chrono(lent)
def lent():
    return sum(range(1000000))
```

::: info En vrai
`@functools.lru_cache` mémorise les résultats (mémoïsation) ; Flask/FastAPI utilisent `@app.route` ; pytest `@pytest.fixture` ; les décorateurs sont partout.
:::

### Décorateur paramétré

```python
def repete(n):
    def deco(fn):
        @functools.wraps(fn)
        def w(*a, **k):
            for _ in range(n): r = fn(*a, **k)
            return r
        return w
    return deco

@repete(3)
def hello(): print("hi")
```

::: quiz Quiz 5.1
À quoi sert `@functools.wraps(fn)` dans un décorateur ?
- [ ] À exécuter la fonction deux fois
- [ ] À mettre le résultat en cache
- [x] À préserver le nom, la docstring et les métadonnées de la fonction d'origine
- [ ] À rendre la fonction asynchrone
> Sans <code>wraps</code>, la fonction décorée prend le nom <code>wrapper</code> et perd sa docstring, ce qui casse l'introspection et la doc. <code>wraps</code> recopie ces métadonnées.
:::

## 6. Context managers (`with`)

Le `with` garantit qu'une ressource est **libérée** (fichier fermé, verrou relâché) même en cas d'erreur.

```python
with open("data.csv", encoding="utf-8") as f:
    contenu = f.read()
# fichier garanti fermé ici, même si read() plante
```

### Créer le sien avec `@contextmanager`

```python
from contextlib import contextmanager

@contextmanager
def timer(label):
    import time; t0 = time.perf_counter()
    try:
        yield                         # le bloc with s'exécute ici
    finally:
        print(f"{label}: {time.perf_counter()-t0:.3f}s")

with timer("calcul"):
    sum(range(1000000))
```

::: info Plusieurs ressources
`with open("a") as a, open("b") as b:` — les deux sont fermées proprement.
:::

## 7. Typing & annotations

Les annotations de type ne changent **rien à l'exécution** (Python reste dynamique) mais documentent le code et permettent à `mypy`/l'IDE de détecter des bugs avant l'exécution.

```python
def moyenne(xs: list[float]) -> float:
    return sum(xs) / len(xs)

from typing import Optional, Union, Callable, Any

age: Optional[int] = None        # int ou None (= int | None)
id_: int | str = "a1"              # union moderne (3.10+)
transfo: Callable[[int], str] = str  # fonction int -> str
```

::: info Lien Data
Dans les gros projets ML, le typing + `mypy` attrape les erreurs de forme (un `DataFrame` passé où on attend un `ndarray`) avant qu'elles ne coûtent des heures de debug.
:::

::: quiz Quiz 7.1
Les annotations de type en Python…
- [ ] empêchent l'exécution si le type est faux
- [x] sont indicatives : vérifiées par des outils (mypy, IDE), pas à l'exécution
- [ ] accélèrent le programme
- [ ] sont obligatoires depuis Python 3
> Python reste dynamiquement typé : les annotations sont ignorées à l'exécution. Elles servent à la documentation et aux vérificateurs statiques comme mypy.
:::

## 8. Dataclasses & méthodes spéciales

Une `dataclass` génère automatiquement `__init__`, `__repr__`, `__eq__`… pour les objets « porteurs de données ».

```python
from dataclasses import dataclass, field

@dataclass
class Point:
    x: float
    y: float = 0.0
    tags: list[str] = field(default_factory=list)  # défaut mutable sûr

    def norme(self) -> float:
        return (self.x**2 + self.y**2) ** 0.5

p = Point(3, 4)
print(p)              # Point(x=3, y=4, tags=[])
print(p == Point(3, 4))  # True (égalité par valeur)
```

### Méthodes spéciales (dunder) utiles

| Méthode | Déclenchée par |
| --- | --- |
| `__init__` | Construction `C(...)` |
| `__repr__` / `__str__` | `repr(x)` / `print(x)` |
| `__len__` | `len(x)` |
| `__getitem__` | `x[i]` |
| `__eq__`, `__lt__` | `==`, `<` (tri) |
| `__call__` | `x()` |
| `__enter__`/`__exit__` | `with x:` |

::: info Défaut mutable
Dans une dataclass, un défaut `list`/`dict` doit passer par `field(default_factory=list)`, jamais `= []` (même piège qu'au §4).
:::

## 9. functools & itertools (la boîte à outils)

### functools

| Outil | Rôle |
| --- | --- |
| `@lru_cache` / `@cache` | Mémoïse les résultats (ex. récursion coûteuse) |
| `reduce(f, it, init)` | Réduction (accumulation) |
| `partial(f, a)` | Fige des arguments d'une fonction |

```python
from functools import lru_cache, reduce, partial

@lru_cache(maxsize=None)
def fib(n): return n if n < 2 else fib(n-1) + fib(n-2)

total = reduce(lambda a, b: a*b, [1,2,3,4])   # 24
inc = partial(pow, 2)                           # 2**x
```

### itertools

| Outil | Rôle |
| --- | --- |
| `chain(a, b)` | Enchaîne des itérables |
| `product(a, b)` | Produit cartésien |
| `combinations(it, k)` | Combinaisons sans ordre |
| `permutations(it, k)` | Arrangements |
| `groupby(it, key)` | Regroupe des éléments consécutifs |
| `accumulate(it)` | Sommes cumulées |
| `count`, `cycle`, `repeat` | Itérateurs infinis |

```python
from itertools import combinations, accumulate
list(combinations(["a","b","c"], 2))   # [('a','b'),('a','c'),('b','c')]
list(accumulate([1,2,3,4]))        # [1, 3, 6, 10]
```

## 10. Erreurs & robustesse

```python
try:
    n = int(input("Nombre : "))
except ValueError:
    print("Pas un entier")
except (KeyboardInterrupt, EOFError):
    print("Interrompu")
else:
    print("OK :", n)       # si aucune exception
finally:
    print("Toujours exécuté")   # nettoyage
```

- **Sois spécifique** : attrape `ValueError`, pas `except:` nu (qui masque tout, même `Ctrl-C`).
- **EAFP** (« demander pardon plutôt que la permission ») : essaie et gère l'erreur, plutôt que de tout vérifier avant — c'est le style pythonique.
- Lève tes propres erreurs : `raise ValueError("message clair")`.
- Crée des exceptions métier : `class DataError(Exception): ...`.

::: info Anti-pattern
`except Exception: pass` avale silencieusement les bugs. Au minimum, journalise (`logging`) ce qui se passe.
:::

::: quiz Quiz 10.1
Quel bloc s'exécute *toujours*, qu'il y ait eu une exception ou non ?
- [ ] `except`
- [ ] `else`
- [ ] `try`
- [x] `finally`
> <code>finally</code> s'exécute systématiquement (nettoyage). <code>else</code> ne tourne que si aucune exception n'a été levée ; <code>except</code> uniquement en cas d'erreur correspondante.
:::

## 11. Syntaxe moderne (3.8 → 3.12)

### f-strings avancées

```python
x = 3.14159
print(f"{x:.2f}")      # 3.14
print(f"{x=}")         # x=3.14159 (debug, 3.8+)
print(f"{1000000:_}")   # 1_000_000 (séparateur)
print(f"{0.25:.0%}")    # 25%
```

### Walrus `:=` (assignation dans une expression)

```python
while (ligne := input()) != "stop":
    print(ligne)
# évite d'appeler input() deux fois
```

### Structural pattern matching (`match`, 3.10+)

```python
def decrire(p):
    match p:
        case (0, 0):            return "origine"
        case (x, 0):            return f"sur l'axe X à {x}"
        case (x, y) if x == y:  return "diagonale"
        case _:                 return "ailleurs"
```

::: info Autres idiomes utiles
`a, *reste = [1,2,3,4]` (unpacking étendu) · `d1 | d2` (fusion de dicts, 3.9+) · `zip(a, b, strict=True)` (3.10+) · `enumerate(xs, start=1)`.
:::

## 12. Exercices de synthèse

::: exo Exercice 1 — Compréhension
Écris en une ligne la liste des carrés des nombres impairs de 1 à 20.
?? Voir la solution
```python
[x**2 for x in range(1, 21) if x % 2 == 1]
```
:::

::: exo Exercice 2 — Générateur
Écris un générateur `fibonacci()` infini qui produit 0, 1, 1, 2, 3, 5, …
?? Voir la solution
```python
def fibonacci():
    a, b = 0, 1
    while True:
        yield a
        a, b = b, a + b

from itertools import islice
list(islice(fibonacci(), 7))   # [0, 1, 1, 2, 3, 5, 8]
```
:::

::: exo Exercice 3 — Décorateur de cache
Sans `functools`, écris un décorateur `memoize` qui met en cache les résultats selon les arguments.
?? Voir la solution
```python
def memoize(fn):
    cache = {}
    def w(*args):
        if args not in cache:
            cache[args] = fn(*args)
        return cache[args]
    return w
```

Astuce : les `args` (un tuple) servent de clé car ils sont hachables. Attention si des arguments sont des listes (non hachables).
:::

::: exo Exercice 4 — Comptage (⭐)
Compte la fréquence de chaque mot d'une phrase, sans `collections.Counter`, puis avec.
?? Voir la solution
```python
# Manuel
freq = {}
for m in phrase.split():
    freq[m] = freq.get(m, 0) + 1

# Pythonique
from collections import Counter
freq = Counter(phrase.split())
freq.most_common(3)   # top 3
```
:::

::: culture Culture & histoire
Un encart à l'écart du cours : d'où vient Python et pourquoi il a conquis la data.
Python est né à Noël 1989 : **Guido van Rossum**, aux Pays-Bas, cherche un projet pour occuper les vacances et crée un langage lisible, successeur du langage ABC. Le nom ? Un hommage aux *Monty Python*, pas au serpent.

#### Les grands noms & repères
- **Guido van Rossum** (1991) — créateur de Python ; « BDFL » (dictateur bienveillant à vie) jusqu'en 2018.
- **Le Zen de Python** (Tim Peters, 1999) — `import this` : « Beautiful is better than ugly », « Readability counts »…
- **NumPy** (Travis Oliphant, 2006) — unifie le calcul numérique ; socle de tout l'écosystème.
- **pandas** (Wes McKinney, 2008) — né dans un fonds d'investissement pour manipuler des séries financières.
- **Python 3** (2008) — rupture volontaire (print(), Unicode) ; migration achevée ~2020 (fin de Python 2).

#### Pourquoi Python a gagné la data
Lisibilité + un écosystème scientifique exceptionnel (NumPy, pandas, scikit-learn, PyTorch, TensorFlow). Le langage sert de « colle » : le code critique tourne en C/Fortran optimisé, tandis que tu écris une logique claire et rapide à prototyper. Résultat : Python est devenu la *lingua franca* de la data science et de l'IA.
- [Python (Wikipédia)](https://fr.wikipedia.org/wiki/Python_(langage))
- [Le Zen de Python (PEP 20)](https://peps.python.org/pep-0020/)
- [PEP 8 — style](https://peps.python.org/pep-0008/)
- [Doc officielle (FR)](https://docs.python.org/fr/3/)
:::
