/* =========================================================
   cards-data.js — Banque de flashcards du portail Pharmacie
   window.PHARMA_CARDS = [{ id, deck, q, a }, ...]
     id   : "<deck>-<n>" (stable : sert de clé dans pharma-flashcards)
     deck : id d'un module (PHARMA.modules[i].id)
     q, a : HTML court (<code>, <strong>, <br> autorisés)
   Les cartes sont fondées sur le contenu des modules (PH/modules/*.html).
   Support de révision : ne remplace pas les référentiels officiels.

   Aides exposées (utilisables par l'accueil) :
     PHARMA.customCards()   cartes perso (clé pharma-flashcards-custom)
     PHARMA.allCards()      banque + cartes perso
     PHARMA.cardsDue()      nombre de cartes à revoir aujourd'hui
   État de planification (clé PHARMA.K.cards) : { "<id carte>": {ease, int, due} }
   avec due = jour (Math.floor(Date.now()/86400000)) ; carte absente = nouvelle.
   ========================================================= */
(function () {
  "use strict";

  window.PHARMA_CARDS = [
    /* ---------- Chimie ---------- */
    { id: "chimie-1", deck: "chimie", q: "Que représente le numéro atomique <code>Z</code> ?", a: "Le nombre de <strong>protons</strong> : il définit l'élément.<br>A (nombre de masse) = protons + neutrons." },
    { id: "chimie-2", deck: "chimie", q: "Isotopes : définition ?", a: "Même <code>Z</code>, <code>A</code> différent (nombre de neutrons différent). Ex. carbone 12 et carbone 14." },
    { id: "chimie-3", deck: "chimie", q: "Cation ou anion : lequel perd des électrons ?", a: "Le <strong>cation</strong> (+) a perdu des e⁻ (ex. Na⁺). L'<strong>anion</strong> (–) en a gagné (ex. Cl⁻)." },
    { id: "chimie-4", deck: "chimie", q: "Les 3 grands types de liaisons ?", a: "<strong>Covalente</strong> : partage d'e⁻ (molécules organiques, H₂O).<br><strong>Ionique</strong> : ions de charges opposées (NaCl).<br><strong>Hydrogène</strong> : liaison faible H–O/N (cohésion de l'eau, ADN)." },
    { id: "chimie-5", deck: "chimie", q: "Formule d'une dilution ?", a: "<code>C₁V₁ = C₂V₂</code> : la quantité de soluté est conservée.<br>Convertir les volumes dans la même unité (litres)." },
    { id: "chimie-6", deck: "chimie", q: "250 mL à 0,1 mol/L à partir d'une solution mère à 1 mol/L : volume de mère à prélever ?", a: "<code>V₁ = C₂V₂ / C₁ = 0,1 × 250 / 1</code> = <strong>25 mL</strong>, complétés à 250 mL avec le solvant." },
    { id: "chimie-7", deck: "chimie", q: "Eau oxygénée à 30 % : comment obtenir 200 mL à 3 % ?", a: "<code>V₁ = 3 × 200 / 30</code> = <strong>20 mL</strong> de solution à 30 %, complétés à 200 mL avec de l'eau (dilution ×10)." },
    { id: "chimie-8", deck: "chimie", q: "Sérum physiologique : concentration, et masse de NaCl pour 500 mL ?", a: "NaCl 0,9 % = <strong>9 g/L</strong>.<br>Pour 500 mL : 9 × 0,5 = <strong>4,5 g</strong>." },
    { id: "chimie-9", deck: "chimie", q: "Lien entre concentration massique et molaire ? Masse molaire du NaCl ?", a: "<code>Cₘ = C × M</code> (g/L = mol/L × g/mol).<br>NaCl : 23 + 35,5 = <strong>58,5 g/mol</strong>." },
    { id: "chimie-10", deck: "chimie", q: "Définition du pH ? Repères sanguins ?", a: "<code>pH = −log[H₃O⁺]</code> (0 à 14 à 25 °C ; &lt; 7 acide, &gt; 7 basique).<br>Sang ≈ <strong>7,40</strong> ; &lt; 7,35 acidose, &gt; 7,45 alcalose." },
    { id: "chimie-11", deck: "chimie", q: "Qu'est-ce qu'une solution tampon ?", a: "Une solution qui <strong>résiste aux variations de pH</strong> quand on ajoute un acide ou une base. Ex. système bicarbonate du sang." },
    { id: "chimie-12", deck: "chimie", q: "Groupes à reconnaître : –OH, –COOH, –NH₂, –COO–, –CO–NH– ?", a: "Alcool · acide carboxylique (aspirine) · amine · ester · amide (paracétamol, liaison peptidique)." },

    /* ---------- Anatomie ---------- */
    { id: "anatomie-1", deck: "anatomie", q: "Niveaux d'organisation du vivant, du plus petit au plus grand ?", a: "atome → molécule → cellule → tissu → organe → système (appareil) → organisme." },
    { id: "anatomie-2", deck: "anatomie", q: "Les 4 types de tissus ?", a: "<strong>Épithélial</strong> (revêtement, glandes) · <strong>conjonctif</strong> (soutien : os, sang, graisse) · <strong>musculaire</strong> · <strong>nerveux</strong>." },
    { id: "anatomie-3", deck: "anatomie", q: "Les 3 plans anatomiques ?", a: "<strong>Sagittal</strong> : gauche/droite · <strong>frontal</strong> (coronal) : avant/arrière · <strong>transversal</strong> : haut/bas." },
    { id: "anatomie-4", deck: "anatomie", q: "Le poignet est ___ par rapport au coude ?", a: "<strong>Distal</strong> (loin de la racine du membre). Le coude est proximal par rapport au poignet." },
    { id: "anatomie-5", deck: "anatomie", q: "Combien d'os chez l'adulte ? Où sont produites les cellules sanguines ?", a: "Environ <strong>206 os</strong>. Cellules sanguines : <strong>moelle osseuse</strong> (os longs)." },
    { id: "anatomie-6", deck: "anatomie", q: "Cavités du cœur : lesquelles reçoivent, lesquelles éjectent le sang ?", a: "4 cavités : les 2 <strong>oreillettes</strong> reçoivent, les 2 <strong>ventricules</strong> éjectent.<br>Cœur droit → poumons ; cœur gauche → corps entier." },
    { id: "anatomie-7", deck: "anatomie", q: "Artère, veine, capillaire : définitions ?", a: "<strong>Artère</strong> : part du cœur (paroi épaisse).<br><strong>Veine</strong> : revient au cœur (valvules).<br><strong>Capillaire</strong> : lieu des échanges avec les tissus." },
    { id: "anatomie-8", deck: "anatomie", q: "« Artère = sang oxygéné » : vrai ?", a: "<strong>Faux en général</strong> : l'artère pulmonaire transporte du sang pauvre en O₂. La bonne règle : artère = vaisseau qui <strong>part du cœur</strong>." },
    { id: "anatomie-9", deck: "anatomie", q: "Trajet du sang du ventricule droit au ventricule gauche (petite circulation) ?", a: "Ventricule droit → artère pulmonaire → poumons → veines pulmonaires → oreillette gauche → ventricule gauche." },
    { id: "anatomie-10", deck: "anatomie", q: "Trajet de l'air et lieu des échanges gazeux ?", a: "nez/bouche → pharynx → larynx → trachée → bronches → bronchioles → <strong>alvéoles</strong> (échanges O₂/CO₂)." },
    { id: "anatomie-11", deck: "anatomie", q: "Où a lieu l'essentiel de l'absorption des nutriments ?", a: "Dans l'<strong>intestin grêle</strong>. Le côlon réabsorbe surtout l'eau." },
    { id: "anatomie-12", deck: "anatomie", q: "SNC et SNP : composition ?", a: "<strong>SNC</strong> = encéphale + moelle épinière. <strong>SNP</strong> = nerfs. Le système nerveux autonome règle les fonctions involontaires (cœur, digestion)." },

    /* ---------- Physiologie ---------- */
    { id: "physiologie-1", deck: "physiologie", q: "Qu'est-ce que l'homéostasie ?", a: "Maintien des constantes internes stables (T° ≈ 37 °C, pH 7,4, glycémie, pression) malgré l'environnement." },
    { id: "physiologie-2", deck: "physiologie", q: "Rétrocontrôle négatif : principe et exemple ?", a: "Un écart déclenche une réponse qui le <strong>corrige</strong> (thermostat). Ex. glycémie ↑ → insuline → glycémie ↓." },
    { id: "physiologie-3", deck: "physiologie", q: "Systole et diastole ?", a: "<strong>Systole</strong> = contraction (éjection). <strong>Diastole</strong> = relâchement (remplissage). Repos adulte : ≈ 60–80 battements/min." },
    { id: "physiologie-4", deck: "physiologie", q: "Débit cardiaque : formule et valeur au repos ?", a: "<code>Débit = fréquence × volume d'éjection systolique</code> ≈ <strong>5 L/min</strong> au repos." },
    { id: "physiologie-5", deck: "physiologie", q: "Dans « 120/80 mmHg », que représente chaque valeur ? Seuil d'HTA ?", a: "120 = pression <strong>systolique</strong> ; 80 = <strong>diastolique</strong>.<br>HTA : <strong>≥ 140/90</strong> mmHg (répété, au cabinet)." },
    { id: "physiologie-6", deck: "physiologie", q: "Qui transporte l'oxygène dans le sang ?", a: "L'<strong>hémoglobine</strong> des globules rouges." },
    { id: "physiologie-7", deck: "physiologie", q: "Qu'est-ce qui règle surtout la respiration ?", a: "Le taux de <strong>CO₂</strong> (et le pH), détecté par le tronc cérébral : CO₂ ↑ → respiration plus rapide." },
    { id: "physiologie-8", deck: "physiologie", q: "Rôle du néphron ? Combien par rein ?", a: "Unité de filtration : réabsorbe l'utile (eau, glucose, ions), élimine les déchets (urée, créatinine). ≈ <strong>1 million</strong> par rein." },
    { id: "physiologie-9", deck: "physiologie", q: "Pourquoi réduit-on souvent les doses en insuffisance rénale ?", a: "Le médicament s'élimine mal → risque d'<strong>accumulation</strong> et de toxicité. La clairance de la créatinine estime la fonction rénale." },
    { id: "physiologie-10", deck: "physiologie", q: "Insuline vs glucagon ?", a: "<strong>Insuline</strong> : fait <strong>baisser</strong> la glycémie (après repas). <strong>Glucagon</strong> : la fait <strong>monter</strong> (à jeun)." },
    { id: "physiologie-11", deck: "physiologie", q: "Effet attendu d'un diurétique sur la pression artérielle ?", a: "↑ élimination d'eau et de sodium → ↓ volume sanguin → <strong>↓ pression artérielle</strong>." },

    /* ---------- Galénique ---------- */
    { id: "galenique-1", deck: "galenique", q: "Principe actif, excipient, forme galénique ?", a: "<strong>PA</strong> : molécule qui soigne. <strong>Excipient</strong> : sans activité thérapeutique (met en forme, conserve…). <strong>Forme</strong> : présentation finale (comprimé, sirop…)." },
    { id: "galenique-2", deck: "galenique", q: "Effet de premier passage hépatique : définition et voies qui l'évitent ?", a: "Après absorption intestinale, le foie métabolise une partie du PA avant son action.<br>Évité par les voies <strong>IV, sublinguale, transdermique</strong>." },
    { id: "galenique-3", deck: "galenique", q: "Voie la plus rapide et la plus complète ?", a: "<strong>Intraveineuse</strong> : action immédiate, biodisponibilité 100 %, stérile." },
    { id: "galenique-4", deck: "galenique", q: "Enfant qui vomit, antipyrétique nécessaire : quelle voie ?", a: "<strong>Rectale</strong> (suppositoire) : contourne le problème des vomissements." },
    { id: "galenique-5", deck: "galenique", q: "Peut-on écraser un comprimé LP (libération prolongée) ?", a: "<strong>Non</strong> : toute la dose est libérée d'un coup (surdosage grave). Idem pour certains gastro-résistants. Demander une forme adaptée au pharmacien." },
    { id: "galenique-6", deck: "galenique", q: "Excipients à effet notoire (EEN) : exemples et risque ?", a: "Lactose (intolérance), gluten, <strong>aspartam</strong> (phénylcétonurie), saccharose (diabète), huile d'arachide (allergie), alcool, certains colorants." },
    { id: "galenique-7", deck: "galenique", q: "Préparation magistrale vs officinale ?", a: "<strong>Magistrale</strong> : sur ordonnance, pour un patient. <strong>Officinale</strong> : inscrite au formulaire/pharmacopée, préparée à l'avance en petite série. Toutes deux sous <strong>BPP</strong>." },
    { id: "galenique-8", deck: "galenique", q: "Pommade à 2 % (m/m) : PA dans 50 g ?", a: "2 g pour 100 g → <code>(2 × 50)/100</code> = <strong>1 g</strong> de PA." },
    { id: "galenique-9", deck: "galenique", q: "Solution à 5 % (m/V) : PA dans 200 mL ?", a: "5 g pour 100 mL → <strong>10 g</strong> pour 200 mL." },
    { id: "galenique-10", deck: "galenique", q: "Posologie de 15 mg/kg, enfant de 20 kg : dose par prise ?", a: "<code>15 × 20</code> = <strong>300 mg</strong> par prise." },
    { id: "galenique-11", deck: "galenique", q: "80 g de crème à 0,5 % (m/m) d'hydrocortisone : masses de PA et d'excipient ?", a: "PA = 0,5 × 80 / 100 = <strong>0,4 g</strong> ; excipient = 80 − 0,4 = <strong>79,6 g</strong>." },
    { id: "galenique-12", deck: "galenique", q: "Sirop à 125 mg/5 mL : volume pour une dose de 250 mg ?", a: "250 / 125 = 2 → 2 × 5 mL = <strong>10 mL</strong>." },
    { id: "galenique-13", deck: "galenique", q: "Débit de perfusion : 500 mL en 4 h avec un perfuseur à 20 gouttes/mL ?", a: "<code>500 × 20 / 240 min</code> ≈ <strong>42 gouttes/min</strong>.<br>Formule : gouttes/min = volume (mL) × 20 / durée (min)." },
    { id: "galenique-14", deck: "galenique", q: "Posologie 60 mg/kg/jour en 3 prises, enfant de 15 kg : dose par prise ?", a: "60 × 15 = 900 mg/jour → 900 / 3 = <strong>300 mg</strong> par prise." },

    /* ---------- Législation ---------- */
    { id: "legislation-1", deck: "legislation", q: "Statut du préparateur (L4241-1 CSP) ?", a: "Il <strong>seconde</strong> le pharmacien titulaire et les adjoints, sous leur <strong>contrôle effectif</strong>. Professionnel de santé tenu au <strong>secret professionnel</strong>." },
    { id: "legislation-2", deck: "legislation", q: "Définition du médicament : quel article ?", a: "Art. <strong>L5111-1</strong> du CSP : substance à propriétés curatives ou préventives, ou utilisable pour établir un diagnostic ou modifier des fonctions physiologiques." },
    { id: "legislation-3", deck: "legislation", q: "AMM, princeps, générique, DCI ?", a: "<strong>AMM</strong> : autorisation de mise sur le marché (obligatoire). <strong>Princeps</strong> : médicament original. <strong>Générique</strong> : même PA et dosage, bioéquivalent. <strong>DCI</strong> : nom commun international du PA." },
    { id: "legislation-4", deck: "legislation", q: "Qu'est-ce que le monopole pharmaceutique ?", a: "La vente des médicaments est <strong>réservée aux pharmacies</strong> (officine) : garantie de sécurité de dispensation." },
    { id: "legislation-5", deck: "legislation", q: "Que comprennent les substances vénéneuses ? Qui les classe ?", a: "Stupéfiants, psychotropes, <strong>liste I</strong> et <strong>liste II</strong>.<br>Classement par l'<strong>ANSM</strong> depuis 2022." },
    { id: "legislation-6", deck: "legislation", q: "Liste I (cadre rouge) : renouvellement ?", a: "<strong>Non renouvelable</strong> sauf mention expresse du prescripteur. Rouge = le plus restrictif." },
    { id: "legislation-7", deck: "legislation", q: "Liste II (cadre vert) : renouvellement ?", a: "<strong>Renouvelable</strong> sauf mention contraire. Vert = plus souple." },
    { id: "legislation-8", deck: "legislation", q: "Ordonnance : délai de présentation pour une 1ʳᵉ délivrance ? Durée max de renouvellement ?", a: "Présentée dans les <strong>3 mois</strong> suivant sa date. Renouvellement jusqu'à <strong>12 mois</strong> maximum si le prescripteur l'a prévu (délivrance par périodes de ≈ 1 mois)." },
    { id: "legislation-9", deck: "legislation", q: "Ordonnance vieille de 5 mois, début d'un traitement chronique : que faire ?", a: "Plus exécutable (&gt; 3 mois) : orienter vers le médecin pour une nouvelle prescription (sous réserve de l'avis du pharmacien)." },
    { id: "legislation-10", deck: "legislation", q: "Stupéfiants : forme de l'ordonnance et écriture des quantités ?", a: "Ordonnance <strong>sécurisée</strong> (papier spécial, filigrane, micro-lettres) ; quantités et dosage <strong>en toutes lettres</strong>." },
    { id: "legislation-11", deck: "legislation", q: "Stupéfiants : durées de prescription et délai de présentation ?", a: "Durée limitée (souvent <strong>7, 14 ou 28 jours</strong> selon le médicament). Présentation sous <strong>3 jours</strong> pour la totalité ; au-delà, seulement la durée restante." },
    { id: "legislation-12", deck: "legislation", q: "Stupéfiants : chevauchement de deux ordonnances ?", a: "<strong>Interdit</strong>, sauf mention expresse du prescripteur. Enregistrement spécifique (ordonnancier / comptabilité)." },
    { id: "legislation-13", deck: "legislation", q: "Que vérifie le préparateur sur une ordonnance ? Et en cas de doute ?", a: "Lisibilité, cohérence posologie/âge, interactions, contre-indications, doublons.<br>Doute : <strong>pas de délivrance sans avis du pharmacien</strong>." },

    /* ---------- Pharmacologie ---------- */
    { id: "pharmacologie-1", deck: "pharmacologie", q: "ADME : que signifie chaque lettre ?", a: "<strong>A</strong>bsorption · <strong>D</strong>istribution · <strong>M</strong>étabolisme (foie, CYP450) · <strong>E</strong>limination (rein, bile)." },
    { id: "pharmacologie-2", deck: "pharmacologie", q: "Biodisponibilité (F) : de quoi s'agit-il ?", a: "Fraction du PA qui atteint la circulation générale. Voie orale : réduite par le premier passage hépatique ; IV : 100 %." },
    { id: "pharmacologie-3", deck: "pharmacologie", q: "Distribution : quelle fraction du médicament est active ?", a: "Seule la fraction <strong>libre</strong> (non liée aux protéines plasmatiques comme l'albumine)." },
    { id: "pharmacologie-4", deck: "pharmacologie", q: "Qu'est-ce qu'une pro-drogue ? Exemple ?", a: "Inactive tant qu'elle n'est pas métabolisée. Ex. la <strong>codéine</strong> est transformée en <strong>morphine</strong> par le foie." },
    { id: "pharmacologie-5", deck: "pharmacologie", q: "Demi-vie (t½) : définition ?", a: "Temps pour que la concentration plasmatique soit <strong>divisée par 2</strong>. Elle fixe le rythme des prises." },
    { id: "pharmacologie-6", deck: "pharmacologie", q: "Combien de demi-vies pour éliminer un médicament / atteindre l'équilibre ?", a: "Environ <strong>4 à 5 demi-vies</strong>." },
    { id: "pharmacologie-7", deck: "pharmacologie", q: "t½ = 6 h : fraction restante après 24 h ?", a: "24 h = 4 demi-vies → (½)⁴ = <strong>1/16</strong>." },
    { id: "pharmacologie-8", deck: "pharmacologie", q: "t½ = 12 h : fraction restante après 36 h ?", a: "36 h = 3 demi-vies → (½)³ = <strong>1/8</strong>." },
    { id: "pharmacologie-9", deck: "pharmacologie", q: "Agoniste, antagoniste, inhibiteur enzymatique ?", a: "<strong>Agoniste</strong> : active le récepteur. <strong>Antagoniste</strong> : le bloque (bêtabloquant). <strong>Inhibiteur</strong> : bloque une enzyme (IEC, statines)." },
    { id: "pharmacologie-10", deck: "pharmacologie", q: "Index thérapeutique étroit : exemples ?", a: "Marge de sécurité faible entre dose efficace et toxique : <strong>AVK, digoxine, lithium</strong> → surveillance rapprochée." },
    { id: "pharmacologie-11", deck: "pharmacologie", q: "Paliers OMS de la douleur ?", a: "<strong>1</strong> : non-opioïdes (paracétamol, AINS) · <strong>2</strong> : opioïdes faibles (codéine, tramadol) · <strong>3</strong> : opioïdes forts (morphine)." },
    { id: "pharmacologie-12", deck: "pharmacologie", q: "Inducteur vs inhibiteur enzymatique : effet sur un médicament ?", a: "<strong>Inducteur</strong> (millepertuis, rifampicine) : métabolisme accéléré → effet ↓.<br><strong>Inhibiteur</strong> (pamplemousse/CYP3A4) : concentration ↑ → risque toxique." },
    { id: "pharmacologie-13", deck: "pharmacologie", q: "Millepertuis + pilule contraceptive : risque ?", a: "Inducteur enzymatique → <strong>efficacité contraceptive diminuée</strong> (risque de grossesse). Orienter vers le pharmacien/médecin." },
    { id: "pharmacologie-14", deck: "pharmacologie", q: "Pourquoi l'INR sous AVK ?", a: "Index étroit : trop peu = thrombose, trop = hémorragie. L'<strong>INR</strong> mesure l'effet anticoagulant pour ajuster la dose." },

    /* ---------- Pathologie ---------- */
    { id: "pathologie-1", deck: "pathologie", q: "Signe vs symptôme ?", a: "<strong>Signe</strong> : objectif, constaté (fièvre mesurée). <strong>Symptôme</strong> : ressenti par le patient (douleur)." },
    { id: "pathologie-2", deck: "pathologie", q: "Aigu vs chronique ? Étiologie, diagnostic, pronostic ?", a: "Aigu = brutal, court ; chronique = durable. <strong>Étiologie</strong> = cause ; <strong>diagnostic</strong> = identification ; <strong>pronostic</strong> = évolution prévisible." },
    { id: "pathologie-3", deck: "pathologie", q: "Définition repère de l'HTA ?", a: "Pression artérielle durablement élevée : <strong>≥ 140/90 mmHg</strong> au cabinet, confirmée (répétée)." },
    { id: "pathologie-4", deck: "pathologie", q: "Pourquoi l'observance est-elle cruciale dans l'HTA ?", a: "Maladie souvent <strong>silencieuse</strong> : le patient ne « sent » pas le bénéfice, mais le risque d'AVC, infarctus et insuffisance rénale augmente." },
    { id: "pathologie-5", deck: "pathologie", q: "Classes d'antihypertenseurs ?", a: "Diurétiques, <strong>IEC/ARA2</strong>, inhibiteurs calciques, bêtabloquants (+ règles hygiéno-diététiques : sel, activité, tabac)." },
    { id: "pathologie-6", deck: "pathologie", q: "Diabète de type 1 vs type 2 ?", a: "<strong>Type 1</strong> : destruction des cellules du pancréas → carence en insuline → insuline indispensable.<br><strong>Type 2</strong> : résistance à l'insuline → règles de vie + antidiabétiques oraux (metformine), parfois insuline." },
    { id: "pathologie-7", deck: "pathologie", q: "Signes d'hypoglycémie et conduite à tenir ?", a: "Sueurs, tremblements, pâleur, confusion. <strong>Resucrage immédiat</strong> (sucre rapide, ≈ 15 g) si conscient ; trouble de conscience → ne rien faire avaler, appeler les secours (15)." },
    { id: "pathologie-8", deck: "pathologie", q: "Asthme : traitement de crise et traitement de fond ?", a: "Crise : bronchodilatateur d'action rapide (<strong>salbutamol</strong>). Fond : <strong>corticoïde inhalé</strong>." },
    { id: "pathologie-9", deck: "pathologie", q: "Conseil après un corticoïde inhalé ?", a: "Se <strong>rincer la bouche</strong> (prévention des mycoses). Vérifier aussi la technique d'inhalation." },
    { id: "pathologie-10", deck: "pathologie", q: "Recours fréquent au bronchodilatateur de crise : que penser ?", a: "Signe d'un <strong>asthme mal contrôlé</strong> : orienter vers le pharmacien/médecin (réévaluation du traitement de fond)." },
    { id: "pathologie-11", deck: "pathologie", q: "BPCO : cause principale et mesure la plus efficace ?", a: "Surtout liée au <strong>tabac</strong> ; obstruction peu réversible et progressive. <strong>Arrêt du tabac</strong> = mesure la plus efficace." },
    { id: "pathologie-12", deck: "pathologie", q: "Antibiotiques : sur quoi agissent-ils ? Règle d'usage ?", a: "Sur les <strong>bactéries</strong>, pas les virus (rhume, grippe, Covid). Respecter la <strong>durée prescrite</strong>, ne pas réutiliser un reste (antibiorésistance)." },

    /* ---------- Toxicologie ---------- */
    { id: "toxicologie-1", deck: "toxicologie", q: "Principe de Paracelse ?", a: "« C'est la <strong>dose</strong> qui fait le poison » : toute substance est toxique à partir d'une certaine dose." },
    { id: "toxicologie-2", deck: "toxicologie", q: "DL50 : définition et lecture ?", a: "Dose létale pour 50 % des sujets. Plus elle est <strong>basse</strong>, plus la substance est <strong>toxique</strong>." },
    { id: "toxicologie-3", deck: "toxicologie", q: "Toxicité aiguë vs chronique ?", a: "<strong>Aiguë</strong> : exposition unique et forte (surdosage). <strong>Chronique</strong> : expositions répétées et faibles avec accumulation." },
    { id: "toxicologie-4", deck: "toxicologie", q: "Surdosage en paracétamol : organe touché et antidote ?", a: "<strong>Foie</strong> (hépatotoxique, souvent sans symptôme initial). Antidote : <strong>N-acétylcystéine</strong> (NAC), d'autant plus efficace qu'elle est précoce." },
    { id: "toxicologie-5", deck: "toxicologie", q: "Antidote des opioïdes (morphine…) ?", a: "<strong>Naloxone</strong>. Signes : myosis, dépression respiratoire." },
    { id: "toxicologie-6", deck: "toxicologie", q: "Antidote des benzodiazépines ?", a: "<strong>Flumazénil</strong>. Signes : somnolence, dépression respiratoire." },
    { id: "toxicologie-7", deck: "toxicologie", q: "Intoxication au monoxyde de carbone (CO) : mécanisme, signes, antidote ?", a: "Gaz inodore qui prend la place de l'O₂ sur l'hémoglobine. Maux de tête, nausées, vertiges chez <strong>plusieurs personnes</strong> d'un même lieu. Antidote : <strong>oxygène</strong> (aérer, évacuer, secours)." },
    { id: "toxicologie-8", deck: "toxicologie", q: "Surdosage en AVK : antidote ?", a: "<strong>Vitamine K</strong>." },
    { id: "toxicologie-9", deck: "toxicologie", q: "Ingestion d'un produit caustique : ce qu'il ne faut PAS faire ?", a: "<strong>Ne pas faire vomir</strong> (double lésion), ne pas faire boire massivement. Appeler le centre antipoison, garder l'emballage." },
    { id: "toxicologie-10", deck: "toxicologie", q: "Quelles informations donner au centre antipoison ?", a: "Le <strong>produit</strong>, la <strong>quantité</strong> et l'<strong>heure</strong> d'exposition (+ état de conscience et respiration)." },
    { id: "toxicologie-11", deck: "toxicologie", q: "Réflexes devant une intoxication ?", a: "Évaluer (conscience, respiration), identifier produit/quantité, noter l'heure, appeler le <strong>15</strong> ou le centre antipoison, suivre leurs consignes. Ne rien administrer « au cas où »." },
    { id: "toxicologie-12", deck: "toxicologie", q: "Adulte ayant pris 15 g de paracétamol, qui « se sent bien » : rassurant ?", a: "<strong>Non</strong> : dose très supérieure au maximum, hépatotoxicité souvent silencieuse au début. Urgence : 15 / centre antipoison, NAC précoce." },

    /* ---------- Diagnostic ---------- */
    { id: "diagnostic-1", deck: "diagnostic", q: "Repères adulte : pression artérielle ?", a: "≈ <strong>120/80 mmHg</strong> ; HTA si <strong>≥ 140/90</strong> (valeurs répétées)." },
    { id: "diagnostic-2", deck: "diagnostic", q: "Glycémie à jeun : repère usuel ?", a: "≈ <strong>0,7 – 1,1 g/L</strong> (lecteur capillaire)." },
    { id: "diagnostic-3", deck: "diagnostic", q: "Température et saturation en O₂ : repères ?", a: "T° ≈ <strong>37 °C</strong> ; fièvre &gt; <strong>38 °C</strong>.<br>SpO₂ (oxymètre) ≈ <strong>95 – 100 %</strong>." },
    { id: "diagnostic-4", deck: "diagnostic", q: "Formule de l'IMC et zones usuelles ?", a: "<code>IMC = poids (kg) / taille² (m²)</code>.<br>&lt; 18,5 maigreur · 18,5–25 normal · 25–30 surpoids · ≥ 30 obésité." },
    { id: "diagnostic-5", deck: "diagnostic", q: "IMC de 80 kg pour 1,60 m ?", a: "80 / 1,60² = 80 / 2,56 ≈ <strong>31,3</strong> → obésité." },
    { id: "diagnostic-6", deck: "diagnostic", q: "IMC de 70 kg pour 1,75 m ?", a: "70 / 1,75² = 70 / 3,06 ≈ <strong>22,9</strong> → corpulence normale." },
    { id: "diagnostic-7", deck: "diagnostic", q: "TROD : que signifie le sigle ? Intérêt du TROD angine ?", a: "<strong>T</strong>est <strong>R</strong>apide d'<strong>O</strong>rientation <strong>D</strong>iagnostique. Angine : recherche du streptocoque A → <strong>éviter un antibiotique inutile</strong> si l'angine est virale." },
    { id: "diagnostic-8", deck: "diagnostic", q: "Test de grossesse : que détecte-t-il ? Négatif précoce ?", a: "L'hormone <strong>hCG</strong> dans les urines. Un négatif très précoce n'exclut pas une grossesse : refaire quelques jours plus tard (urines du matin) ou consulter." },
    { id: "diagnostic-9", deck: "diagnostic", q: "Bandelette urinaire : leucocytes + nitrites positifs ?", a: "Évoque une <strong>infection urinaire</strong>." },
    { id: "diagnostic-10", deck: "diagnostic", q: "Bandelette urinaire : glucose, protéines, corps cétoniques ?", a: "Glucose → hyperglycémie/diabète. Protéines → atteinte rénale possible. Corps cétoniques → jeûne prolongé ou diabète déséquilibré." },
    { id: "diagnostic-11", deck: "diagnostic", q: "Bon usage d'une bandelette urinaire ?", a: "Respecter le <strong>temps de lecture</strong>, urines <strong>fraîches</strong>, interpréter dans le contexte clinique (orientation seulement)." },
    { id: "diagnostic-12", deck: "diagnostic", q: "Dispositif médical vs médicament ? Marquage CE ?", a: "L'action principale du DM n'est <strong>pas pharmacologique</strong> (tensiomètre, pansement…). Le <strong>marquage CE</strong> atteste sa conformité aux exigences de sécurité." },
    { id: "diagnostic-13", deck: "diagnostic", q: "Mesures répétées à 150/95 mmHg : que faire au comptoir ?", a: "Évoque une HTA mais <strong>pas de diagnostic au comptoir</strong> : conseiller une consultation médicale." }
  ];

  var P = window.PHARMA = window.PHARMA || {};
  var CUSTOM_KEY = "pharma-flashcards-custom";

  P.customCards = function () {
    var l;
    try { l = JSON.parse(localStorage.getItem(CUSTOM_KEY)); } catch (e) { l = null; }
    return Array.isArray(l) ? l.filter(function (c) { return c && c.id && c.q && c.a; }) : [];
  };
  P.allCards = function () { return window.PHARMA_CARDS.concat(P.customCards()); };
  P.cardsDue = function () {
    var st;
    try { st = JSON.parse(localStorage.getItem((P.K && P.K.cards) || "pharma-flashcards")) || {}; } catch (e) { st = {}; }
    var today = Math.floor(Date.now() / 86400000), n = 0;
    P.allCards().forEach(function (c) { if (!st[c.id] || (st[c.id].due || 0) <= today) n++; });
    return n;
  };
})();
