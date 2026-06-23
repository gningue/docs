# Cartes de visite numériques — Way2tech.au

Application web **100 % gratuite et sans serveur** permettant à chaque membre de
Way2tech.au de créer, partager et imprimer sa carte de visite numérique avec
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
