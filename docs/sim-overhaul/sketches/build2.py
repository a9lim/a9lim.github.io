# Assemble the proposal page from parts.  usage: python3 build2.py OUT.html [--only name,name]
import base64, json, os, re, sys
D = os.path.dirname(os.path.abspath(__file__))
SP = D  # seal.svg lives here; the screenshot thumbnails were not kept
out = sys.argv[1]
only = None
if '--only' in sys.argv: only = sys.argv[sys.argv.index('--only') + 1].split(',')
order = ['now', 'language', 'worldline', 'lumen', 'miasma', 'shoals', 'shared', 'order', 'decide']
legacy = {}
rd = lambda p: open(os.path.join(D, p)).read()
ex = lambda p: os.path.exists(os.path.join(D, p))
html = [rd('head.html'), '<main class="wrap">\n', rd('top.html')]
js = [rd('core.js')]
for name in order:
    if only and name not in only: continue
    html.append(rd(f'sec-{name}.html') if ex(f'sec-{name}.html') else rd(f'old-sec-{name}.html'))
    if ex(f'sk-{name}.js'): js.append(rd(f'sk-{name}.js'))
    else:
        for f, fn in legacy.get(name, []): js.append(rd(f) + f'\nINITS.push({fn});\n')
html.append('</main>\n<script>\n(() => {\n\'use strict\';\n' + '\n'.join(js) + rd('main.js') + '})();\n</script>\n')
page = ''.join(html)
page = page.replace('{{SEAL}}', open(os.path.join(SP, 'seal.svg')).read().strip())
page = re.sub(r'\{\{THUMB:([a-z-]+)\}\}', lambda m: ('data:image/jpeg;base64,' + base64.b64encode(open(os.path.join(SP, 'thumbs', m.group(1) + '.jpg'), 'rb').read()).decode()) if os.path.exists(os.path.join(SP, 'thumbs', m.group(1) + '.jpg')) else '', page)
open(out, 'w').write(page)
print(out, len(page))
