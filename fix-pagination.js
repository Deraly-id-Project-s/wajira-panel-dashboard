const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

let modifiedFiles = [];
walkDir(path.join(__dirname, 'src'), function(filePath) {
    if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Match occurrences like: setPerPage(Number(val)); setPage(1);
        // Or setPerPage(value); setPage(1);
        // Replace with just setPerPage(Number(val));
        
        const regex = /setPerPage\((.*?)\);\s*setPage\(1\);/g;
        if (regex.test(content)) {
            const newContent = content.replace(regex, 'setPerPage($1);');
            fs.writeFileSync(filePath, newContent, 'utf8');
            modifiedFiles.push(filePath);
        }
    }
});

console.log('Modified files:', modifiedFiles);
