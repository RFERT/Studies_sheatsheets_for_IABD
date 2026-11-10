# 📬 Backend « Boîte à idées » — collecte centralisée

Ce dossier contient une petite **API** pour centraliser les idées envoyées depuis
la page **Améliorations** du portail. Une fois déployée, tes ami·e·s n'ont qu'à
écrire dans le formulaire : l'idée part automatiquement, et **tout le monde voit
la même liste** (plus besoin d'exporter/importer un fichier).

Le site reste **100 % statique** (GitHub Pages / `file://`). L'API vit à part,
gratuitement, chez Cloudflare ou Google.

> ⚠️ Rien n'est obligatoire : si tu ne configures pas d'API, la boîte à idées
> continue de fonctionner **en local** (stockage dans le navigateur) comme avant.

---

## Contrat commun (les deux backends le respectent)

| Méthode | Chemin | Corps / En-tête | Réponse |
|--------|--------|-----------------|---------|
| `GET`  | `/`    | —               | `{ ok:true, ideas:[ {id,cid,text,author,cat,ts} ] }` |
| `POST` | `/`    | JSON `{text, author?, cat?, cid?, website?}` | `{ ok:true, idea:{…} }` |
| `DELETE` | `/?id=<id>` | en-tête `X-Admin-Key` | `{ ok:true, removed:n }` *(Cloudflare seulement)* |

- `cid` = identifiant client (anti-doublon / idempotence).
- `website` = champ **honeypot** anti-spam (laissé vide par les humains).
- Le front envoie le `POST` en `text/plain` pour éviter tout souci de CORS (préflight).

---

## Option A — Cloudflare Worker + KV ⭐ (recommandé)

Gratuit (100 000 requêtes/jour), rapide, mondial. Besoin de **Node.js** installé.

```powershell
# 1) Depuis ce dossier backend/
npm install -g wrangler        # ou:  npx wrangler ...
wrangler login                 # ouvre le navigateur pour se connecter à Cloudflare

# 2) Crée le stockage KV et récupère son id
wrangler kv namespace create IDEAS_KV
#   -> copie l'`id` affiché dans wrangler.toml (champ id = "...")

# 3) (Optionnel) définis la clé admin pour pouvoir supprimer des idées
wrangler secret put ADMIN_KEY
#   -> saisis une longue phrase secrète ; tu la colleras dans ideas-config.js

# 4) Déploie
wrangler deploy
#   -> affiche l'URL publique, ex:  https://idees-esgi.<toi>.workers.dev
```

Puis dans [`assets/ideas-config.js`](../assets/ideas-config.js) :

```js
window.IDEAS_API = "https://idees-esgi.<toi>.workers.dev";
window.IDEAS_ADMIN_KEY = "la-phrase-secrete-du-put-admin"; // seulement sur TON appareil
```

> 🔐 Ne partage jamais `IDEAS_ADMIN_KEY` et ne la pousse pas sur un dépôt public.
> Tes ami·e·s laissent ce champ vide : chez eux, le 🗑️ masque l'idée localement.

---

## Option B — Google Apps Script + Google Sheet (sans ligne de commande)

Idéal si tu ne veux pas installer Node. Les idées arrivent dans un **Google Sheet**
que tu possèdes (tu peux les trier/éditer/supprimer directement dedans).

1. Crée un **Google Sheet** vide.
2. Menu **Extensions → Apps Script**, colle tout [`ideas-apps-script.gs`](ideas-apps-script.gs).
3. **Déployer → Nouveau déploiement → Application Web**
   - *Exécuter en tant que* : **Moi**
   - *Accès* : **Tout le monde**
4. Autorise, copie l'URL qui finit par **`/exec`**.
5. Colle-la dans [`assets/ideas-config.js`](../assets/ideas-config.js) :

```js
window.IDEAS_API = "https://script.google.com/macros/s/AKf.../exec";
```

> La suppression côté serveur se fait **à la main dans le Sheet** (supprime la ligne).
> Laisse `IDEAS_ADMIN_KEY` vide avec cette option.

---

## Vérifier que ça marche

1. Ouvre la page **Améliorations**. Sous « Idées enregistrées », un statut indique
   `🌐 Collecte centralisée active`.
2. Envoie une idée depuis un appareil, ouvre la page sur un autre : elle apparaît. ✅
3. Hors-ligne, une idée part en file d'attente (⏳) et s'envoie à la reconnexion.

## Confidentialité

Données collectées : le texte de l'idée, un prénom **optionnel**, une catégorie,
un horodatage. Pas de compte, pas de mot de passe, pas de cookie tiers. Tu restes
propriétaire du stockage (ton namespace KV ou ton Sheet) et peux tout supprimer.
