const fs = require('fs');
const path = require('path');

function getFiles(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(getFiles(file));
        } else if (file.endsWith('page.tsx')) {
            results.push(file);
        }
    });
    return results;
}

const portalDir = path.join('src', 'app', '(portal)');
if (!fs.existsSync(portalDir)) {
    console.error('Portal directory not found');
    process.exit(1);
}

const files = getFiles(portalDir);

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');

    // Remove any messy existing runtime or use client lines at the top
    const lines = content.split('\n');
    let i = 0;
    let hasUseClient = false;

    // Look at the first few lines
    while (i < 10 && i < lines.length) {
        if (lines[i].includes('export const runtime = "edge"') || lines[i].includes("export const runtime = 'edge'")) {
            lines[i] = '';
        } else if (lines[i].includes('"use client"') || lines[i].includes("'use client'") || lines[i].includes('("use client")')) {
            hasUseClient = true;
            lines[i] = '';
        }
        i++;
    }

    content = lines.join('\n').trimStart();

    if (hasUseClient) {
        content = `"use client";\nexport const runtime = "edge";\n` + content;
    } else {
        content = `export const runtime = "edge";\n` + content;
    }

    fs.writeFileSync(file, content);
    console.log(`Fixed ${file}`);
});
