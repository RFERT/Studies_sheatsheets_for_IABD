---
title: Module 10 — Combinatoire avancée
subtitle: Le Module 7 posait les bases. Ici on va beaucoup plus loin : les quatre modèles de tirage, les permutations d'objets répétés, les étoiles & barres, le crible de Poincaré, les dérangements, les nombres de Catalan et de Stirling.
domains: DATA, BIG DATA, IA
objectifs: Choisir la bonne formule selon ordre et répétition ; maîtriser permutations, arrangements, combinaisons (avec ou sans répétition) ; appliquer binôme, multinôme et triangle de Pascal ; dénombrer par inclusion-exclusion ; connaître dérangements, nombres de Catalan et de Stirling ; relier chaque outil à un usage Data/IA concret.
---

## 1. Les 4 modèles de tirage

Presque tout problème de dénombrement revient à tirer \(k\) éléments parmi \(n\). Deux questions tranchent : **l'ordre compte-t-il ?** et **la répétition est-elle permise ?**

::: def Le tableau maître
| Modèle | Ordre | Répétition | Formule |
|---|---|---|---|
| Listes (k-uplets) | oui | oui | \(n^k\) |
| Arrangements \(A_n^k\) | oui | non | \(n!/(n-k)!\) |
| Combinaisons \(\binom{n}{k}\) | non | non | \(n!/(k!(n-k)!)\) |
| Multi-ensembles | non | oui | \(\binom{n+k-1}{k}\) |
:::

::: tip Réflexe
Avant toute formule, dis à voix haute : « ordre : oui/non, répétition : oui/non ». 90 % des erreurs viennent d'un mauvais classement.
:::

::: quiz Quiz 1.1
On distribue 3 médailles distinctes (or, argent, bronze) à 8 athlètes, un athlète ne pouvant en gagner qu'une. Quel modèle ?
- [ ] Combinaisons \(\binom{8}{3}\)
- [x] Arrangements \(A_8^3 = 8\cdot7\cdot6\)
- [ ] Listes \(8^3\)
- [ ] Étoiles & barres \(\binom{10}{3}\)
> L'ordre compte (or ≠ argent) et pas de répétition : arrangement. \(A_8^3 = 336\).
:::

## 2. Permutations & anagrammes

::: def Permutation
Une permutation de \(n\) objets distincts est un ordre total : il y en a \(n!\) (avec \(0!=1\)).
:::

::: def Permutations avec objets répétés
Pour \(n\) objets répartis en groupes de tailles \(n_1,\dots,n_m\) : \(\dfrac{n!}{n_1!\,n_2!\cdots n_m!}\). On divise par les permutations internes à chaque groupe.
:::

::: example Exemple — MISSISSIPPI
M(1), I(4), S(4), P(2) : \(\dfrac{11!}{1!\,4!\,4!\,2!} = 34\,650\).
:::

::: quiz Quiz 2.1
Combien d'anagrammes distincts du mot ANANAS ?
- [ ] 720
- [ ] 120
- [x] 60
- [ ] 30
> A(3), N(2), S(1) : \(6!/(3!\,2!) = 60\).
:::

## 3. Arrangements & combinaisons

::: def Formules clés
- Arrangement (ordre, sans répétition) : \(A_n^k = n!/(n-k)!\).
- Combinaison (sans ordre, sans répétition) : \(\binom{n}{k} = A_n^k/k! = n!/(k!(n-k)!)\).
:::

::: tip Lien fondamental
« Choisir puis ordonner » : \(A_n^k = \binom{n}{k}\times k!\).
:::

::: quiz Quiz 3.1
Au poker, une main = 5 cartes parmi 52 (ordre indifférent). Combien de mains ?
- [x] \(\binom{52}{5} = 2\,598\,960\)
- [ ] \(A_{52}^5\)
- [ ] \(52^5\)
- [ ] \(5!\times 52\)
> Sans ordre et sans répétition : combinaison \(\binom{52}{5}\). Un arrangement surcompterait d'un facteur \(5!\).
:::

## 4. Binôme, Pascal & identités

::: def Binôme de Newton
\[ (x+y)^n = \sum_{k=0}^{n} \binom{n}{k}\,x^k\,y^{\,n-k}. \]
:::

::: def Pascal & symétrie
\(\binom{n}{k} = \binom{n-1}{k-1} + \binom{n-1}{k}\) et \(\binom{n}{k}=\binom{n}{n-k}\).
:::

::: info Identités utiles
- \(\sum_k \binom{n}{k} = 2^n\) (sous-ensembles) ; \(\sum_k (-1)^k\binom{n}{k}=0\) pour \(n\ge1\).
- Vandermonde : \(\sum_k \binom{m}{k}\binom{n}{p-k} = \binom{m+n}{p}\).
:::

::: warn Piège fréquent
\(\sum_k\binom{n}{k}=2^n\) explique l'explosion de la **feature selection** exhaustive : \(2^n\) sous-ensembles. Pour \(n=40\), \(\approx 10^{12}\) modèles.
:::

::: quiz Quiz 4.1
Coefficient de \(x^2\) dans \((1+x)^5\) ?
- [ ] 5
- [ ] 25
- [ ] 32
- [x] 10
> \(\binom{5}{2}=10\). La ligne (1,5,10,10,5,1) somme à \(2^5=32\).
:::

## 5. Étoiles & barres

::: def Multi-ensembles
Choisir \(k\) parmi \(n\) types, avec répétition et sans ordre : \(\binom{n+k-1}{k} = \binom{n+k-1}{n-1}\).
:::

::: example Pourquoi « étoiles & barres »
Compter les solutions entières \(\ge 0\) de \(x_1+\dots+x_n=k\) : aligner \(k\) étoiles et \(n-1\) barres, choisir la place des barres → \(\binom{n+k-1}{n-1}\).
:::

::: tip Parts strictement positives
Pour \(x_i\ge1\), poser \(y_i=x_i-1\) → \(\binom{k-1}{n-1}\).
:::

::: quiz Quiz 5.1
10 bonbons identiques répartis entre 4 enfants (zéro permis). Combien de répartitions ?
- [ ] \(4^{10}\)
- [ ] \(\binom{10}{4}=210\)
- [x] \(\binom{13}{3}=286\)
- [ ] \(10!/4!\)
> Objets identiques, répétition : étoiles & barres. \(\binom{10+4-1}{4-1}=\binom{13}{3}=286\).
:::

## 6. Multinôme & surjections

::: def Coefficient multinomial
\[ (x_1+\dots+x_m)^n = \sum_{n_1+\dots+n_m=n} \frac{n!}{n_1!\cdots n_m!}\,x_1^{n_1}\cdots x_m^{n_m}. \]
:::

::: def Surjections
Nombre d'applications surjectives d'un \(n\)-ensemble vers un \(k\)-ensemble : \(\sum_{j=0}^{k}(-1)^j\binom{k}{j}(k-j)^n = k!\,S(n,k)\).
:::

::: quiz Quiz 6.1
5 tâches distinctes affectées à 3 serveurs distincts, chaque serveur recevant au moins une tâche. Quelle quantité ?
- [ ] \(3^5\)
- [x] le nombre de surjections de 5 vers 3
- [ ] \(\binom{5}{3}\)
- [ ] \(5!\)
> Surjection : \(3^5-\binom{3}{1}2^5+\binom{3}{2}1^5 = 243-96+3 = 150\).
:::

## 7. Inclusion-exclusion & dérangements

::: def Crible de Poincaré
\[ \Big|\bigcup_i A_i\Big| = \sum_i|A_i| - \sum_{i<j}|A_i\cap A_j| + \sum_{i<j<l}|A_i\cap A_j\cap A_l| - \dots \]
:::

::: def Dérangements
Permutations sans point fixe : \(D_n = n!\sum_{k=0}^n \frac{(-1)^k}{k!}\), et \(D_n/n! \to 1/e \approx 0{,}368\).
:::

::: example Problème des chapeaux
On rend \(n\) chapeaux au hasard : probabilité que personne ne retrouve le sien \(\approx 1/e\). Pour \(n=5\) : \(D_5=44\), soit \(44/120 \approx 36{,}7\,\%\).
:::

::: quiz Quiz 7.1
Pourquoi passer par l'inclusion-exclusion pour les dérangements ?
- [x] Il est plus simple de retirer les permutations ayant au moins un point fixe que de les éviter d'emblée
- [ ] Parce que \(D_n = n!-1\)
- [ ] Parce que les dérangements n'existent pas pour \(n\) pair
- [ ] Parce que l'ordre ne compte pas
> On modélise \(A_i\) = « \(i\) est fixe », le crible corrige les doubles comptages, puis on soustrait de \(n!\).
:::

## 8. Catalan, Stirling, Bell

::: def Nombres de Catalan
\(C_n = \frac{1}{n+1}\binom{2n}{n}\) : \(1,1,2,5,14,42,\dots\) Comptent parenthésages, arbres binaires, chemins de Dyck.
:::

::: def Stirling de 2ᵉ espèce
\(S(n,k)\) = partitions d'un \(n\)-ensemble en \(k\) blocs non vides (anonymes). \(S(n,k)=k\,S(n-1,k)+S(n-1,k-1)\). Lien : surjections \(= k!\,S(n,k)\).
:::

::: def Nombre de Bell
\(B_n = \sum_{k=0}^n S(n,k)\) : toutes les partitions d'un ensemble.
:::

::: tip Ne pas confondre
\(\binom{n}{k}\) = 2 catégories étiquetées ; \(S(n,k)\) = \(k\) blocs anonymes (×\(k!\) pour étiqueter).
:::

::: quiz Quiz 8.1
Combien de parenthésages valides de 3 paires de parenthèses ?
- [ ] 6
- [x] 5
- [ ] 8
- [ ] 3
> Catalan \(C_3 = \frac14\binom{6}{3} = 5\).
:::

## 9. Domaines, usages & métiers

| Notion | Domaine | Usage |
|---|---|---|
| Combinaisons | IA | Features d'interaction, n-grams, folds de CV |
| Somme \(2^n\) | DATA | Explosion de la feature selection exhaustive |
| Étoiles & barres | IA | Grilles d'hyperparamètres, allocation |
| Anniversaires | BIG DATA | Collisions de hash (\(\approx\sqrt N\)) |
| Multinomial | IA | Loi multinomiale, Naive Bayes, softmax |
| Catalan | DATA | Arbres binaires, parseurs |

## 10. Exercices de synthèse

::: exo Exercice 1 — Choisir le bon modèle
Un comité de 4 personnes parmi 12. (a) Combien de comités ? (b) Avec un président, un trésorier et deux membres simples ?
?? Voir la solution
(a) \(\binom{12}{4}=495\). (b) \(495\times(4\times3)=5\,940\) ; vérification \(A_{12}^2\times\binom{10}{2}=132\times45=5\,940\).
:::

::: exo Exercice 2 — Anagrammes contraints
Anagrammes de STATISTICS (10 lettres) ? Puis combien commencent par T ?
?? Voir la solution
S(3),T(3),A(1),I(2),C(1) : \(10!/(3!3!2!) = 50\,400\). Commençant par T : fixer un T, ordonner le reste \(9!/(3!2!2!) = 15\,120\).
:::

::: exo Exercice 3 — Étoiles & barres
Solutions entières de \(x_1+x_2+x_3+x_4=20\) avec tous les \(x_i\ge2\) ?
?? Voir la solution
Poser \(y_i=x_i-2\) : \(y_1+\dots+y_4=12\) → \(\binom{15}{3}=455\).
:::

::: exo Exercice 4 — Inclusion-exclusion
Entiers de 1 à 100 non divisibles par 2, 3 ni 5 ?
?? Voir la solution
Union \(=50+33+20-16-10-6+3=74\). Donc \(100-74=26\).
:::

::: exo Exercice 5 — Dérangements
4 lettres dans 4 enveloppes au hasard : probabilité qu'aucune n'arrive à la bonne adresse ?
?? Voir la solution
\(D_4=9\), probabilité \(9/24=0{,}375\) (≈ \(1/e\)).
:::

::: exo Exercice 6 — Débogage
« Mots de passe de 4 lettres distinctes parmi 26 » calculé par \(\binom{26}{4}=14\,950\). Erreur ? Bonne valeur ?
?? Voir la solution
Un mot de passe est ordonné : il faut \(A_{26}^4 = 358\,800 = \binom{26}{4}\times4!\). L'étudiant a oublié d'ordonner.
:::

::: culture Combinatoire : une très vieille science
La combinatoire est l'une des plus anciennes branches des mathématiques. **Pingala** (≈ IIIᵉ s. av. J.-C.) décrit déjà le triangle de Pascal. La correspondance **Pascal–Fermat** (1654) fonde les probabilités via la combinatoire. **Newton** généralise le binôme ; **Montmort** (1708) pose le problème des dérangements ; **Euler** étudie partitions et fonctions génératrices ; **Catalan** (1838) donne ses célèbres nombres. À chaque `itertools.combinations` ou dimensionnement de table de hachage, tu fais de la combinatoire.
Liens : [Triangle de Pascal](https://fr.wikipedia.org/wiki/Triangle_de_Pascal) · [Problème des rencontres](https://fr.wikipedia.org/wiki/Probl%C3%A8me_des_rencontres) · [OEIS](https://oeis.org/)
:::
