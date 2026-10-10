// Assemble les pages multilingues : sélecteur de langue, liens hreflang,
// chemins vers assets/ et plan du site. Sans dépendance : `npm run build`.
//
// Le français est à la racine, chaque autre langue dans son dossier, avec les
// mêmes noms de fichiers. Le script réécrit le contenu entre les marqueurs
// <!-- i18n:head --> et <!-- i18n:langues --> : il peut tourner autant de fois
// que nécessaire.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://jolicomptoir.com';

export const LANGS = [
  { code: 'fr', dir: '', hreflang: 'fr', name: 'Français', flag: 'fr', label: 'Langue' },
  { code: 'en', dir: 'en', hreflang: 'en', name: 'English', flag: 'gb', label: 'Language' },
  { code: 'es', dir: 'es', hreflang: 'es', name: 'Español', flag: 'es', label: 'Idioma' },
  { code: 'de', dir: 'de', hreflang: 'de', name: 'Deutsch', flag: 'de', label: 'Sprache' },
  { code: 'it', dir: 'it', hreflang: 'it', name: 'Italiano', flag: 'it', label: 'Lingua' },
  { code: 'pt', dir: 'pt', hreflang: 'pt', name: 'Português', flag: 'pt', label: 'Idioma' },
  { code: 'zh', dir: 'zh', hreflang: 'zh-Hans', name: '中文', flag: 'cn', label: '语言' },
];

const PAGES = ['index.html', 'materiel.html', 'mentions-legales.html', 'confidentialite.html', 'cgv.html'];

const url = (lang, page) => `${SITE}/${lang.dir ? `${lang.dir}/` : ''}${page === 'index.html' ? '' : page}`;
const rel = (from, to, page) => {
  const up = from.dir ? '../' : '';
  return `${up}${to.dir ? `${to.dir}/` : ''}${page}`;
};

function headBlock(lang, page) {
  const links = LANGS.filter((l) => existsSync(join(ROOT, l.dir, page)))
    .map((l) => `  <link rel="alternate" hreflang="${l.hreflang}" href="${url(l, page)}">`);
  links.push(`  <link rel="alternate" hreflang="x-default" href="${url(LANGS[0], page)}">`);
  return `<!-- i18n:head -->\n  <link rel="canonical" href="${url(lang, page)}">\n${links.join('\n')}\n  <!-- /i18n:head -->`;
}

function selector(lang, page) {
  const up = lang.dir ? '../' : '';
  const items = LANGS.filter((l) => existsSync(join(ROOT, l.dir, page))).map((l) => {
    const current = l.code === lang.code ? ' aria-current="true"' : '';
    return `          <li><a href="${rel(lang, l, page)}" hreflang="${l.hreflang}" lang="${l.hreflang}"${current}><img class="drapeau" src="${up}assets/flags/${l.flag}.svg" alt="" width="22" height="22">${l.name}</a></li>`;
  });
  return `<!-- i18n:langues -->
      <div class="langues" data-langues>
        <button type="button" class="langue-btn" aria-expanded="false" aria-controls="langues-menu" aria-label="${lang.label} : ${lang.name}">
          <img class="drapeau" src="${up}assets/flags/${lang.flag}.svg" alt="" width="24" height="24">
          <span>${lang.code.toUpperCase()}</span>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>
        </button>
        <ul class="langues-menu" id="langues-menu" hidden>
${items.join('\n')}
        </ul>
      </div>
      <!-- /i18n:langues -->`;
}

const between = (html, tag, block) => {
  const re = new RegExp(`<!-- i18n:${tag} -->[\\s\\S]*?<!-- /i18n:${tag} -->`);
  if (!re.test(html)) throw new Error(`marqueur i18n:${tag} absent`);
  return html.replace(re, block);
};

// Empreinte du contenu ajoutée à l'adresse de la feuille de style et du script :
// dès qu'un fichier change, son adresse change et le navigateur le recharge.
const stamp = (name) => createHash('sha256').update(readFileSync(join(ROOT, 'assets', name))).digest('hex').slice(0, 8);
const STAMPS = { 'style.css': stamp('style.css'), 'app.js': stamp('app.js') };
const stamped = (html) => html.replace(/(assets\/(style\.css|app\.js))(\?v=[0-9a-f]+)?"/g, (_, path, name) => `${path}?v=${STAMPS[name]}"`);

let count = 0;
for (const lang of LANGS) {
  for (const page of PAGES) {
    const file = join(ROOT, lang.dir, page);
    if (!existsSync(file)) continue;
    let html = readFileSync(file, 'utf8');
    html = html.replace(/<html lang="[^"]*"/, `<html lang="${lang.hreflang}"`);
    html = between(html, 'head', headBlock(lang, page));
    html = between(html, 'langues', selector(lang, page));
    if (lang.dir) {
      // Les pages traduites pointent vers les fichiers communs de la racine
      html = html.replace(/(src|href|srcset)="assets\//g, '$1="../assets/');
    }
    html = stamped(html);
    writeFileSync(file, html);
    count++;
  }
}

// Plan du site avec les alternatives de langue
const entries = PAGES.flatMap((page) => LANGS.filter((l) => existsSync(join(ROOT, l.dir, page))).map((lang) => {
  const alts = LANGS.filter((l) => existsSync(join(ROOT, l.dir, page)))
    .map((l) => `    <xhtml:link rel="alternate" hreflang="${l.hreflang}" href="${url(l, page)}"/>`).join('\n');
  return `  <url>\n    <loc>${url(lang, page)}</loc>\n${alts}\n  </url>`;
}));
writeFileSync(join(ROOT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries.join('\n')}
</urlset>
`);

console.log(`${count} pages assemblées, sitemap.xml à jour`);
