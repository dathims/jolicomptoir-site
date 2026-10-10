# Joli Comptoir, site vitrine

Site de présentation de **Joli Comptoir**, la caisse des boutiques de
prêt-à-porter et du commerce de détail.

Le message n'est pas « voici un logiciel de caisse » mais « voici ce qui ne
vous freinera plus » : la file d'attente, les étiquettes écrites à la main, les
échanges bricolés, les soirées à recompter et la peur du contrôle fiscal.

## Contenu

- `index.html` : la page unique (hero « vitrine », journée type, démo, outils,
  données, contact).
- `assets/style.css` : toute la mise en forme, sans framework.
- `assets/app.js` : onglets de la journée, codes-barres EAN-13 générés, démo de
  caisse jouable (panier, chronomètre, ticket avec empreinte SHA-256).
- `assets/img/` : visuels générés par IA pour ce site.
- `assets/fonts/` : polices hébergées localement.
- `assets/logo*.svg`, `assets/favicon.svg`, `assets/app-icon.svg` : logo vectorisé (étiquette cousue et nom en Familjen Grotesk), généré par `scripts/build-logo.py`.
- `assets/flags/` : drapeaux du sélecteur de langue.
- `assets/img/logos/` : logos de marques tierces affichés dans la section « connexions ». Ils appartiennent à leurs détenteurs et sont exclus de la licence du site.
- `assets/img/gestes/` : les six scènes de comptoir, générées par IA.

Les pages sont statiques. Une seule étape assemble les langues :

```bash
npm run build   # sélecteur de langue, hreflang, chemins assets/ et sitemap.xml
npm run logo    # régénère les fichiers du logo depuis la police du site
```

## Langues

Français à la racine, puis `en/`, `es/`, `de/`, `it/`, `pt/` et `zh/`, avec les
mêmes noms de fichiers. Chaque page traduite garde les marqueurs
`<!-- i18n:head -->` et `<!-- i18n:langues -->` (remplis par `npm run build`)
et l'accueil porte un bloc `<script type="application/json" id="i18n">` pour
les textes de la démo et du comptoir animé (clés : objet `FR` d'`assets/app.js`).
Une modification du français doit être reportée dans les six traductions, puis
`npm run build`. Les pages légales traduites rappellent que seule la version
française fait foi.

## Lancer en local

```bash
python3 -m http.server 8080
# puis http://localhost:8080
```

## Déploiement

Publié sur https://jolicomptoir.com avec GitHub Pages, depuis la branche
`main` (dossier racine). Le fichier `CNAME` porte le domaine.

DNS chez Namecheap : quatre enregistrements A et quatre AAAA de GitHub Pages
sur `@`, un CNAME `www` vers `dathims.github.io`, et le TXT
`_github-pages-challenge-dathims` qui prouve que le domaine appartient au
compte GitHub. La redirection d'e-mails Namecheap (MX et SPF) est conservée.

## Pages légales

`materiel.html` est le catalogue du matériel proposé, sans prix (photos dans
`assets/img/materiel/`, issues des fabricants ou de revendeurs européens).

`mentions-legales.html`, `confidentialite.html` et `cgv.html` (conditions
générales de vente et de licence du logiciel). Éditeur : OXYGENE NUMERIQUE
(Oxynum). Le site ne dépose aucun cookie et n'appelle aucun service tiers : les
polices sont servies depuis `assets/fonts/`.

## Licence

Le code du site (HTML, CSS, JavaScript) est sous licence MIT (voir `LICENSE`).
Le nom Joli Comptoir, son logo, les textes et les visuels restent la propriété
d'OXYGENE NUMERIQUE et ne sont pas couverts par cette licence. Polices :
Familjen Grotesk et IBM Plex Mono, sous licence SIL Open Font License 1.1.

Les logos de `assets/img/logos/` sont des marques de sociétés tierces, citées
pour indiquer une compatibilité ou un connecteur réalisable. Ils restent la
propriété de leurs détenteurs, hors de cette licence, et sont retirés sur
simple demande de la marque.
