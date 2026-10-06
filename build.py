"""Bundle the modular source into one self-contained HTML file (dist/sakeenah.html)."""
import re, os
src = open('index.html', encoding='utf8').read()
css = open('src/styles.css', encoding='utf8').read()
src = src.replace('<link rel="stylesheet" href="src/styles.css">', '<style>\n' + css + '\n</style>')
def inline(m):
    return '<script>\n' + open(m.group(1), encoding='utf8').read() + '\n</script>'
src = re.sub(r'<script src="(src/[^"]+)"></script>', inline, src)
import base64, mimetypes
def media(m):
    path = m.group(1)
    if not os.path.exists(path): return m.group(0)          # documented placeholder, not a file yet
    mt = {'.mp4':'video/mp4','.vtt':'text/vtt','.webm':'video/webm','.mp3':'audio/mpeg','.m4a':'audio/mp4','.wav':'audio/wav','.jpg':'image/jpeg','.png':'image/png','.woff':'font/woff','.woff2':'font/woff2'}.get(os.path.splitext(path)[1], 'application/octet-stream')
    return "'data:" + mt + ";base64," + base64.b64encode(open(path,'rb').read()).decode() + "'"
src = re.sub(r"'(?:\.\./)?(assets/media/[^']+)'", media, src)   # '../assets' = the same file referenced from src/styles.css
os.makedirs('dist', exist_ok=True)
open('dist/sakeenah.html', 'w', encoding='utf8').write(src)
print('dist/sakeenah.html', len(src))
