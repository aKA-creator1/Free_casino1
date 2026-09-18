import re
html = open('frontend/index.html', encoding='utf-8').read()
html_ids = set(re.findall(r'id="([^"]+)"', html))
js = open('frontend/js/app.js', encoding='utf-8').read()
js_ids = set(re.findall(r"\$\(['\"]([^'\"]+)['\"]\)", js))
missing = js_ids - html_ids
print("JS uses these IDs:", sorted(js_ids))
print("Missing from HTML:", sorted(missing) if missing else "NONE")
