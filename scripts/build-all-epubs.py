#!/usr/bin/env python3
"""Extract individual EPUB files for each method from the book."""

import zipfile
import os
import re
import uuid
import html

EPUB_SOURCE = "/Users/macbook/Downloads/kris_bejli-moj_produktivnij_god-1489135380.epub"
EXTRACT_DIR = "/tmp/epub_build_all"
OUTPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "public", "books")

CHAPTER_MAP = {
    'method-values': (['ch1-6.xhtml'], '1. С чего начать'),
    'method-highest-impact': (['ch1-7.xhtml'], '2. Не все задачи равноценны'),
    'method-rule-of-three': (['ch1-8.xhtml'], '3. Три задачи на день'),
    'method-biological-prime-time': (['ch1-9.xhtml'], '4. Готовность к биологическому пику'),
    'method-time-journal': (['ch1-17.xhtml'], '10. Лекция об энергии'),
    'method-procrastination-triggers': (['ch1-11.xhtml'], '5. Ищем подход к неприятным делам'),
    'method-future-self': (['ch1-12.xhtml'], '6. Познакомьтесь с самим собой… Из будущего'),
    'method-disconnect': (['ch1-13.xhtml'], '7. Почему интернет убивает продуктивность'),
    'method-work-less': (['ch1-16.xhtml'], '9. Работаем меньше'),
    'method-maintenance-day': (['ch1-18.xhtml'], '11. Наводим порядок в доме'),
    'method-shrink-tasks': (['ch1-20.xhtml'], '13. Сжатие неважного'),
    'method-eliminate-delegate': (['ch1-21.xhtml'], '14. Устранение неважного'),
    'method-brain-dump': (['ch1-23.xhtml'], '15. Дамп мозга'),
    'method-hot-spots': (['ch1-24.xhtml'], '16. Взгляд сверху'),
    'method-scatter-focus': (['ch1-25.xhtml'], '17. Высвобождаем ментальное пространство'),
    'method-attention-hijackers': (['ch1-27.xhtml'], '19. Угонщики внимания'),
    'method-singletasking': (['ch1-28.xhtml', 'ch1-29.xhtml'], '20. Искусство делать одновременно только одно дело'),
    'method-meditation': (['ch1-30.xhtml'], '21. Глава о медитации'),
    'method-food-energy': (['ch1-32.xhtml'], '22. Пополнение энергии'),
    'method-caffeine': (['ch1-33.xhtml'], '23. Воздействие напитков на уровень энергии'),
    'method-water': (['ch1-33.xhtml'], '23. Воздействие напитков на уровень энергии'),
    'method-exercise': (['ch1-34.xhtml'], '24. Таблетка, заменяющая физические упражнения'),
    'method-sleep': (['ch1-35.xhtml'], '25. Сон как путь к продуктивности'),
    'method-breaks': (['ch1-38.xhtml'], '26. Заключительный шаг – Будьте добры к себе'),
    'method-gratitude': (['ch1-38.xhtml'], '26. Заключительный шаг – Будьте добры к себе'),
}

STYLE_CSS = '''
@charset "UTF-8";
body {
  font-family: Georgia, "Times New Roman", serif;
  line-height: 1.7;
  margin: 1.5em;
  color: #1a1a1a;
  max-width: 40em;
}
h1 { font-size: 1.5em; margin-bottom: 0.3em; line-height: 1.3; }
h2 { font-size: 1.2em; margin-top: 2em; margin-bottom: 0.5em; }
p { margin: 0.8em 0; text-align: justify; }
.meta { font-style: italic; color: #555; margin-bottom: 1.5em; }
.summary {
  background: #f5f5f0; padding: 1em 1.2em;
  border-left: 3px solid #888; margin: 1.2em 0;
}
blockquote {
  background: #f9f9f5; padding: 0.8em 1.2em;
  border-left: 3px solid #aaa; margin: 1.2em 0; font-style: italic;
}
hr { border: none; border-top: 1px solid #ccc; margin: 2em 0; }
ul, ol { padding-left: 1.5em; }
li { margin: 0.3em 0; }
em { font-style: italic; }
strong { font-weight: bold; }
.subtitle { font-weight: bold; margin-top: 1.5em; }
'''


def extract_epub():
    os.makedirs(EXTRACT_DIR, exist_ok=True)
    with zipfile.ZipFile(EPUB_SOURCE, 'r') as z:
        z.extractall(EXTRACT_DIR)


def read_chapter(filename):
    path = os.path.join(EXTRACT_DIR, 'OPS', filename)
    with open(path, 'r', encoding='utf-8') as f:
        return f.read()


def extract_body(xhtml_content):
    """Extract body content, clean up markup."""
    body_match = re.search(r'<body[^>]*>(.*?)</body>', xhtml_content, re.DOTALL)
    if not body_match:
        return ''
    content = body_match.group(1)

    # Remove all span wrappers
    content = re.sub(r'</?span[^>]*>', '', content)

    # Convert div.title6 > p to h2
    content = re.sub(
        r'<div class="title6">\s*<p class="p">(.*?)</p>\s*</div>',
        r'<h2>\1</h2>',
        content
    )

    # Convert div.annotation to div.summary
    content = re.sub(r'<div class="annotation">', '<div class="summary">', content)

    # Convert div.cite to blockquote
    content = re.sub(r'<div class="cite">', '<blockquote>', content)
    content = re.sub(r'</div>', '', content)

    # Clean up paragraph classes
    content = re.sub(r'<p class="p1?">', '<p>', content)
    content = re.sub(r'<p class="empty-line"\s*/>', '<br/>', content)
    content = re.sub(r'<p class="subtitle">', '<p class="subtitle">', content)

    # Remove footnote links
    content = re.sub(r'<a[^>]*class="a"[^>]*>\[?\d+\]?</a>', '', content)

    # Close unclosed blockquotes before next h2
    # (the original uses div.cite which may not be properly closed)
    lines = content.split('\n')
    result = []
    in_blockquote = False
    for line in lines:
        if '<blockquote>' in line:
            if in_blockquote:
                result.append('</blockquote>')
            in_blockquote = True
        if '<h2>' in line and in_blockquote:
            result.append('</blockquote>')
            in_blockquote = False
        result.append(line)
    if in_blockquote:
        result.append('</blockquote>')

    return '\n'.join(result)


def build_epub(method_id, chapter_files, chapter_title):
    uid = str(uuid.uuid4())

    # Combine content from all chapter files
    body_parts = []
    for f in chapter_files:
        raw = read_chapter(f)
        body = extract_body(raw)
        body_parts.append(body)

    combined_body = '\n<hr/>\n'.join(body_parts)

    # Build first h2 into h1
    combined_body = combined_body.replace('<h2>', '<h1>', 1).replace('</h2>', '</h1>', 1)

    chapter_xhtml = f'''<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="ru">
<head>
  <title>{html.escape(chapter_title)}</title>
  <link rel="stylesheet" type="text/css" href="style.css"/>
</head>
<body>
<p class="meta">Из книги: «Мой продуктивный год» – Крис Бейли (2016)</p>
{combined_body}
</body>
</html>'''

    content_opf = f'''<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="uid" version="3.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="uid">urn:uuid:{uid}</dc:identifier>
    <dc:title>{html.escape(chapter_title)}</dc:title>
    <dc:creator>Крис Бейли</dc:creator>
    <dc:language>ru</dc:language>
    <dc:source>Мой продуктивный год (2016)</dc:source>
    <meta property="dcterms:modified">2026-02-18T00:00:00Z</meta>
  </metadata>
  <manifest>
    <item id="chapter" href="chapter.xhtml" media-type="application/xhtml+xml"/>
    <item id="style" href="style.css" media-type="text/css"/>
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
  </manifest>
  <spine>
    <itemref idref="chapter"/>
  </spine>
</package>'''

    nav_xhtml = f'''<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="ru">
<head><title>Навигация</title></head>
<body>
<nav epub:type="toc">
  <ol><li><a href="chapter.xhtml">{html.escape(chapter_title)}</a></li></ol>
</nav>
</body>
</html>'''

    container_xml = '''<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>'''

    out_path = os.path.join(OUTPUT_DIR, f'{method_id}.epub')
    with zipfile.ZipFile(out_path, 'w', zipfile.ZIP_DEFLATED) as zf:
        zf.writestr('mimetype', 'application/epub+zip', compress_type=zipfile.ZIP_STORED)
        zf.writestr('META-INF/container.xml', container_xml)
        zf.writestr('OEBPS/content.opf', content_opf)
        zf.writestr('OEBPS/style.css', STYLE_CSS)
        zf.writestr('OEBPS/nav.xhtml', nav_xhtml)
        zf.writestr('OEBPS/chapter.xhtml', chapter_xhtml)

    size_kb = os.path.getsize(out_path) / 1024
    print(f'  {method_id}.epub ({size_kb:.0f} KB)')


if __name__ == '__main__':
    print('extracting epub...')
    extract_epub()

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    print(f'generating {len(CHAPTER_MAP)} epub files to {OUTPUT_DIR}/')

    for method_id, (files, title) in CHAPTER_MAP.items():
        build_epub(method_id, files, title)

    total_size = sum(
        os.path.getsize(os.path.join(OUTPUT_DIR, f))
        for f in os.listdir(OUTPUT_DIR) if f.endswith('.epub')
    ) / 1024
    print(f'\ndone! total: {total_size:.0f} KB ({len(CHAPTER_MAP)} files)')
