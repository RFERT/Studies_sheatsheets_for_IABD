# 📝 Fiche de révision — Module 6 : Théorie des graphes

> Vocabulaire · Parcours · Chemins · PageRank — 🟦 DATA · 🟪 BIG DATA · 🟩 IA

---

## 1. Vocabulaire
- `G=(V,E)` : sommets V, arêtes E. Orienté (arcs) / non orienté. Pondéré.
- Degré = nb d'arêtes incidentes. Chemin, cycle, connexe.

## 2. Représentations
| Repr | Mémoire | Bon pour |
|---|---|---|
| Matrice adjacence | O(V²) | graphes denses |
| Liste adjacence | O(V+E) | graphes creux (réels) |
- ⭐ `(Aᵏ)ᵢⱼ` = nb de chemins de longueur k de i à j.

## 3. Parcours
- **BFS** (file FIFO) : par cercles → plus court chemin en nb d'arêtes. O(V+E).
- **DFS** (pile/récursion) : plonge en profondeur → cycles, composantes, tri topo. O(V+E).

## 4. Plus courts chemins (pondérés)
| Algo | Résout | Contrainte |
|---|---|---|
| Dijkstra | source → tous | poids ≥ 0 |
| Bellman-Ford | idem + poids négatifs | plus lent |
| Floyd-Warshall | tous les couples | O(V³) |
| A* | avec heuristique | GPS/jeux |

## 5. Centralité & PageRank ⭐
- Degré (populaire), betweenness (pont), closeness (proche de tous).
- **PageRank** : importance récursive. `r = Mr` = **vecteur propre dominant** (λ=1) → power iteration. Damping ~0,85.
- 🟪🟩 ranking web, influence, fraude ; **GNN** = deep learning sur graphes.

## 6. Graphes particuliers
- Arbre : connexe sans cycle, **n−1 arêtes**.
- DAG : orienté sans cycle = ordre partiel (Module 1).
- Biparti : 2 groupes (users↔produits) → reco.
- Complet Kₙ : C(n,2) arêtes.

---

## ✅ Auto-test
1. « Follow » Twitter = graphe ? → orienté
2. Plus court chemin non pondéré ? → BFS (file FIFO)
3. GPS poids positifs ? → Dijkstra
4. PageRank = ? → vecteur propre dominant de M
5. Somme des degrés ? → 2E (poignées de main)
6. Arbre à n sommets → ? arêtes → n−1

*Liens : [PageRank](https://fr.wikipedia.org/wiki/PageRank) · [Dijkstra](https://fr.wikipedia.org/wiki/Algorithme_de_Dijkstra) · [NetworkX](https://networkx.org/)*
