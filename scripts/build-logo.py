"""Génère le logo Joli Comptoir : emblème (étiquette cousue) + nom vectorisé."""
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
import sys

FONT = __import__('pathlib').Path(__file__).resolve().parent.parent / 'assets/fonts/familjen-grotesk.woff2'
INK, ATELIER, WHITE = '#000000', '#2a36b8', '#ffffff'

font = TTFont(FONT)
inst = instantiateVariableFont(font, {'wght': 640})
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

def emblem(cx, cy, s, color=ATELIER, stitch=WHITE, string=INK, rot=-14):
    """Étiquette cousue, centrée en (cx, cy), taille s (côté de la boîte 64)."""
    k = s / 64
    tag = ('M22 15 H50 Q56 15 56 21 V43 Q56 49 50 49 H22 Q20.4 49 19.2 47.9 '
           'L8.6 35.6 Q6.8 32 8.6 28.4 L19.2 16.1 Q20.4 15 22 15 Z')
    stitchp = ('M23.4 19.6 H49 Q51.6 19.6 51.6 22.2 V41.8 Q51.6 44.4 49 44.4 H23.4 '
               'L13.9 33.6 Q12.9 32 13.9 30.4 Z')
    return f'''<g transform="translate({cx - 32*k:.2f} {cy - 32*k:.2f}) scale({k:.4f}) rotate({rot} 32 32)">
  <path d="M18.6 32 C 14 26.5, 9.5 22.5, 6.8 15.5" fill="none" stroke="{string}" stroke-width="2.6" stroke-linecap="round"/>
  <path d="{tag}" fill="{color}"/>
  <path d="{stitchp}" fill="none" stroke="{stitch}" stroke-width="1.5" stroke-dasharray="2.6 2.4" stroke-linecap="round" opacity=".9"/>
  <circle cx="18.6" cy="32" r="3.4" fill="{stitch}"/>
</g>'''

def idot(x, y, r, color=ATELIER):
    # point du i : un petit losange arrondi, comme une étiquette vue de face
    return f'<rect x="{x - r:.2f}" y="{y - r:.2f}" width="{2*r:.2f}" height="{2*r:.2f}" rx="{r*0.45:.2f}" transform="rotate(45 {x:.2f} {y:.2f})" fill="{color}"/>'

def svg(w, h, body, title='Joli Comptoir'):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w:.0f} {h:.0f}" role="img" aria-label="{title}"><title>{title}</title>{body}</svg>\n'

def lockup(ink=INK, accent=ATELIER, stitch=WHITE, string=None):
    string = string or ink
    size = 46
    baseline = 47
    paths, width, dots = text_paths('Jolı Comptoir', size, 74, baseline)
    body = emblem(32, 32, 62, accent, stitch, string)
    body += f'<path d="{" ".join(paths)}" fill="{ink}"/>'
    xh = inst['OS/2'].sxHeight * size / upem
    for dx in dots:
        body += idot(dx, baseline - xh - 5.6, 3.5, accent)
    return svg(74 + width + 4, 64, body)

def mark(accent=ATELIER, stitch=WHITE, string=INK, bg=None):
    body = ''
    if bg:
        body += f'<rect width="64" height="64" rx="14" fill="{bg}"/>'
    body += emblem(33, 33, 58 if bg else 64, accent, stitch, string)
    return svg(64, 64, body)

out = sys.argv[1]
open(f'{out}/logo.svg', 'w').write(lockup())
open(f'{out}/logo-blanc.svg', 'w').write(lockup(ink=WHITE, accent=WHITE, stitch=ATELIER))
open(f'{out}/logo-embleme.svg', 'w').write(mark())
open(f'{out}/favicon.svg', 'w').write(mark(string=ATELIER))
open(f'{out}/app-icon.svg', 'w').write(mark(accent=WHITE, stitch=ATELIER, string=WHITE, bg=ATELIER))
print('ok', len(KERN), 'paires de crénage')
