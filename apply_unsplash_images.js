const fs = require('fs');
const path = require('path');

const file = path.join(process.cwd(), 'index.html');
let html = fs.readFileSync(file, 'utf8');

const pools = {
    wines: ['1510812431401-41d2bd2722f3', '1553361371-9b22f78e8b1d', '1586370434639-0fe43b2d32e6', '1566754436949-eb862ccc2ac6', '1547595628-c61a29f496f0'],
    cocktails: ['1514362545857-3bc16c4c7d1b', '1551538827-9c037cb4f32a', '1536935338788-846bb9981813', '1587223962217-f4ec24ef3fbc', '1560508179-b2c9a3f8e92b'],
    beers: ['1535958636474-b021ee887b13', '1571613316887-6f8d5cbf7ef7'],
    juices: ['1622483767028-3f66f32aef97', '1600271886742-f049cd451bba', '1556679343-c7306c1976bc', '1546173159-315724a31696', '1621506289937-a8e4df240d0b'],
    meats: ['1558030006-450675393462', '1544025162-d76694265947', '1600891964092-4316c288032e', '1529694157872-4e0c0f3b238b', '1546964124-0cce460f38ef'],
    seafood: ['1615141982883-c7ad0e69fd62', '1560717789-0ac7c58ac90a', '1432139509613-5c4255a1d181', '1535400255456-984241443b29'],
    desserts: ['1551024506-0bccd828d307', '1541783245831-57d6fb0926d3', '1488477181946-6428a0291777', '1587314168485-3236d6710814', '1571877227200-a0d98ea607e9', '1563805042-7684c019e1cb', '1606313564200-e75d5e30476c'],
    pizza: ['1513104890138-7c749659a591'],
    pasta: ['1473093295043-cdd812d0e601'],
    burger: ['1568901346375-23c9450c58cd'],
    appetizers: ['1626200419199-391ae4be7a41', '1541014741259-de529411b96a', '1585937421612-70a008356fbe', '1599487488170-d11ec9c172f0', '1572695157366-5e585ab2b69f']
};

let used = {};

function getRandomId(category) {
    const pool = pools[category] || pools.appetizers;
    return pool[Math.floor(Math.random() * pool.length)];
}

const regex = /<img src="([^"]+)" alt="([^"]+)"( loading="lazy")?>/g;

html = html.replace(regex, (match, src, alt, loading) => {
    if (src === 'logo.png') return match;
    
    let w = 600, h = 400;
    if (src.includes('w=300')) w = 300;
    if (src.includes('w=400') || alt.toLowerCase().includes('suco')) { w = 400; h = 400; }
    if (src.includes('h=500')) h = 500;

    let category = 'appetizers';
    const a = alt.toLowerCase();

    if (a.includes('vinho') || a.includes('cabernet') || a.includes('malbec') || a.includes('prosecco') || a.includes('chandon') || a.includes('clicquot') || a.includes('sauvignon') || a.includes('chardonnay') || a.includes('rose') || a.includes('amarone') || a.includes('chianti')) {
        category = 'wines';
        w = 300; h = 400;
    } else if (a.includes('caipirinha') || a.includes('gin') || a.includes('negroni') || a.includes('mojito') || a.includes('martini') || a.includes('fashioned') || a.includes('spritz') || a.includes('mule')) {
        category = 'cocktails';
        w = 600; h = 500;
    } else if (a.includes('cerveja')) {
        category = 'beers';
    } else if (a.includes('suco') || a.includes('agua') || a.includes('cafe') || a.includes('refrigerante') || a.includes('cha') || a.includes('limonada')) {
        category = 'juices';
        w = 400; h = 400;
    } else if (a.includes('bode') || a.includes('carne') || a.includes('file') || a.includes('chambaril') || a.includes('pato') || a.includes('lombo') || a.includes('cordeiro') || a.includes('steak') || a.includes('galinha') || a.includes('sarapatel') || a.includes('baiao')) {
        category = 'meats';
    } else if (a.includes('peixada') || a.includes('bacalhau') || a.includes('camarao') || a.includes('salmao') || a.includes('polvo') || a.includes('fish')) {
        category = 'seafood';
    } else if (a.includes('pizza')) {
        category = 'pizza';
    } else if (a.includes('fettuccine') || a.includes('pasta')) {
        category = 'pasta';
    } else if (a.includes('burger')) {
        category = 'burger';
    } else if (a.includes('cartola') || a.includes('petit') || a.includes('pudim') || a.includes('bolo') || a.includes('tiramisu') || a.includes('sorvete') || a.includes('cheesecake') || a.includes('creme') || a.includes('tapioca') || a.includes('cocada') || a.includes('brownie') || a.includes('romeu')) {
        if (!a.includes('dadinho')) {
            category = 'desserts';
        }
    }

    const id = getRandomId(category);
    const newSrc = `https://images.unsplash.com/photo-${id}?w=${w}&h=${h}&fit=crop`;
    
    return `<img src="${newSrc}" alt="${alt}"${loading ? loading : ''}>`;
});

fs.writeFileSync(file, html);
console.log('Fixed URLs mapped to high-quality matching Unsplash photos!');
