---
title: Antisèche SQL & bases de données
subtitle: SELECT, NULL, agrégation, jointures, sous-requêtes, fenêtrage, DML, transactions et index — la référence de poche.
domains: DATA, BIG DATA
tags: SELECT, WHERE, NULL, GROUP BY, HAVING, JOIN, sous-requêtes, window functions, transactions, index
niveau: Révision express
---

Mémo des 8 modules du parcours SQL. La syntaxe suit le SQL standard ; les variantes (PostgreSQL, MySQL, SQLite, SQL Server) sont signalées. Exemples sur `clients(id, nom, ville, pays)` et `commandes(id, client_id, montant, statut, date_cmd)`. Détail → [cours SQL](matieres/sql/index.html).

## Ordre d'exécution logique ★

| Ordre | Clause | Rôle |
|---|---|---|
| 1 | `FROM` / `JOIN` | construire les lignes sources |
| 2 | `WHERE` | filtrer les **lignes** |
| 3 | `GROUP BY` | former les groupes |
| 4 | `HAVING` | filtrer les **groupes** |
| 5 | `SELECT` | calculer les colonnes, alias |
| 6 | `DISTINCT` | dédoublonner |
| 7 | `ORDER BY` | trier |
| 8 | `LIMIT` / `OFFSET` | couper |

::: why
C'est pourquoi un alias défini dans `SELECT` est **inconnu dans `WHERE`** (évalué avant), mais utilisable dans `ORDER BY` (évalué après).
:::

## SELECT de base

```sql
SELECT nom, ville                    -- colonnes voulues
FROM clients;

SELECT nom, montant * 1.2 AS montant_ttc   -- calcul + alias
FROM commandes;

SELECT * FROM clients;               -- pratique en exploration, à éviter en production
```

- Chaînes entre **apostrophes** `'Paris'` ; guillemets doubles = identifiants (standard).
- Base relationnelle = tables (relations) de lignes (tuples) ; **clé primaire** = identifiant unique ; **clé étrangère** = référence vers une autre table.

## WHERE & opérateurs

| Opérateur | Exemple |
|---|---|
| comparaison | `montant >= 100`, `pays <> 'FR'` |
| logique | `AND`, `OR`, `NOT` (AND prioritaire → **parenthèses**) |
| intervalle | `montant BETWEEN 10 AND 50` (bornes **incluses**) |
| liste | `pays IN ('FR', 'BE')` |
| motif | `nom LIKE 'Du%'` (`%` = n'importe quelle suite, `_` = 1 caractère) |

::: warn
`WHERE pays = 'FR' OR pays = 'BE' AND montant > 100` se lit `FR OR (BE AND >100)`. Mets des parenthèses.
:::

## NULL : la logique à 3 valeurs ★

- `NULL` = **inconnu**, ni 0, ni chaîne vide. Toute comparaison avec NULL donne **UNKNOWN**, et `WHERE` ne garde que TRUE.

```sql
WHERE ville IS NULL          -- ✅
WHERE ville = NULL           -- ❌ ne renvoie jamais rien
SELECT COALESCE(ville, 'inconnue') FROM clients;   -- 1re valeur non NULL
```

| Expression | Résultat |
|---|---|
| `NULL = NULL` | UNKNOWN |
| `TRUE AND UNKNOWN` | UNKNOWN |
| `FALSE AND UNKNOWN` | FALSE |
| `TRUE OR UNKNOWN` | TRUE |
| `5 + NULL` | NULL |

::: warn
`x NOT IN (1, 2, NULL)` ne renvoie **aucune ligne** (chaque test peut être UNKNOWN). Préférer `NOT EXISTS`.
:::

## Trier, dédoublonner, limiter

```sql
SELECT nom, montant FROM commandes
ORDER BY montant DESC, nom ASC       -- tri multi-critères
LIMIT 10 OFFSET 20;                  -- PostgreSQL/MySQL/SQLite
-- standard : FETCH FIRST 10 ROWS ONLY ; SQL Server : SELECT TOP 10
SELECT DISTINCT pays, ville FROM clients;   -- couples (pays, ville) distincts
```

::: warn
`LIMIT` **sans `ORDER BY`** = lignes arbitraires, non reproductibles. La place des NULL dans un tri dépend du SGBD (`NULLS FIRST/LAST` en PostgreSQL).
:::

## Agrégation : GROUP BY & HAVING ★

| Fonction | Ignore les NULL ? |
|---|---|
| `COUNT(*)` | non : compte **les lignes** |
| `COUNT(col)` | oui : lignes où col n'est pas NULL |
| `COUNT(DISTINCT col)` | oui, valeurs distinctes |
| `SUM`, `AVG`, `MIN`, `MAX` | oui |

```sql
SELECT statut, COUNT(*) AS nb, AVG(montant) AS panier_moyen
FROM commandes
WHERE date_cmd >= '2025-01-01'      -- filtre les LIGNES (avant)
GROUP BY statut
HAVING COUNT(*) > 10                -- filtre les GROUPES (après)
ORDER BY nb DESC;
```

::: warn
Règle : toute colonne du `SELECT` doit être **dans le `GROUP BY`** ou **dans une agrégation**. Un agrégat dans `WHERE` est interdit → `HAVING`.
:::

## Jointures ★

| Jointure | Garde |
|---|---|
| `INNER JOIN` | seulement les correspondances |
| `LEFT JOIN` | toute la gauche + correspondances (sinon NULL) |
| `RIGHT JOIN` | symétrique (rare : réécrire en LEFT) |
| `FULL OUTER JOIN` | tout des deux côtés (absent en MySQL) |
| `CROSS JOIN` | produit cartésien (n × m lignes) |

```sql
SELECT c.nom, COUNT(o.id) AS nb_cmd      -- COUNT(o.id) : 0 pour les sans-commande
FROM clients c
LEFT JOIN commandes o ON o.client_id = c.id
GROUP BY c.id, c.nom;

-- anti-jointure : clients n'ayant JAMAIS commandé
SELECT c.nom FROM clients c
LEFT JOIN commandes o ON o.client_id = c.id
WHERE o.id IS NULL;
```

::: warn
Filtrer la table de droite dans le `WHERE` (`WHERE o.statut = 'payée'`) **annule** le LEFT JOIN (les NULL sont éliminés) → mettre la condition dans le `ON`.
:::

- **Self-join** : `FROM employes e JOIN employes m ON e.manager_id = m.id` (alias obligatoires).
- Oublier la condition `ON` → produit cartésien : nombre de lignes qui explose.

## Sous-requêtes & CTE

```sql
-- scalaire : une seule valeur
SELECT * FROM commandes WHERE montant > (SELECT AVG(montant) FROM commandes);
-- IN : une liste
SELECT nom FROM clients WHERE id IN (SELECT client_id FROM commandes);
-- EXISTS corrélée : test d'existence, robuste aux NULL
SELECT nom FROM clients c
WHERE NOT EXISTS (SELECT 1 FROM commandes o WHERE o.client_id = c.id);
-- table dérivée (alias obligatoire)
SELECT AVG(nb) FROM (SELECT client_id, COUNT(*) AS nb
                     FROM commandes GROUP BY client_id) t;
-- CTE : même chose, plus lisible
WITH par_client AS (
  SELECT client_id, COUNT(*) AS nb FROM commandes GROUP BY client_id
)
SELECT AVG(nb) FROM par_client;
```

- **Corrélée** = référence la requête externe → réévaluée (logiquement) pour chaque ligne.

## Fonctions de fenêtrage ★

Calculer **sur un ensemble de lignes liées sans les fusionner** (contrairement à `GROUP BY`).

```sql
SELECT nom, ville, montant,
  ROW_NUMBER() OVER (PARTITION BY ville ORDER BY montant DESC) AS rn,
  SUM(montant) OVER (ORDER BY date_cmd)  AS cumul,
  LAG(montant) OVER (ORDER BY date_cmd)  AS precedent,
  AVG(montant) OVER (PARTITION BY ville) AS moy_ville
FROM ventes;
```

| Scores | `ROW_NUMBER` | `RANK` | `DENSE_RANK` |
|---|---|---|---|
| 100 | 1 | 1 | 1 |
| 100 | 2 | 1 | 1 |
| 90 | 3 | **3** | **2** |

- **Top-N par groupe** : `ROW_NUMBER()` dans une CTE, puis `WHERE rn <= 3` (on ne peut pas filtrer une fenêtre dans le `WHERE` du même niveau).
- `LAG` / `LEAD` : valeur de la ligne précédente / suivante (évolutions mois à mois).

## Écrire : INSERT, UPDATE, DELETE

```sql
INSERT INTO clients (nom, ville) VALUES ('Ada', 'Paris'), ('Alan', 'Lyon');
UPDATE commandes SET statut = 'payée' WHERE id = 42;
DELETE FROM commandes WHERE statut = 'annulée';
```

::: warn
`UPDATE` / `DELETE` **sans `WHERE`** touchent **toute la table**. Réflexe : écrire d'abord le `SELECT … WHERE …` équivalent, vérifier, puis transformer.
:::

## Transactions & ACID

```sql
BEGIN;                                       -- START TRANSACTION en MySQL
UPDATE comptes SET solde = solde - 100 WHERE id = 1;
UPDATE comptes SET solde = solde + 100 WHERE id = 2;
COMMIT;                                      -- ou ROLLBACK pour tout annuler
```

| Lettre | Propriété |
|---|---|
| **A**tomicité | tout ou rien |
| **C**ohérence | les contraintes restent respectées |
| **I**solation | les transactions concurrentes ne se voient pas à moitié |
| **D**urabilité | un COMMIT survit à une panne |

## Index

- Structure annexe (souvent un **B-tree**) qui accélère la recherche : on évite de lire toute la table (*full scan*).
- Utile sur les colonnes de `WHERE`, `JOIN`, `ORDER BY` **sélectives**. Clé primaire indexée automatiquement.
- Coût : espace disque + **écritures plus lentes** (chaque INSERT/UPDATE met l'index à jour).
- Index composite `(pays, ville)` : sert pour `pays` seul ou `pays + ville`, **pas** pour `ville` seule (préfixe gauche).
- Une fonction sur la colonne (`WHERE UPPER(nom) = …`) empêche en général l'usage de l'index.
- Vérifier le plan : `EXPLAIN` (PostgreSQL : `EXPLAIN ANALYZE`).

```sql
CREATE INDEX idx_cmd_client ON commandes(client_id);
```

## CASE & fonctions utiles

```sql
SELECT nom,
  CASE WHEN montant >= 500 THEN 'gros'
       WHEN montant >= 100 THEN 'moyen'
       ELSE 'petit' END AS segment
FROM commandes;
-- comptage conditionnel
SELECT SUM(CASE WHEN statut = 'payée' THEN 1 ELSE 0 END) AS nb_payees FROM commandes;
```

- `UNION` (dédoublonne) vs `UNION ALL` (garde tout, plus rapide).
- Texte : `UPPER`, `LOWER`, `TRIM`, `LENGTH`, concaténation `||` (standard) ou `CONCAT()`.

## Trous à réviser

- `WHERE` filtre les ==lignes== ; `HAVING` filtre les ==groupes==.
- On teste l'absence de valeur avec ==IS NULL==, jamais `= NULL`.
- `COUNT(*)` compte ==toutes les lignes== ; `COUNT(col)` ignore ==les NULL==.
- Avec les scores 100, 100, 90 : `DENSE_RANK` donne ==1, 1, 2==.
- Les clients sans commande : ==LEFT JOIN puis WHERE o.id IS NULL== (ou `NOT EXISTS`).
- ACID : A = ==atomicité== (tout ou rien).

::: quiz Auto-test — alias
Pourquoi `SELECT montant * 1.2 AS ttc FROM commandes WHERE ttc > 100;` échoue-t-elle ?
- [ ] Parce qu'on ne peut pas multiplier dans un SELECT
- [x] Parce que WHERE est évalué avant SELECT : l'alias ttc n'existe pas encore
- [ ] Parce qu'il faut écrire HAVING ttc > 100
> Ordre logique : FROM, WHERE, GROUP BY, HAVING, SELECT. Il faut répéter l'expression (WHERE montant * 1.2 > 100) ou passer par une sous-requête / CTE. HAVING sert aux groupes, pas à contourner un alias.
:::

::: quiz Auto-test — LEFT JOIN
Une requête `LEFT JOIN commandes o … WHERE o.statut = 'payée'` perd les clients sans commande. Pourquoi ?
- [ ] LEFT JOIN ne garde jamais les lignes sans correspondance
- [x] Pour eux o.statut vaut NULL, la condition est UNKNOWN et WHERE les élimine
- [ ] Il faut un RIGHT JOIN
> LEFT JOIN les a bien gardés avec des NULL, mais le WHERE s'applique après. Placer la condition dans le ON (ON o.client_id = c.id AND o.statut = 'payée') conserve tous les clients.
:::

::: culture Pour aller plus loin
- [Documentation PostgreSQL (SQL)](https://www.postgresql.org/docs/current/sql.html)
- [SQLite — SQL as understood by SQLite](https://www.sqlite.org/lang.html)
- [Use The Index, Luke (index & performances)](https://use-the-index-luke.com/fr)
:::
