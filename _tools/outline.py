import sys, re
from html.parser import HTMLParser
SKIP={'script','style','noscript','head','svg'}
BLOCK={'h1','h2','h3','h4','h5','p','li','a','button','label','option','blockquote','span','div','section','img','strong','em','i','input','textarea','select','form','footer','nav','header'}
class P(HTMLParser):
    def __init__(s): super().__init__(); s.stack=[]; s.skip=0; s.buf=[]; s.out=[]
    def flush(s):
        t=re.sub(r'\s+',' ',''.join(s.buf)).strip()
        if t: s.out.append('  '*min(len(s.stack),12)+t)
        s.buf=[]
    def handle_starttag(s,tag,a):
        a=dict(a)
        if tag in SKIP: s.skip+=1; return
        if s.skip: return
        if tag in BLOCK or tag=='br':
            s.flush()
            meta=[]
            for k in ('class','id','href','src','alt','data-target','data-service','name','placeholder','type','value'):
                if a.get(k): meta.append(f'{k}={a[k][:90]}')
            if tag in ('h1','h2','h3','h4','h5','p','li','a','button','img','blockquote','section','input','textarea','select','option','form','label') or a.get('data-target'):
                s.out.append('  '*min(len(s.stack),12)+f'<{tag} '+' '.join(meta)+'>')
        if tag not in ('img','input','br','meta','link','hr'): s.stack.append(tag)
    def handle_endtag(s,tag):
        if tag in SKIP: s.skip=max(0,s.skip-1); return
        if s.skip: return
        if tag in BLOCK: s.flush()
        if s.stack and tag in s.stack:
            while s.stack and s.stack.pop()!=tag: pass
    def handle_data(s,d):
        if not s.skip: s.buf.append(d)
p=P(); p.feed(open(sys.argv[1],encoding='utf-8').read()); p.flush()
print('\n'.join(p.out))
