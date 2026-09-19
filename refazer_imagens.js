// Refaz as imagens que sairam com marca d'agua de banco de imagem, foto de embalagem
// ou assunto errado. Mesma logica do buscar_imagens.js, com bloqueio de dominios de stock.
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const crypto = require('crypto');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const IMG_DIR = path.join(__dirname, 'images');

const BLOQUEADOS = /alamy|dreamstime|shutterstock|istockphoto|gettyimages|123rf|depositphotos|canstockphoto|vecteezy|stockfood|agefotostock|freepik|colourbox|pinimg\/originals\/.*\.gif/i;

const ALVOS = {
  'cocada-cremosa': 'cocada cremosa doce de coco tigela',
  'croquetes-de-bode': 'croquete de carne frito porcao aperitivo',
  'macaxeira-frita-com-charque': 'macaxeira frita com carne de sol porcao',
  'bruschetta-classica': 'bruschetta tomate manjericao entrada',
  'lombo-com-reducao-de-jabuticaba': 'lombo suino assado fatiado com molho prato restaurante',
  'fish-and-chips': 'fish and chips peixe empanado batata frita',
  'costela-bbq-texas-style': 'costela suina barbecue assada prato',
  'mojito-nordestino': 'mojito drink copo hortela limao',
  'espresso-martini': 'espresso martini drink taca',
  'amarone-della-valpolicella': 'amarone della valpolicella garrafa unica vinho tinto',
  'chardonnay-santa-rita': 'vinho chardonnay garrafa branca taca',
  'cerveja-long-neck': 'cerveja long neck garrafa gelada',
};

function sh(cmd, args, opts = {}) {
  return execFileSync(cmd, args, { encoding: 'buffer', maxBuffer: 1 << 28, ...opts });
}

function buscar(query) {
  const url = `https://www.bing.com/images/async?q=${encodeURIComponent(query)}&first=0&count=40&mmasync=1&qft=+filterui:imagesize-large+filterui:photo-photo`;
  let html;
  try {
    html = sh('curl', ['-s', '--max-time', '25', '-A', UA, '-H', 'Accept-Language: pt-BR,pt;q=0.9',
      '-H', 'Cookie: SRCHHPGUSR=SRCHLANG=pt', url]).toString('utf8');
  } catch { return []; }
  const out = [];
  const re = /murl&quot;:&quot;(.*?)&quot;/g;
  let m;
  while ((m = re.exec(html))) {
    const u = m[1].replace(/\\u0026/g, '&');
    if (/\.(jpe?g|png|webp)(\?|$)/i.test(u) && !BLOQUEADOS.test(u)) out.push(u);
  }
  return out;
}

function baixar(url, destino) {
  const tmp = path.join(IMG_DIR, '_tmp_raw');
  try { sh('curl', ['-s', '-L', '--max-time', '25', '-A', UA, '-o', tmp, url]); } catch { return null; }
  if (!fs.existsSync(tmp)) return null;
  const buf = fs.readFileSync(tmp);
  if (buf.length < 30000) { fs.unlinkSync(tmp); return null; }
  const hash = crypto.createHash('md5').update(buf).digest('hex');
  try {
    sh('ffmpeg', ['-y', '-loglevel', 'error', '-i', tmp,
      '-vf', 'scale=800:600:force_original_aspect_ratio=increase,crop=800:600',
      '-frames:v', '1', '-q:v', '4', destino], { stdio: 'pipe' });
  } catch { fs.unlinkSync(tmp); return null; }
  fs.unlinkSync(tmp);
  return fs.existsSync(destino) && fs.statSync(destino).size > 8000 ? hash : null;
}

// hashes do que ja esta no acervo, pra nao repetir
const existentes = new Set(fs.readdirSync(IMG_DIR).filter(f => f.endsWith('.jpg'))
  .map(f => crypto.createHash('md5').update(fs.readFileSync(path.join(IMG_DIR, f))).digest('hex')));

const pulo = Number(process.argv[2] || 0); // quantos candidatos ignorar no topo

for (const [arquivo, termo] of Object.entries(ALVOS)) {
  const destino = path.join(IMG_DIR, arquivo + '.jpg');
  const candidatos = buscar(termo).slice(pulo, pulo + 14);
  let ok = false;
  for (const url of candidatos) {
    if (!baixar(url, destino)) continue;
    const h = crypto.createHash('md5').update(fs.readFileSync(destino)).digest('hex');
    if (existentes.has(h)) continue;
    existentes.add(h);
    ok = true;
    console.log(`ok    ${arquivo} <- ${url.slice(0, 90)}`);
    break;
  }
  if (!ok) console.log(`FALHA ${arquivo}`);
}
