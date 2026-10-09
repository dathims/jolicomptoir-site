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

Aucune étape de build : ce sont des fichiers statiques.

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

`mentions-legales.html`, `confidentialite.html` et `cgv.html` (conditions
générales de vente et de licence du logiciel). Éditeur : OXYGENE NUMERIQUE
(Oxynum). Le site ne dépose aucun cookie et n'appelle aucun service tiers : les
polices sont servies depuis `assets/fonts/`.

## Licence

Le code du site (HTML, CSS, JavaScript) est sous licence MIT (voir `LICENSE`).
Le nom Joli Comptoir, son logo, les textes et les visuels restent la propriété
d'OXYGENE NUMERIQUE et ne sont pas couverts par cette licence. Polices :
Familjen Grotesk et IBM Plex Mono, sous licence SIL Open Font License 1.1.
