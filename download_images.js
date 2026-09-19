const fs = require('fs');
const path = require('path');
const https = require('https');

const dir = path.join(process.cwd(), 'images');
if (!fs.existsSync(dir)) fs.mkdirSync(dir);

const file = path.join(process.cwd(), 'index.html');
let html = fs.readFileSync(file, 'utf8');

const regex = /<img src="https:\/\/image\.pollinations\.ai\/prompt\/([^"]+)" alt="([^"]+)"/g;
let match;
let matches = [];

while ((match = regex.exec(html)) !== null) {
    matches.push({ url: `https://image.pollinations.ai/prompt/${match[1]}`, alt: match[2] });
}

console.log('Found ' + matches.length + ' images to download.');

async function downloadImages() {
    for (let i = 0; i < matches.length; i++) {
        const item = matches[i];
        // clean up alt text for filename
        const filename = item.alt.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.jpg';
        const filepath = path.join(dir, filename);
        
        console.log(`Downloading ${i + 1}/${matches.length}: ${filename}...`);
        
        // replace url in html to local path immediately
        html = html.replace(item.url, `images/${filename}`);
        
        // Skip if already exists
        if (fs.existsSync(filepath)) {
            console.log('Already exists, skipping.');
            continue;
        }

        await new Promise((resolve, reject) => {
            const req = https.get(item.url, (res) => {
                if (res.statusCode === 200) {
                    const fileStream = fs.createWriteStream(filepath);
                    res.pipe(fileStream);
                    fileStream.on('finish', () => {
                        fileStream.close();
                        resolve();
                    });
                } else if (res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 307 || res.statusCode === 308) {
                    // follow redirect
                    https.get(res.headers.location, (res2) => {
                        if (res2.statusCode === 200) {
                            const fileStream = fs.createWriteStream(filepath);
                            res2.pipe(fileStream);
                            fileStream.on('finish', () => {
                                fileStream.close();
                                resolve();
                            });
                        } else {
                            resolve(); // just skip on error to continue loop
                        }
                    }).on('error', resolve);
                } else {
                    console.log(`Failed with status ${res.statusCode}`);
                    resolve();
                }
            });
            req.on('error', (err) => {
                console.log('Error: ', err.message);
                resolve();
            });
            // Timeout to prevent hanging
            req.setTimeout(10000, () => {
                req.destroy();
                resolve();
            });
        });
        
        // wait 500ms between requests to avoid rate limits
        await new Promise(r => setTimeout(r, 500));
    }
    
    fs.writeFileSync(file, html);
    console.log('Finished downloading and updated HTML!');
}

downloadImages();
