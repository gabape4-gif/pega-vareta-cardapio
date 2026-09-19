// Busca uma imagem real para CADA item do cardapio em buscador de imagens da web,
// baixa, normaliza em 800x600 e reescreve os src do index.html para arquivos locais.
// Regra: nenhuma imagem repetida entre itens.
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const crypto = require('crypto');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const IMG_DIR = path.join(__dirname, 'images');
const HTML = path.join(__dirname, 'index.html');

// contexto de busca por secao
const SUFIXO = {
  entradas: 'prato porcao restaurante',
  regionais: 'prato comida nordestina',
  sofisticados: 'prato gastronomia restaurante',
  internacionais: 'prato restaurante',
  bebidas: 'bebida copo',
  coqueteis: 'drink coquetel copo',
  vinhos: 'garrafa vinho',
  sobremesas: 'sobremesa prato',
};

// termos melhores que o nome cru do item
const OVERRIDE = {
  'Smash Burger Pega Vareta': 'smash burger hamburguer',
  'Ancho Steak 400g': 'bife ancho grelhado',
  'Tabua de Frios Artesanal': 'tabua de frios queijos embutidos',
  'Refrigerante': 'refrigerante copo com gelo',
  'Cha Gelado': 'cha gelado copo',
  'Bode Guisado do Agreste': 'bode guisado',
  'Rubacao Paraibano': 'rubacao paraibano comida',
  'Chambaril com Pirao': 'chambaril ossobuco com pirao',
  'Carre de Cordeiro': 'carre de cordeiro prato',
  'Magret de Pato': 'magret de pato prato',
  'Lombo com Reducao de Jabuticaba': 'lombo suino fatiado molho',
  'Casillero del Diablo': 'garrafa vinho casillero del diablo',
  'Malbec Alamos': 'garrafa vinho alamos malbec',
  'Chianti Classico': 'garrafa vinho chianti classico',
  'Pinot Noir Reserve': 'garrafa vinho pinot noir',
  'Amarone della Valpolicella': 'garrafa vinho amarone della valpolicella',
  'Sauvignon Blanc': 'garrafa vinho sauvignon blanc',
  'Chardonnay Santa Rita': 'garrafa vinho santa rita chardonnay',
  'Rose Whispering Angel': 'garrafa vinho whispering angel rose',
  'Prosecco DOC': 'garrafa prosecco doc',
  'Chandon Brut Rose': 'garrafa chandon brut rose',
  'Moet et Chandon': 'garrafa moet chandon champagne',
  'Veuve Clicquot': 'garrafa veuve clicquot champagne',
  'Romeu e Julieta': 'romeu e julieta goiabada com queijo',
  'Cartola Pernambucana': 'cartola sobremesa banana queijo',
};

const slug = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '')
  .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

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
    if (/\.(jpe?g|png|webp)(\?|$)/i.test(u)) out.push(u);
  }
  return out;
}

function baixar(url, destino) {
  const tmp = path.join(IMG_DIR, '_tmp_raw');
  try {
    sh('curl', ['-s', '-L', '--max-time', '25', '-A', UA, '-o', tmp, url]);
  } catch { return null; }
  if (!fs.existsSync(tmp)) return null;
  const buf = fs.readFileSync(tmp);
  if (buf.length < 20000) { fs.unlinkSync(tmp); return null; }
  const hash = crypto.createHash('md5').update(buf).digest('hex');
  try {
    // 800x600 cobrindo o quadro, sem distorcer
    sh('ffmpeg', ['-y', '-loglevel', 'error', '-i', tmp,
      '-vf', 'scale=800:600:force_original_aspect_ratio=increase,crop=800:600',
      '-frames:v', '1', '-q:v', '4', destino], { stdio: 'pipe' });
  } catch { fs.unlinkSync(tmp); return null; }
  fs.unlinkSync(tmp);
  if (!fs.existsSync(destino) || fs.statSync(destino).size < 8000) return null;
  return hash;
}

let html = fs.readFileSync(HTML, 'utf8');

// itens na ordem do arquivo, com a secao em que estao
const itens = [];
let secao = 'entradas';
for (const linha of html.split('\n')) {
  const s = linha.match(/<section id="([a-z]+)"/);
  if (s) secao = s[1];
  const im = linha.match(/<img src="(https:\/\/images\.unsplash\.com[^"]*)" alt="([^"]+)"/);
  if (im) itens.push({ src: im[1], nome: im[2], secao });
}

const vistos = new Set();
const falhas = [];
let feitos = 0;

for (const item of itens) {
  const arquivo = slug(item.nome) + '.jpg';
  const destino = path.join(IMG_DIR, arquivo);
  const termo = OVERRIDE[item.nome] || `${item.nome} ${SUFIXO[item.secao] || 'prato'}`;
  const candidatos = buscar(termo);
  let ok = false;
  for (const url of candidatos.slice(0, 12)) {
    const hash = baixar(url, destino);
    if (!hash) continue;
    if (vistos.has(hash)) { continue; }   // nada de imagem repetida
    vistos.add(hash);
    ok = true;
    break;
  }
  if (ok) {
    html = html.split(`src="${item.src}" alt="${item.nome}"`).join(`src="images/${arquivo}" alt="${item.nome}"`);
    feitos++;
    console.log(`ok   ${item.nome} -> images/${arquivo}`);
  } else {
    falhas.push(item.nome);
    console.log(`FALHA ${item.nome}  (termo: ${termo})`);
  }
}

fs.writeFileSync(HTML, html);
console.log(`\n${feitos}/${itens.length} itens com imagem propria.`);
if (falhas.length) console.log('sem imagem:', falhas.join(', '));
