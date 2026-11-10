/* =========================================================
   ideas-config.js — Collecte centralisée de la « Boîte à idées »
   ---------------------------------------------------------
   • Laisse IDEAS_API vide ("")  -> fonctionnement 100 % local (localStorage).
   • Renseigne l'URL de ton API  -> les idées sont centralisées et visibles
     par tout le monde, automatiquement.

   Deux backends prêts à l'emploi (voir backend/README.md) :
     - Cloudflare Worker + KV  (recommandé)
     - Google Apps Script + Google Sheet (sans ligne de commande)

   Après déploiement, colle l'URL publique ci-dessous, par exemple :
     window.IDEAS_API = "https://idees-esgi.ton-sous-domaine.workers.dev";
     window.IDEAS_API = "https://script.google.com/macros/s/AKf.../exec";
   ========================================================= */

window.IDEAS_API = "";

/* Clé secrète du PROPRIÉTAIRE uniquement (permet de supprimer une idée côté
   serveur avec le bouton 🗑️). À NE PAS partager ni committer en public.
   Laisse vide pour tes ami·e·s : la suppression reste alors locale à l'affichage. */
window.IDEAS_ADMIN_KEY = "";
