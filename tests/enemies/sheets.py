"""Compose labeled native diagnostic frames, including a grayscale art review."""
import json
import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageOps

root = Path(sys.argv[1] if len(sys.argv) > 1 else 'verification/current/bestiary')
out = Path('docs/enemies/evidence')
font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 18)
small = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 14)
families = ['goblin', 'soldier', 'elite', 'crawler', 'maw', 'wraith', 'other']
for pose in ['idle', 'attack', 'death', 'lost']:
    sheet = Image.new('RGB', (1500, 80 + 7 * 455), '#edf1ed')
    draw = ImageDraw.Draw(sheet)
    draw.text((20, 18), 'BLOODLINE LEGACY / 31 HOSTILE FORMS + 2 NEUTRAL CREATURES', font=font, fill='#303a32')
    draw.text((20, 48), 'Native EGL diagnostic | ' + pose + ' | Actual game geometry/shaders; not a browser capture', font=small, fill='#536457')
    for row, family in enumerate(families):
        y = 80 + row * 455
        frame = Image.open(root / (family + '-' + pose + '.png')).convert('RGB')
        sheet.paste(frame.crop((0, 100, 1500, 500)), (0, y + 25))
        draw.text((20, y + 4), family.upper(), font=small, fill='#303a32')
        directory = root / (family + '-' + pose)
        forms = json.loads((directory / 'report.json').read_text())['forms']
        vp = json.loads((directory / 'scene.json').read_text())['vp']
        for index, form in enumerate(forms):
            x, z = (index - (len(forms) - 1) / 2) * 4.4, -34
            px = (vp[0] * x + vp[8] * z + vp[12] + 1) * 750
            label = form['id']
            draw.text((px - draw.textlength(label, font=small) / 2, y + 430), label, font=small, fill='#303a32')
    sheet.save(out / ('bestiary-' + pose + '.jpg'), quality=85, optimize=True)
    if pose == 'idle':
        ImageOps.grayscale(sheet).save(out / 'bestiary-silhouettes.jpg', quality=85, optimize=True)
