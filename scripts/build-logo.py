"""Génère le logo Joli Comptoir : sac de boutique au cœur découpé, ourlet cousu, nom vectorisé."""
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
import sys

FONT = __import__('pathlib').Path(__file__).resolve().parent.parent / 'assets/fonts/familjen-grotesk.woff2'
INK, ATELIER, WHITE = '#15171a', '#2a36b8', '#ffffff'

font = TTFont(FONT)
inst = instantiateVariableFont(font, {'wght': 700})
gs = inst.getGlyphSet()
cmap = inst.getBestCmap()
upem = inst['head'].unitsPerEm
hmtx = inst['hmtx']

# Crénage simple tiré de la table GPOS (paires de glyphes) si disponible
def kern_pairs():
    pairs = {}
    try:
        gpos = inst['GPOS'].table
        for lookup in gpos.LookupList.Lookup:
            if lookup.LookupType != 2: continue
            for st in lookup.SubTable:
                if st.Format == 1:
                    cov = st.Coverage.glyphs
                    for i, first in enumerate(cov):
                        for pvr in st.PairSet[i].PairValueRecord:
                            v = pvr.Value1.XAdvance if pvr.Value1 and hasattr(pvr.Value1, 'XAdvance') else 0
                            if v: pairs[(first, pvr.SecondGlyph)] = v
                elif st.Format == 2:
                    cov = st.Coverage.glyphs
                    cd1 = st.ClassDef1.classDefs; cd2 = st.ClassDef2.classDefs
                    for first in cov:
                        c1 = cd1.get(first, 0)
                        for second in set(cmap.values()):
                            c2 = cd2.get(second, 0)
                            rec = st.Class1Record[c1].Class2Record[c2]
                            v = rec.Value1.XAdvance if rec.Value1 and hasattr(rec.Value1, 'XAdvance') else 0
                            if v: pairs.setdefault((first, second), v)
    except Exception as e:
        print('kern ignoré:', e, file=sys.stderr)
    return pairs
KERN = kern_pairs()

def text_paths(text, size, x0, baseline, tracking=-0.012):
    """Retourne (paths, largeur, position du i sans point)."""
    scale = size / upem
    x = x0
    out, dotless = [], []
    names = [cmap[ord(c)] if c != 'ı' else 'dotlessi' for c in text]
    for i, name in enumerate(names):
        if text[i] != ' ':
            pen = SVGPathPen(gs)
            tpen = TransformPen(pen, (scale, 0, 0, -scale, x, baseline))
            gs[name].draw(tpen)
            out.append(pen.getCommands())
            if name == 'dotlessi':
                adv = hmtx[name][0] * scale
                dotless.append(x + adv / 2)
        adv = hmtx[name][0] * scale
        k = KERN.get((name, names[i + 1]), 0) * scale if i + 1 < len(names) else 0
        x += adv + k + tracking * size
    return out, x - x0, dotless

# Cœur unitaire : pointe en bas, centré sur (0, 0), environ 2 x 1,8
HEART = ('M0 0.78 C-1.25 -0.05 -1.15 -1 -0.52 -1 C-0.18 -1 0 -0.78 0 -0.6 '
         'C0 -0.78 0.18 -1 0.52 -1 C1.15 -1 1.25 -0.05 0 0.78 Z')

# Sac de boutique dans une boîte de 64 : corps trapézoïdal aux angles adoucis
BAG = ('M17.5 22 H46.5 Q49.6 22 50.1 25.1 L54.6 53.6 Q55.3 58 50.9 58 H13.1 '
       'Q8.7 58 9.4 53.6 L13.9 25.1 Q14.4 22 17.5 22 Z')


def emblem(color=ATELIER, uid='jc'):
    """Le sac : anse, œillets, ourlet cousu et cœur découpés dans le flanc gauche."""
    return f'''<defs><mask id="{uid}-cut" maskUnits="userSpaceOnUse" x="0" y="0" width="64" height="64">
  <rect width="64" height="64" fill="#fff"/>
  <path d="{HEART}" transform="translate(18.5 47.2) rotate(-20) scale(11.2)" fill="#000"/>
  <circle cx="24" cy="31.2" r="2.2" fill="#000"/><circle cx="40" cy="31.2" r="2.2" fill="#000"/>
  <path d="M18 25.8 H46" stroke="#000" stroke-width="1.5" stroke-dasharray="2.4 2.2" stroke-linecap="round"/>
</mask></defs>
<path d="M24.5 23 V16.5 a7.5 7.5 0 0 1 15 0 V23" fill="none" stroke="{color}" stroke-width="4.4" stroke-linecap="round"/>
<path d="{BAG}" fill="{color}" mask="url(#{uid}-cut)"/>'''


def idot(x, y, r, color=ATELIER):
    # point du i : un petit cœur, comme celui du sac
    return f'<path d="{HEART}" transform="translate({x:.2f} {y:.2f}) scale({r:.2f})" fill="{color}"/>'


def svg(w, h, body, title='Joli Comptoir'):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w:.0f} {h:.0f}" role="img" aria-label="{title}"><title>{title}</title>{body}</svg>\n'


def wordmark(size, x0, baseline, ink, accent):
    paths, width, dots = text_paths('Jolı Comptoir', size, x0, baseline)
    body = f'<path d="{" ".join(paths)}" fill="{ink}"/>'
    xh = inst['OS/2'].sxHeight * size / upem
    for dx in dots:
        body += idot(dx, baseline - xh - size * 0.16, size * 0.095, accent)
    return body, width


def lockup(ink=INK, accent=ATELIER):
    """Version horizontale : sac à gauche, nom à droite (en-tête du site)."""
    words, width = wordmark(44, 70, 47, ink, accent)
    return svg(70 + width + 4, 64, f'<g transform="translate(-2 0)">{emblem(accent)}</g>' + words)


def stacked(ink=INK, accent=ATELIER):
    """Version empilée : sac au-dessus du nom, centrés (couverture, signature)."""
    size = 52
    words, width = wordmark(size, 0, 0, ink, accent)
    w = width + 8
    scale = 2.1
    bag = f'<g transform="translate({w / 2 - 32 * scale:.2f} 0) scale({scale})">{emblem(accent)}</g>'
    txt = f'<g transform="translate(4 {64 * scale + 46})">{words}</g>'
    return svg(w, 64 * scale + 58, bag + txt)


def mark(accent=ATELIER, bg=None):
    body = ''
    if bg:
        body += f'<rect width="64" height="64" rx="14" fill="{bg}"/><g transform="translate(5.5 2) scale(.83)">{emblem(accent)}</g>'
    else:
        body += emblem(accent)
    return svg(64, 64, body)


out = sys.argv[1]
open(f'{out}/logo.svg', 'w').write(lockup())
open(f'{out}/logo-blanc.svg', 'w').write(lockup(ink=WHITE, accent=WHITE))
open(f'{out}/logo-empile.svg', 'w').write(stacked())
open(f'{out}/logo-empile-blanc.svg', 'w').write(stacked(ink=WHITE, accent=WHITE))
open(f'{out}/logo-embleme.svg', 'w').write(mark())
open(f'{out}/favicon.svg', 'w').write(mark())
open(f'{out}/app-icon.svg', 'w').write(mark(accent=WHITE, bg=ATELIER))
print('ok', len(KERN), 'paires de crénage')
