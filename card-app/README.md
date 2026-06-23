# Cartes de visite numériques — Way2tech.ai

Application web **100 % gratuite et sans serveur** permettant à chaque membre de
Way2tech.ai de créer, partager et imprimer sa carte de visite numérique avec
QR code. Un prospect scanne le QR, voit la carte, puis l'ajoute en un clic à son
carnet d'adresses (fichier vCard `.vcf` compatible iPhone, Android, Outlook,
Google Contacts).

## Comment ça marche

- **`index.html`** — l'éditeur. Le membre remplit ses informations et obtient :
  - un aperçu en direct de sa carte,
  - un **lien personnel** à partager,
  - un **QR code** à télécharger / imprimer (à mettre sur un badge, un email, etc.),
  - un fichier **`.vcf`** téléchargeable.
- **`card.html`** — la page publique. Ce que voit le prospect après avoir scanné
  le QR ou ouvert le lien. Bouton **« Ajouter à mes contacts »**, partage natif,
  et lien « Modifier cette carte » pour le propriétaire.

### Aucune base de données

Les informations de la carte sont **encodées directement dans le lien** (après le
`#`). Rien n'est envoyé sur un serveur, donc :

- hébergement gratuit (fichiers statiques),
- pas de coût de base de données, pas d'inscription,
- chaque membre « gère » sa carte en conservant son lien personnel (et peut le
  rouvrir dans l'éditeur pour le modifier).

> Le QR code est généré dans le navigateur. Si la petite librairie QR n'est pas
> disponible, l'application bascule automatiquement sur un service image gratuit.

## Cartes vérifiées (badge anti-usurpation)

Comme l'app est sans serveur, n'importe qui peut techniquement fabriquer un lien
à votre nom. Pour distinguer les **vraies** cartes Way2tech.ai, on utilise une
**signature cryptographique** (ECDSA P-256) :

- **`admin.html`** — console interne. Détient la **clé privée** (stockée
  localement dans le navigateur de l'admin) et **signe** les cartes officielles.
  Elle produit un lien vérifié + QR.
- **`assets/trust.js`** — contient la **clé publique** (sert seulement à
  vérifier, publiable sans risque).
- **`card.html`** — affiche le badge **« ✓ Membre vérifié Way2tech.ai »**
  uniquement si la signature est valide ; sinon un avertissement « carte non
  vérifiée ». Sans la clé privée, **impossible de forger un badge valide**.

### Mise en place (une seule fois)

1. Ouvrez `admin.html` → **Générer la clé de l'organisation**.
2. **Sauvegardez la clé privée** (bouton dédié) en lieu sûr, et ne la partagez
   jamais.
3. Copiez la **clé publique** affichée et collez-la dans `assets/trust.js`
   (`pubKey: "..."`), puis re-déployez.

### Émettre une carte vérifiée

1. Le membre remplit sa carte dans `index.html` et vous envoie son **lien
   brouillon** (ou vous saisissez ses infos directement).
2. Dans `admin.html`, importez le brouillon (ou remplissez le formulaire) →
   **Signer & générer** → vous obtenez le lien + QR vérifiés à lui transmettre.

> Tant que `pubKey` est vide dans `trust.js`, le badge est simplement inactif :
> les cartes restent affichables normalement, sans badge.

## Mise en ligne gratuite (GitHub Pages)

1. Dans le dépôt GitHub : **Settings → Pages**.
2. **Build and deployment → Source** : choisir **GitHub Actions**.
3. Fusionner sur `main` : le workflow `.github/workflows/deploy-card-app.yml`
   publie automatiquement le dossier `card-app/`.
4. L'éditeur sera accessible à :
   `https://<utilisateur>.github.io/<dépôt>/` (et les cartes via `card.html`).

## Tester en local

```bash
# depuis la racine du dépôt
python3 -m http.server 8080 --directory card-app
# puis ouvrir http://localhost:8080/
```

## Fichiers

| Fichier | Rôle |
|---|---|
| `index.html` | Éditeur / gestion de la carte |
| `card.html` | Page publique scannée par le prospect |
| `assets/card.js` | Encodage URL, génération vCard, rendu, QR |
| `assets/styles.css` | Mise en forme (charte verte Way2tech) |
