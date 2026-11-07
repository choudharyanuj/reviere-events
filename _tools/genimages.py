"""Generate the site's event photography with OpenAI gpt-image-2. Reads OPENAI_API_KEY from env.
Usage: python genimages.py <out_dir> [names...]"""
import base64, json, os, sys, urllib.request
from concurrent.futures import ThreadPoolExecutor

OUT = sys.argv[1]
os.makedirs(OUT, exist_ok=True)
STYLE = (
    " Cinematic night photography on a full-frame camera with a 35mm lens: rich deep blacks, saturated hot pink, "
    "magenta and amber accent lighting with a hint of violet, atmospheric haze, crisp detail, editorial luxury event "
    "photography set in India. Any people appear only as silhouettes or from behind with faces not visible. "
    "No text, no lettering, no logos, no watermarks."
)
SHOTS = {
    'wedding': ('1536x1024', "A grand Indian wedding mandap stage at night inside a palace-style banquet hall: lush marigold and pink rose florals, cascading crystal chandeliers, draped blush fabric, an aisle lined with candles, warm amber uplights mixed with a magenta wash. Empty, no people."),
    'sangeet': ('1024x1536', "Sangeet night stage performance: two dancers mid-leap as backlit silhouettes, magenta and orange spotlights cutting through haze, confetti suspended in the air, shot from the audience at stage level."),
    'corporate': ('1024x1536', "A modern corporate summit stage: a huge curved LED wall glowing with an abstract violet-to-pink gradient, a sleek minimalist podium, a row of audience silhouettes seen from behind in the foreground, beams of light through haze."),
    'fest': ('1024x1536', "A university cultural festival main stage at night: crowd silhouettes with hands raised in the foreground, sweeping coloured light beams, LED towers, streamers and confetti, high energy."),
    'party': ('1536x1024', "An elegant private birthday celebration set up indoors: a sculptural balloon arch in hot pink, blush and chrome gold, a long candlelit dining table with floral runners, soft neon glow, warm bokeh. No people."),
    'destination': ('1536x1024', "A heritage palace courtyard at blue hour prepared for an outdoor destination event: rows of lanterns, fairy lights, flowing drapes, a long reflecting pool mirroring the lights, marigold accents. No people."),
    'transport': ('1536x1024', "A vintage white convertible decorated with marigold garlands and roses for an Indian wedding, parked on a palace driveway at night under string lights, glossy reflections. No people, no number plate."),
    'security': ('1536x1024', "The entrance of an exclusive night event: professional security staff in black suits seen from behind beside a walk-through metal detector and velvet ropes, coloured uplights on the venue facade, guests as blurred silhouettes."),
}
names = sys.argv[2:] or list(SHOTS)

def gen(name):
    size, prompt = SHOTS[name]
    body = json.dumps({'model': 'gpt-image-2', 'prompt': prompt + STYLE, 'size': size, 'quality': 'high', 'n': 1, 'output_format': 'png'}).encode()
    req = urllib.request.Request('https://api.openai.com/v1/images/generations', data=body,
                                 headers={'Authorization': f"Bearer {os.environ['OPENAI_API_KEY']}", 'Content-Type': 'application/json'})
    try:
        with urllib.request.urlopen(req, timeout=300) as r:
            d = json.load(r)
        with open(f'{OUT}/{name}.png', 'wb') as f:
            f.write(base64.b64decode(d['data'][0]['b64_json']))
        return f'{name}: ok'
    except urllib.error.HTTPError as e:
        return f'{name}: HTTP {e.code} {e.read()[:300]!r}'
    except Exception as e:
        return f'{name}: {e}'

with ThreadPoolExecutor(4) as ex:
    for line in ex.map(gen, names):
        print(line, flush=True)
