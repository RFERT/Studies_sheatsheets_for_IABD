# 📝 Fiche de révision — Module 2 : Algèbre linéaire

> Vecteurs · Produit scalaire · Matrices · Rang · Déterminant · Valeurs propres · SVD/PCA
> *Cours de maths pour la Data, le Big Data & l'IA*

---

## 1. Vecteurs & espaces vectoriels
- Vecteur de ℝⁿ = liste de n nombres = **une observation** (features).
- **Combinaison linéaire** : `λ₁v₁ + … + λₖvₖ`. L'ensemble de toutes = **span** (sous-espace engendré).

---

## 2. Produit scalaire, norme, cosinus
- **Produit scalaire** : `u·v = Σ uᵢvᵢ = ‖u‖‖v‖cos θ`
- **Norme** : `‖v‖ = √(v·v)` ; **distance** : `d(u,v)=‖u−v‖`
- **Orthogonaux** ⇔ `u·v = 0`
- ⭐ **Similarité cosinus** : `cos θ = (u·v)/(‖u‖‖v‖) ∈ [−1,1]` (1 = même direction, 0 = sans rapport).

🔗 *Data :* recherche sémantique, bases vectorielles (RAG), word2vec, reco.

---

## 3. Matrices & transformations
- Matrice `m×n` ; transposée `Aᵀ` ; **produit** `Cᵢⱼ = Σ AᵢₖBₖⱼ`.
- ⚠️ **Non commutatif** : `AB ≠ BA`. Dimensions intérieures doivent coïncider : `(m×n)(n×p)=(m×p)`.
- **Idée clé :** une matrice = une **transformation linéaire** (rotation, étirement, projection). Couche de NN : `y = σ(Wx + b)`.

🔗 *Data :* dataset = matrice X (lignes=obs, colonnes=features) ; forward pass = produits matriciels (GPU).

---

## 4. Systèmes, rang, base, dimension
- Système `Ax = b` → **pivot de Gauss**.
- **Indépendance linéaire** : aucun vecteur redondant. **Base** : famille indépendante qui engendre. **Dimension** : taille d'une base.
- **Rang** = nb de lignes/colonnes indépendantes = « info réelle ».

🔗 *Data :* rang faible = features redondantes = **multicolinéarité** ; reco = approximation de rang faible.

---

## 5. Déterminant & inverse
- `det(2×2) = ad − bc`. `det(AB)=det A · det B`.
- `det(A)=0` ⇔ **non inversible** (rang non maximal, écrase l'espace).
- `A⁻¹` : `AA⁻¹=I`, existe ssi `det≠0`. Résout `Ax=b → x=A⁻¹b`.
- ⚠️ Inverser une matrice ~singulière = instable → préférer QR/SVD/**Ridge** (`+λI`).

---

## 6. Valeurs & vecteurs propres
- **Vecteur propre** : `Av = λv` (direction préservée, longueur ×λ).
- **Valeurs propres** : racines de `det(A − λI) = 0`.
- Matrice **triangulaire** → valeurs propres = diagonale.
- **Diagonalisation** : `A = PDP⁻¹` → `Aᵏ = PDᵏP⁻¹`.

🔗 *Data :* **PageRank** (vecteur propre dominant), PCA, chaînes de Markov, stabilité.

---

## 7. SVD & PCA ⭐
- **SVD** : toute matrice `A = UΣVᵀ` (U,V orthogonales ; Σ = valeurs singulières σ₁≥σ₂≥…≥0). Transformation = rotation → étirement → rotation.
- **Rang faible (Eckart–Young)** : garder les k plus grandes σ = meilleure approximation de rang k → compression, débruitage, reco.
- **PCA** (réduction de dimension en gardant la variance) :
  1. centrer les données
  2. covariance `C = (1/n) XᵀX`
  3. vecteurs propres = composantes principales ; valeurs propres = variance expliquée
  4. projeter sur les k premières
- PCA ≈ SVD de X centrée. Composantes **orthogonales**, triées par variance décroissante.

🔗 *Data :* visualisation 2D, débruitage, anti-malédiction de la dimension ; SVD → compression image, LSA (NLP), Netflix.

---

## ✅ Auto-test express
1. `u·v = 0` (non nuls) ? → orthogonaux
2. Taille de `(3×4)(4×2)` ? → 3×2
3. `det[[2,4],[1,2]]` ? → 0 → non inversible
4. Vecteur propre = ? → direction préservée, `Av=λv`
5. Premières composantes PCA = ? → directions orthogonales de plus grande variance
6. Toute matrice a-t-elle une SVD ? → oui, même non carrée

*Liens : [3Blue1Brown Algèbre linéaire](https://www.3blue1brown.com/topics/linear-algebra) · [PCA](https://fr.wikipedia.org/wiki/Analyse_en_composantes_principales) · [SVD](https://fr.wikipedia.org/wiki/D%C3%A9composition_en_valeurs_singuli%C3%A8res) · [MIT 18.06 Strang](https://ocw.mit.edu/courses/18-06-linear-algebra-spring-2010/)*
