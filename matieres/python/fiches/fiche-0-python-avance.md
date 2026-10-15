# 🐍 Fiche de révision — Module 0 : Python avancé & idiomatique

## Entrées / sorties
- `input()` renvoie **toujours** un `str` → convertir : `int(input())`, `float(input())`.
- Plusieurs valeurs : `[int(x) for x in input().split()]`.
- `print(a, b, sep="-", end="\n")` ; f-string : `f"{nom} a {age} ans"`.
- `if __name__ == "__main__":` → n'exécute que si lancé directement (pas à l'import).

## Compréhensions
```python
[x**2 for x in range(10)]            # liste
[x for x in xs if x > 0]             # filtre (if APRÈS le for)
["+" if x > 0 else "-" for x in xs]  # transformation (if/else AVANT le for)
{m: len(m) for m in mots}            # dict
(x for x in xs)                      # générateur (lazy)
```

## Générateurs & itérateurs
- Fonction avec `yield` = générateur **lazy** (valeurs à la demande, mémoire constante).
- S'épuise après un parcours. `sum`, `any`, `all`, `max` consomment directement.
- `next(it)` avance ; `StopIteration` à la fin.

## Fonctions
- `def f(a, b=10, *args, **kwargs)` ; déballage `f(*args, **kwargs)`.
- ⚠️ **Défaut mutable** : `def f(x, lst=[])` partage la liste → utiliser `lst=None; lst = lst or []`.
- Closure : fonction interne capturant une variable de l'englobante.
- `lambda` : fonction anonyme 1 expression → `sorted(xs, key=lambda m: len(m))`.

## Décorateurs
```python
import functools
def deco(fn):
    @functools.wraps(fn)        # garde nom + docstring
    def w(*a, **k):
        return fn(*a, **k)
    return w
```
- `@functools.lru_cache` = mémoïsation. `@app.route`, `@pytest.fixture`…

## Context managers
- `with open(...) as f:` garantit la fermeture, même en cas d'erreur.
- Créer : `@contextmanager` + `try: yield ... finally:`.

## Typing
- Annotations **indicatives** (ignorées à l'exécution), vérifiées par mypy/IDE.
- `list[float]`, `Optional[int]` (= `int | None`), `Callable[[int], str]`.

## Dataclasses & dunder
- `@dataclass` génère `__init__`, `__repr__`, `__eq__`.
- Défaut mutable → `field(default_factory=list)`.
- Dunder : `__len__` (`len`), `__getitem__` (`x[i]`), `__call__` (`x()`), `__eq__`/`__lt__`.

## functools & itertools
- `reduce`, `partial`, `lru_cache` · `combinations`, `product`, `groupby`, `accumulate`, `chain`.

## Erreurs
```python
try: ...
except ValueError as e: ...
else: ...      # si aucune exception
finally: ...   # toujours
```
- Sois **spécifique** (pas `except:` nu). Style **EAFP**. `raise ValueError("...")`.

## Syntaxe moderne
- f-strings : `{x:.2f}`, `{x=}`, `{1000000:_}`, `{0.25:.0%}`.
- Walrus `:=` : `while (l := input()) != "stop":`.
- `match`/`case` (3.10+) ; `a, *reste = xs` ; `d1 | d2` (3.9+).

*Liens : [Zen de Python](https://peps.python.org/pep-0020/) · [PEP 8](https://peps.python.org/pep-0008/) · [Doc FR](https://docs.python.org/fr/3/)*
