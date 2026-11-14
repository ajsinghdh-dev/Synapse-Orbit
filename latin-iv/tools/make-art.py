import sys, io, base64
from PIL import Image, ImageOps, ImageChops, ImageFilter
src, out, sp = sys.argv[1], sys.argv[2], sys.argv[3]
# name: (file, invert, black level, white level, max height)
spec = {'discobolus': ('3.png', False, 28, 215, 420), 'laocoon': ('4.png', False, 28, 215, 520),
        'krater': ('5.png', True, 40, 215, 420), 'head': ('6.png', False, 70, 235, 420)}
parts = []
for name, (f, inv, lo, hi, mh) in spec.items():
    rgb = Image.open(f'{src}/{f}').convert('RGB'); g = rgb.convert('L')
    if inv: g = ImageOps.invert(g)
    g = g.point(lambda v: max(0, min(255, int((v - lo) * 255 / (hi - lo)))))
    if name == 'head':   # warm marble on a neutral grey backdrop: cut the backdrop by colour
        r, _, bl = rgb.split(); m = ImageChops.subtract(r, bl).point(lambda v: 255 if v > 22 else 0).filter(ImageFilter.MedianFilter(9)).filter(ImageFilter.GaussianBlur(1.5))
        g = ImageChops.multiply(g, m)
    g = g.point(lambda v: (v // 24) * 24 if v < 240 else 255)   # posterise: engraving-like tone steps
    w, h = g.size; s = min(1, mh / h); g = g.resize((round(w * s), round(h * s)), Image.LANCZOS)
    im = Image.new('RGBA', g.size, (255, 255, 255, 0)); im.putalpha(g)
    b = io.BytesIO(); im.save(b, 'WEBP', lossless=True, quality=100, method=6)
    # preview on blue
    pv = Image.new('RGB', g.size, (20, 20, 245)); pv.paste(im, (0, 0), im); pv.save(f'{sp}/art/{name}.png')
    print(name, g.size, len(b.getvalue()) // 1024, 'KB')
    parts.append(f"  {name}: {{ w: {g.size[0]}, h: {g.size[1]}, src: 'data:image/webp;base64,{base64.b64encode(b.getvalue()).decode()}' }},")
open(out, 'w').write("// Alpha masks made from the owner's uploaded photographs of classical works (tone only; colour comes from CSS).\n// Generated — do not edit by hand.\nexport const ART = {\n" + "\n".join(parts) + "\n};\n")
