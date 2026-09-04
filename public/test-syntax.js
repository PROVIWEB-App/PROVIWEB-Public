// Extract and test JavaScript from ser-aliado.html
const fs = require('fs');
const path = require('path');

const filePath = 'c:\\Users\\viweb\\Desktop\\PROYECTO\\proviweb-web\\public\\ser-aliado.html';
const content = fs.readFileSync(filePath, 'utf-8');

// Extract script content
const scriptStart = content.indexOf('<script type="module">');
const scriptEnd = content.indexOf('</script>', scriptStart);

if (scriptStart === -1 || scriptEnd === -1) {
    console.error('Could not find script tags');
    process.exit(1);
}

const scriptContent = content.substring(scriptStart + 22, scriptEnd).trim();

// Write to temp file
fs.writeFileSync('temp-script.js', scriptContent);

// Try to parse with Node
try {
    require('./temp-script.js');
    console.log('Script is valid!');
} catch (error) {
    console.log('Syntax error found:');
    console.log('Line:', error.stack);
}

// Clean up
fs.unlinkSync('temp-script.js');
