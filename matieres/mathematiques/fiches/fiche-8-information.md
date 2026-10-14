# 📝 Fiche de révision — Module 8 : Théorie de l'information

> Information · Entropie · Cross-entropy · KL · Gain d'info — 🟦 DATA · 🟪 BIG DATA · 🟩 IA

---

## 1. Information & surprise
- `I = −log₂ p` (bits). Rare (p petit) → beaucoup d'info. Certain (p=1) → I=0.

## 2. Entropie de Shannon ⭐
`H(X) = −Σ pᵢ log₂ pᵢ` (incertitude moyenne, en bits)
- Max si équiprobable (`H_max=log₂ n`), nulle si certain.
- 🟪 **Limite de compression** (Shannon) : pas en dessous de H bits/symbole. Huffman/ZIP s'en approchent.

## 3. Cross-entropy & KL ⭐
- **Cross-entropy** : `H(p,q) = −Σ pᵢ log qᵢ`. Minimale quand q=p.
- **KL** : `D_KL(p‖q) = Σ pᵢ log(pᵢ/qᵢ) = H(p,q) − H(p) ≥ 0`. =0 ⇔ q=p. **Non symétrique**.
- 🟩 Cross-entropy = **fonction de perte** de la classification (softmax, NN). = maximum de vraisemblance. KL : VAE, distillation, RLHF.

## 4. Information mutuelle
`I(X;Y) = H(X) − H(X|Y)`. =0 ⇔ X,Y indépendants.
- 🟦 Sélection de features, dépendances non linéaires.

## 5. Gain d'information (arbres)
`Gain = H(avant) − Σ (nⱼ/n) H(brancheⱼ)`
- On choisit le split qui réduit le plus l'entropie (branches « pures »).
- 🟩 ID3/C4.5, Gini (CART), Random Forest, XGBoost.

---

## ✅ Auto-test
1. Événement le plus informatif ? → le plus rare
2. H maximale quand ? → équiprobable
3. Minimiser cross-entropy = ? → rapprocher q de p
4. KL symétrique ? → non, et ≥0
5. I(X;Y)=0 ⇔ ? → X,Y indépendants
6. Arbre choisit le split qui ? → maximise le gain d'info
7. Entropie de 4 symboles équiprobables ? → 2 bits

*Liens : [Entropie de Shannon](https://fr.wikipedia.org/wiki/Entropie_de_Shannon) · [KL](https://fr.wikipedia.org/wiki/Divergence_de_Kullback-Leibler) · [Visual Information Theory](https://colah.github.io/posts/2015-09-Visual-Information/)*
