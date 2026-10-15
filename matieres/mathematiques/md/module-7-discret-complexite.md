---
title: Module 7 — Maths discrètes & Complexité
subtitle: Compter, dénombrer, et mesurer le coût des algorithmes. En Big Data, savoir si un algorithme passe à l'échelle (ou explose) est vital. La combinatoire et la notation Big-O sont vos boussoles.
domains: DATA, BIG DATA, IA
objectifs: Maîtriser le dénombrement (produit, somme, arrangements, combinaisons) ; connaître le binôme de Newton et le principe des tiroirs ; comprendre la notation Big-O et classer les complexités ; relier au passage à l'échelle.
---

## 1. Principes de dénombrement

::: def Les deux règles de base
- **Principe multiplicatif** : si une tâche se fait en \(k\) étapes avec \(n_1,\dots,n_k\) choix, le total est \(n_1\times\dots\times n_k\).
- **Principe additif** : choix exclusifs (soit… soit…) → on additionne.
:::

::: info Exemple
Un mot de passe de 4 caractères parmi 62 (a-z, A-Z, 0-9) : \(62^4 = 14\,776\,336\) possibilités (multiplicatif, avec répétition).
:::

::: quiz Quiz 1.1
Combien de codes PIN à 4 chiffres (0-9, répétition permise) existe-t-il ?
- [ ] 40
- [ ] 5040
- [x] 10 000
- [ ] 24
> 4 positions, 10 choix chacune, indépendantes : 10×10×10×10 = 10⁴ = 10 000 (principe multiplicatif).
:::

## 2. Arrangements & combinaisons

::: def Les formules clés
- **Factorielle** : \(n! = n(n-1)\cdots2\cdot1\), avec \(0!=1\). Nombre de permutations de \(n\) objets.
- **Arrangements** (ordre compte, sans répétition) : \(A_n^k = \dfrac{n!}{(n-k)!}\).
- **Combinaisons** (ordre ne compte pas) : \(\displaystyle\binom nk = C_n^k = \frac{n!}{k!(n-k)!}\).
:::

::: info « L'ordre compte-t-il ? » — la question à se poser
Podium (1er, 2e, 3e) → arrangement. Choisir un comité de 3 → combinaison. Mot de passe → arrangement (ou avec répétition). Main de cartes → combinaison.
:::

::: info Exemple
Tirer 5 cartes parmi 52 (ordre indifférent) : \(\binom{52}{5}=\frac{52!}{5!\,47!}=2\,598\,960\) mains possibles.
:::

::: quiz Quiz 2.1
Choisir une équipe de 3 personnes parmi 10 (sans rôle particulier). Combien de façons ?
- [ ] 720 (arrangement)
- [x] 120 (combinaison)
- [ ] 1000
- [ ] 30
> L'ordre n'importe pas → combinaison : C(10,3)=10!/(3!·7!)=120. Si les rôles comptaient (capitaine…), ce serait A(10,3)=720.
:::

::: quiz Quiz 2.2
Pour un podium (or, argent, bronze) parmi 8 athlètes, on compte…
- [x] des arrangements : A(8,3) = 336
- [ ] des combinaisons : C(8,3) = 56
- [ ] 8! = 40320
- [ ] 8×3 = 24
> Les positions sont distinctes (l'ordre compte) : A(8,3)=8!/5!=8×7×6=336.
:::

## 3. Binôme de Newton & triangle de Pascal

::: info Formule du binôme
\[ (a+b)^n = \sum_{k=0}^n \binom nk a^k b^{n-k} \] Les coefficients \(\binom nk\) sont ceux du **triangle de Pascal**, avec la relation \(\binom nk = \binom{n-1}{k-1} + \binom{n-1}{k}\).
:::

::: def Identités utiles
\(\displaystyle\sum_{k=0}^n \binom nk = 2^n\) (nombre total de sous-ensembles, Module 0 !). Symétrie : \(\binom nk = \binom{n}{n-k}\).
:::

::: quiz Quiz 3.1
Que vaut \(\sum_{k=0}^n \binom nk\) ?
- [ ] \(n!\)
- [ ] \(n^2\)
- [ ] \(n\)
- [x] \(2^n\)
> La somme des coefficients binomiaux = 2ⁿ (poser a=b=1 dans le binôme). C'est aussi le nombre de parties d'un ensemble à n éléments.
:::

## 4. Principe des tiroirs (pigeonhole)

::: info Énoncé
Si l'on range \(n\) objets dans \(k\) tiroirs avec \(n>k\), alors au moins un tiroir contient \(\ge 2\) objets. Plus fort : un tiroir contient au moins \(\lceil n/k\rceil\) objets.
:::

::: info BIG DATA Lien
Garantit l'existence de **collisions de hachage** : avec plus de clés que de cases, deux clés tombent forcément dans la même case (base du Module 9). Fondamental pour dimensionner les tables de hachage.
:::

::: quiz Quiz 4.1
On hache 1000 clés dans une table de 999 cases. Peut-on éviter toute collision ?
- [x] Non : par le principe des tiroirs, au moins 2 clés partagent une case
- [ ] Oui, avec une bonne fonction
- [ ] Oui, si les clés sont triées
- [ ] Cela dépend du langage
> 1000 objets, 999 tiroirs, 1000>999 : au moins une case reçoit ≥2 clés. Aucune fonction de hachage ne peut l'éviter. Les collisions sont inévitables dès que n>k.
:::

## 5. Complexité & notation Big-O ⭐

::: def Notation \(O\)
\(f(n)=O(g(n))\) signifie que \(f\) croît **au plus** comme \(g\) (à une constante près), pour \(n\) grand. On ignore constantes et termes négligeables : \(3n^2+5n+2 = O(n^2)\). C'est le comportement *asymptotique* qui compte.
:::

| Complexité | Nom | Exemple |
| --- | --- | --- |
| \(O(1)\) | constante | accès à un tableau, hash lookup |
| \(O(\log n)\) | logarithmique | recherche dichotomique |
| \(O(n)\) | linéaire | parcours simple |
| \(O(n\log n)\) | quasi-linéaire | tri fusion/rapide |
| \(O(n^2)\) | quadratique | double boucle, tri naïf |
| \(O(2^n)\) | exponentielle | force brute sur sous-ensembles |
| \(O(n!)\) | factorielle | toutes les permutations (voyageur de commerce brut) |

::: info Pourquoi c'est VITAL en Big Data
Sur \(n=10^9\) (un milliard) : un algo \(O(n)\) fait un milliard d'opérations (ok), mais \(O(n^2)\) en fait \(10^{18}\) (infaisable !). La différence entre \(O(n\log n)\) et \(O(n^2)\) décide si votre job tourne en minutes ou en siècles.
:::

::: quiz Quiz 5.1
Quelle est la complexité de la recherche dichotomique dans un tableau trié ?
- [ ] \(O(n)\)
- [ ] \(O(n^2)\)
- [x] \(O(\log n)\)
- [ ] \(O(1)\)
> À chaque étape on divise par 2 l'espace de recherche : O(log n). Sur un milliard d'éléments, ~30 comparaisons suffisent !
:::

::: quiz Quiz 5.2
\(3n^2 + 100n + 7\) est en \(O\) de…
- [ ] \(O(n)\)
- [x] \(O(n^2)\)
- [ ] \(O(n^3)\)
- [ ] \(O(100n)\)
> On garde le terme dominant et on ignore constantes/termes inférieurs : O(n²). Pour n grand, le n² écrase tout le reste.
:::

::: quiz Quiz 5.3
Deux boucles imbriquées sur n éléments donnent typiquement…
- [x] \(O(n^2)\)
- [ ] \(O(n)\)
- [ ] \(O(\log n)\)
- [ ] \(O(1)\)
> n itérations × n itérations = n² opérations : O(n²). À éviter sur de gros volumes ; on cherche souvent à descendre à O(n log n) ou O(n).
:::

## 6. Classes de complexité (culture)

- **P** : problèmes résolubles en temps polynomial (« faciles »).
- **NP** : solution vérifiable en temps polynomial.
- **NP-complet** : les plus durs de NP (SAT, voyageur de commerce, sac à dos). On ne sait pas les résoudre efficacement → on utilise des **heuristiques/approximations**.
- **P = NP ?** : la grande question ouverte (1 M$ à la clé).

::: info IA Lien
Beaucoup de problèmes d'optimisation réels sont NP-difficiles → l'IA/le ML fournissent des **approximations** rapides « assez bonnes » (routage, planification, clustering).
:::

::: quiz Quiz 6.1
Face à un problème NP-difficile sur de grandes instances, on utilise souvent…
- [ ] la force brute exacte
- [ ] rien, c'est impossible
- [x] des heuristiques / approximations
- [ ] un tri
> Sans algo exact efficace connu, on se tourne vers des heuristiques (gloutonnes, génétiques, recuit simulé, ML) donnant de bonnes solutions en temps raisonnable.
:::

## 7. Domaines, usages & métiers

| Notion | Domaine | Usage | Métiers |
| --- | --- | --- | --- |
| Combinatoire | DATA | Dénombrer cas, probas, feature engineering | Data Analyst, Scientist |
| Big-O | BIG DATA | Choisir des algos qui passent à l'échelle | Data/Software Engineer |
| Pigeonhole | BIG DATA | Collisions de hachage, dimensionnement | Data Engineer |
| NP-difficulté | IA | Recours aux heuristiques / ML | OR, ML Engineer |

::: info Pour approfondir
[Analyse combinatoire](https://fr.wikipedia.org/wiki/Analyse_combinatoire) [Notation Big-O](https://fr.wikipedia.org/wiki/Comparaison_asymptotique) [Big-O Cheat Sheet](https://www.bigocheatsheet.com/) [MIT 6.042](https://ocw.mit.edu/courses/6-042j-mathematics-for-computer-science-fall-2010/)
:::

## 8. Exercices de synthèse

::: exo Exercice 1 — Dénombrement
Combien de plaques d'immatriculation de la forme 2 lettres + 3 chiffres (A-Z, 0-9, répétition OK) ?
?? Voir la solution
\(26^2 \times 10^3 = 676 \times 1000 = 676\,000\) plaques.
:::

::: exo Exercice 2 — Combinaisons
Au Loto, on choisit 6 numéros parmi 49. Combien de grilles ?
?? Voir la solution
\(\binom{49}{6}=\frac{49!}{6!\,43!}=13\,983\,816\). (Probabilité de gagner ≈ 1 sur 14 millions.)
:::

::: exo Exercice 3 — Big-O (⭐)
Un algo fait, pour chaque élément, une recherche dichotomique dans le tableau. Complexité totale ?
?? Voir la solution
n éléments × O(log n) par recherche = **O(n log n)**. (C'est aussi la complexité d'un bon tri — logique, car trier puis chercher est une stratégie courante.)
:::

::: exo Exercice 4 — Pigeonhole (⭐⭐)
Montre que dans un groupe de 13 personnes, au moins deux sont nées le même mois.
?? Voir la solution
13 personnes (objets), 12 mois (tiroirs). Comme 13 > 12, le principe des tiroirs garantit qu'au moins un mois contient ≥ 2 personnes. ∎
:::

::: culture Culture & histoire
Un encart à l'écart du cours : d'où viennent ces idées, qui les a forgées, et pourquoi.
Compter, dénombrer, et surtout mesurer le **coût** d'un algorithme : voilà le cœur battant de l'informatique théorique — et l'un des plus grands mystères non résolus des mathématiques.

#### Les grands noms
- **Alan Turing** (1936) — la machine de Turing définit ce qui est *calculable*… et ce qui ne l'est pas.
- **Bachmann & Landau** (fin XIXᵉ) — la notation « grand O » (*O(n)*) pour décrire la croissance d'un coût.
- **Donald Knuth** (1938-) — père de l'analyse d'algorithmes (*The Art of Computer Programming*) et créateur de TeX.
- **Stephen Cook & Leonid Levin** (1971) — formulent le problème *P vs NP* et la NP-complétude.
- **Richard Karp** (1972) — exhibe 21 problèmes NP-complets, révélant leur universalité.

#### Le tournant décisif
« *P = NP ?* » est l'un des 7 **problèmes du millénaire** (1 million de dollars offert par l'Institut Clay). Une réponse positive casserait une grande partie de la cryptographie qui protège aujourd'hui tes mots de passe et tes paiements.

#### Pourquoi ça te concerne
Savoir qu'un problème est NP-difficile t'évite de chercher en vain une solution exacte : tu passes aux heuristiques et aux approximations. C'est du pur pragmatisme d'ingénieur.
- [Big-O Cheat Sheet](https://www.bigocheatsheet.com/)
- [P vs NP](https://fr.wikipedia.org/wiki/Probl%C3%A8me_P_%3D_NP)
- [NP-complétude](https://fr.wikipedia.org/wiki/Probl%C3%A8me_NP-complet)
- [Donald Knuth](https://fr.wikipedia.org/wiki/Donald_Knuth)
:::
