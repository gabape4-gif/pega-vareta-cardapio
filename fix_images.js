const fs = require('fs');
const path = require('path');
const file = path.join(process.cwd(), 'index.html');
let html = fs.readFileSync(file, 'utf8');

html = html.replace(/<img src="([^"]+)" alt="([^"]+)"( loading="lazy")?>/g, (match, src, alt, loading) => {
    // skip logo
    if (src === 'logo.png') return match;
    
    let w = 600;
    let h = 400;
    
    if (src.includes('w=300')) w = 300;
    if (src.includes('w=400')) w = 400;
    if (src.includes('h=500')) h = 500;
    
    let prompt = encodeURIComponent(alt + ' delicious food photography high quality');
    
    const altLower = alt.toLowerCase();
    
    if (altLower.includes('vinho') || altLower.includes('cabernet') || altLower.includes('malbec') || altLower.includes('prosecco') || altLower.includes('chandon') || altLower.includes('clicquot') || altLower.includes('sauvignon') || altLower.includes('chardonnay') || altLower.includes('rose') || altLower.includes('amarone') || altLower.includes('chianti')) {
        prompt = encodeURIComponent('Bottle of ' + alt + ' wine on table high quality');
    } else if (altLower.includes('suco') || altLower.includes('agua') || altLower.includes('cerveja') || altLower.includes('cafe') || altLower.includes('refrigerante') || altLower.includes('cha') || altLower.includes('limonada')) {
        prompt = encodeURIComponent('Glass of ' + alt + ' drink refreshing high quality');
    } else if (altLower.includes('caipirinha') || altLower.includes('gin') || altLower.includes('negroni') || altLower.includes('mojito') || altLower.includes('martini') || altLower.includes('fashioned') || altLower.includes('spritz') || altLower.includes('mule')) {
        prompt = encodeURIComponent('Cocktail glass ' + alt + ' bar high quality');
    }

    const newSrc = `https://image.pollinations.ai/prompt/${prompt}?width=${w}&height=${h}&nologo=true`;
    return `<img src="${newSrc}" alt="${alt}"${loading ? loading : ''}>`;
});

fs.writeFileSync(file, html);
console.log('Images replaced!');
