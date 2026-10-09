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

Aucune étape de build : ce sont des fichiers statiques.

## Lancer en local

```bash
python3 -m http.server 8080
# puis http://localhost:8080
```

## Déploiement

Publié avec GitHub Pages depuis la branche `main` (dossier racine). Pour un
domaine personnalisé, ajouter un fichier `CNAME` contenant par exemple
`jolicomptoir.fr`, puis configurer le DNS.

## Licence

Code sous licence MIT (voir `LICENSE`).
