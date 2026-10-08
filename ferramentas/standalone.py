"""Gera docs/prototipo.html: a página do jogo num arquivo só (motor e demonstração embutidos), para abrir com dois cliques."""
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
WEB = RAIZ / "web"
html = (WEB / "index.html").read_text(encoding="utf-8")
for nome in ("demo.js", "motor.js"):
    tag = f'<script src="{nome}"></script>'
    assert tag in html, nome
    html = html.replace(tag, "<script>\n" + (WEB / nome).read_text(encoding="utf-8") + "\n</script>")
saida = RAIZ / "docs" / "prototipo.html"
saida.write_text(html, encoding="utf-8")
print(saida)
