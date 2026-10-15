---
title: Module 6 — Théorie des graphes
subtitle: Modéliser des réseaux : relations, connexions, flux. Des réseaux sociaux au web, des systèmes de recommandation aux Knowledge Graphs, le graphe est LA structure de la donnée connectée.
domains: DATA, BIG DATA, IA
objectifs: Connaître le vocabulaire des graphes ; représenter un graphe (matrice/liste) ; parcourir (BFS/DFS) ; calculer plus courts chemins ; comprendre centralité et PageRank ; relier aux applications Data.
---

## 1. Vocabulaire

::: def Définitions
- **Orienté** (arcs \(x\to y\)) vs **non orienté** (arêtes \(x\!-\!y\)).
- **Pondéré** : chaque arête a un poids (distance, coût, force).
- **Degré** d'un sommet : nombre d'arêtes incidentes (en orienté : degré entrant/sortant).
- **Chemin** : suite d'arêtes ; **cycle** : chemin qui revient au départ.
- **Connexe** : il existe un chemin entre toute paire de sommets.
:::

::: info DATA Lien
Réseau social : sommets = personnes, arêtes = amitiés (non orienté) ou « follow » (orienté). Web : pages + hyperliens. Un **graphe de connaissances** (Knowledge Graph) relie des entités.
:::

::: quiz Quiz 1.1
Sur Twitter/X, « A suit B » (mais pas forcément l'inverse) se modélise par un graphe…
- [ ] non orienté
- [x] orienté
- [ ] sans arêtes
- [ ] complet
> « Suivre » est asymétrique : A→B n'implique pas B→A. C'est un graphe orienté (arcs). L'amitié Facebook, elle, est non orientée.
:::

## 2. Représentations

| Représentation | Idée | Mémoire | Bon pour |
| --- | --- | --- | --- |
| **Matrice d'adjacence** | \(A_{ij}=1\) si arête \(i\!\to\!j\) | \(O(V^2)\) | graphes denses, calculs matriciels |
| **Liste d'adjacence** | pour chaque sommet, ses voisins | \(O(V+E)\) | graphes creux (réels) |

::: info Astuce matricielle
Si \(A\) est la matrice d'adjacence, alors \((A^k)_{ij}\) = nombre de chemins de longueur exactement \(k\) de \(i\) à \(j\). (Lien direct avec le Module 2 et la composition de relations du Module 1 !)
:::

::: quiz Quiz 2.1
Pour un réseau social réel (très creux, peu de connexions par personne), on préfère…
- [ ] la matrice d'adjacence (O(V²))
- [ ] ne rien stocker
- [x] la liste d'adjacence (O(V+E))
- [ ] un tableau 1D
> Un graphe creux a E ≪ V². La liste d'adjacence (O(V+E)) économise énormément de mémoire vs la matrice (O(V²)) pleine de zéros.
:::

## 3. Parcours : BFS & DFS

::: def Deux stratégies
- **BFS** (largeur, file/queue) : explore par « cercles » concentriques. Trouve le plus court chemin en nombre d'arêtes. Complexité \(O(V+E)\).
- **DFS** (profondeur, pile/stack ou récursion) : plonge aussi loin que possible avant de reculer. Utile pour cycles, composantes, tri topologique. \(O(V+E)\).
:::

::: info DATA IA Lien
BFS : « amis à distance 2 », recommandations de proximité, crawling web par niveaux. DFS : détection de cycles (dépendances), ordonnancement (DAG du Module 1), exploration.
:::

::: quiz Quiz 3.1
Pour trouver le plus court chemin en nombre d'arêtes (graphe non pondéré), on utilise…
- [x] BFS (parcours en largeur)
- [ ] DFS (parcours en profondeur)
- [ ] un tri
- [ ] PageRank
> BFS explore par distances croissantes : le premier moment où l'on atteint un sommet correspond au plus court chemin en nombre d'arêtes.
:::

::: quiz Quiz 3.2
Quelle structure de données est au cœur de BFS ?
- [ ] une pile (LIFO)
- [ ] un arbre binaire
- [ ] une table de hachage
- [x] une file (FIFO)
> BFS utilise une FILE (FIFO) pour traiter les sommets dans l'ordre de découverte. DFS utilise une PILE (LIFO) ou la récursion.
:::

## 4. Plus courts chemins (pondérés)

| Algorithme | Résout | Contrainte |
| --- | --- | --- |
| **Dijkstra** | plus court chemin depuis une source | poids ≥ 0 |
| **Bellman-Ford** | idem, gère poids négatifs | plus lent |
| **Floyd-Warshall** | tous les couples | \(O(V^3)\) |
| **A*** | plus court chemin avec heuristique | jeux, GPS |

::: info DATA Lien
GPS/itinéraires (Dijkstra/A*), routage réseau, logistique, détection d'arbitrage financier (Bellman-Ford avec poids = −log(taux)).
:::

::: quiz Quiz 4.1
Pour un GPS avec des distances toutes positives, l'algorithme classique est…
- [ ] BFS
- [x] Dijkstra
- [ ] tri topologique
- [ ] PageRank
> Dijkstra calcule le plus court chemin pondéré avec des poids ≥ 0 (distances/temps). A* l'améliore avec une heuristique (distance à vol d'oiseau).
:::

## 5. Centralité & PageRank ⭐

::: def Mesures de centralité (qui est « important » ?)
- **Degré** : nombre de connexions (populaire).
- **Intermédiarité** (betweenness) : fréquence d'apparition sur les plus courts chemins (pont).
- **Proximité** (closeness) : proche de tous les autres.
- **PageRank** : importance récursive (être pointé par des pages importantes).
:::

::: info PageRank — l'idée de Google
Une page est importante si des pages importantes pointent vers elle. Mathématiquement, le vecteur PageRank \(\mathbf r\) vérifie \(\mathbf r = M\mathbf r\) : c'est le **vecteur propre dominant** (valeur propre 1) de la matrice de transition \(M\) (lien Module 2 !). On le calcule en itérant \(\mathbf r \leftarrow M\mathbf r\) (power iteration).
:::

::: info BIG DATA IA Lien
PageRank (recherche web, à l'échelle de milliards de pages, calculé via MapReduce). Centralité : détection d'influenceurs, de comptes frauduleux, de nœuds critiques. **GNN** (Graph Neural Networks) : deep learning sur graphes (reco, molécules, fraude).
:::

::: quiz Quiz 5.1
Mathématiquement, le vecteur PageRank est…
- [ ] la moyenne des degrés
- [ ] le plus court chemin
- [x] le vecteur propre dominant de la matrice de transition
- [ ] un tri des pages
> PageRank résout r=Mr : c'est le vecteur propre associé à la valeur propre 1, calculé par itérations successives (power iteration). D'où le lien fort avec l'algèbre linéaire.
:::

::: quiz Quiz 5.2
Un sommet à forte « intermédiarité » (betweenness) est…
- [x] un pont par lequel passent beaucoup de plus courts chemins
- [ ] celui qui a le plus d'amis
- [ ] toujours isolé
- [ ] sans importance
> La betweenness mesure combien de plus courts chemins passent par un sommet. Fort = rôle de pont/goulot (couper ce nœud fragmente le réseau).
:::

## 6. Graphes particuliers

- **Arbre** : graphe connexe sans cycle (\(V-1\) arêtes). Base des hiérarchies, index, arbres de décision.
- **DAG** : orienté sans cycle = ordre partiel (Module 1). Pipelines, dépendances.
- **Graphe biparti** : deux groupes, arêtes seulement entre groupes (utilisateurs↔produits). Base de la reco.
- **Graphe complet** \(K_n\) : toutes les paires reliées (\(\binom n2\) arêtes).

::: quiz Quiz 6.1
Un graphe « utilisateurs ↔ produits » (achats) est un bon exemple de graphe…
- [ ] complet
- [x] biparti
- [ ] arbre
- [ ] cyclique
> Deux types de sommets (users, produits) avec arêtes uniquement entre les deux groupes = graphe biparti. C'est la structure des systèmes de recommandation.
:::

## 7. Domaines, usages & métiers

| Notion | Domaine | Usage | Métiers |
| --- | --- | --- | --- |
| BFS/DFS | DATA | Exploration, cycles, recommandation proche | Data Engineer, Dev |
| Plus courts chemins | DATA | GPS, routage, logistique | OR / Optimisation, Dev |
| PageRank/Centralité | BIG DATA | Ranking web, influence, fraude | Data Scientist, Analyst |
| Graphe biparti | IA | Systèmes de recommandation | ML Engineer |
| GNN | IA | Deep learning sur graphes | Research / ML Eng. |

::: info Pour approfondir
[Théorie des graphes](https://fr.wikipedia.org/wiki/Th%C3%A9orie_des_graphes) [PageRank](https://fr.wikipedia.org/wiki/PageRank) [Dijkstra](https://fr.wikipedia.org/wiki/Algorithme_de_Dijkstra) [NetworkX (Python)](https://networkx.org/)
:::

## 8. Exercices de synthèse

::: exo Exercice 1 — Degrés
Un graphe non orienté a 5 sommets et 7 arêtes. Que vaut la somme des degrés ?
?? Voir la solution
Lemme des poignées de main : la somme des degrés = 2 × (nombre d'arêtes) = 2×7 = **14**. (Chaque arête compte dans 2 degrés.)
:::

::: exo Exercice 2 — Chemins (matrice)
Pourquoi \((A^2)_{ij}\) donne-t-il le nombre de chemins de longueur 2 de \(i\) à \(j\) ?
?? Voir la solution
\((A^2)_{ij}=\sum_k A_{ik}A_{kj}\). Le terme \(A_{ik}A_{kj}\) vaut 1 ssi il y a une arête \(i\to k\) ET \(k\to j\), i.e. un chemin \(i\to k\to j\). La somme compte tous les intermédiaires \(k\) : c'est le nombre de chemins de longueur 2.
:::

::: exo Exercice 3 — PageRank (⭐)
Pourquoi ajoute-t-on un « facteur d'amortissement » (damping, ~0,85) dans PageRank ?
?? Voir la solution
Pour modéliser un surfeur qui, avec proba 15 %, saute vers une page aléatoire (au lieu de suivre un lien). Cela évite les « pièges » (pages sans lien sortant, composantes isolées) et garantit l'existence/unicité du vecteur propre (matrice stochastique irréductible → théorème de Perron-Frobenius).
:::

::: exo Exercice 4 — Arbre (⭐⭐)
Montre qu'un arbre à \(n\) sommets a exactement \(n-1\) arêtes.
?? Voir la solution
Par récurrence (Module 0 !). **Base** : 1 sommet, 0 arête ✔. **Hérédité** : un arbre à \(n+1\) sommets possède au moins une feuille (sommet de degré 1) ; la retirer donne un arbre à \(n\) sommets, qui a \(n-1\) arêtes par hypothèse. En remettant la feuille et son arête : \(n\) arêtes = \((n+1)-1\) ✔.
:::

::: culture Culture & histoire
Un encart à l'écart du cours : d'où viennent ces idées, qui les a forgées, et pourquoi.
La théorie des graphes est née d'une **promenade** : peut-on traverser les 7 ponts de Königsberg sans jamais repasser deux fois par le même ? Euler répond « non » en 1736 — et invente au passage toute une discipline.

#### Les grands noms
- **Leonhard Euler** (1707-1783) — les 7 ponts de Königsberg (1736), acte fondateur de la théorie des graphes.
- **Le théorème des 4 couleurs** (conjecturé 1852, prouvé 1976) — Appel & Haken : la *première* grande preuve assistée par ordinateur.
- **Edsger Dijkstra** (1930-2002) — son algorithme du plus court chemin (1959), pensé en 20 minutes à une terrasse de café.
- **Paul Erdős** (1913-1996) — graphes aléatoires (avec Rényi, 1959) ; mathématicien nomade aux ~1500 articles.
- **Larry Page & Sergey Brin** (1998) — PageRank : modéliser le web comme un graphe géant a donné Google.

#### Le tournant décisif
À la fin des années 1990, on découvre que les réseaux réels — web, réseaux sociaux, biologie — sont des « *petits mondes* » (Watts & Strogatz, 1998) et « *scale-free* » (Barabási). La théorie des graphes devient la **science des réseaux**.

#### Pourquoi ça te concerne
Réseaux sociaux, systèmes de recommandation, GPS, détection de communautés, *Graph Neural Networks* : le graphe est l'une des structures les plus présentes en data science.
- [Les 7 ponts de Königsberg](https://fr.wikipedia.org/wiki/Probl%C3%A8me_des_sept_ponts_de_K%C3%B6nigsberg)
- [Dijkstra](https://fr.wikipedia.org/wiki/Algorithme_de_Dijkstra)
- [PageRank](https://fr.wikipedia.org/wiki/PageRank)
- [Paul Erdős](https://fr.wikipedia.org/wiki/Paul_Erd%C5%91s)
:::
