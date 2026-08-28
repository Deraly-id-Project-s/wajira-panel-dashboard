import fs from 'fs';
import cp from 'child_process';

const statusOutput = cp.execSync('git status --porcelain').toString();
const unmergedFiles = statusOutput.split('\n')
  .filter(line => line.startsWith('UU '))
  .map(line => line.slice(3).trim());

let unknownConflicts = [];

for (const file of unmergedFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  const newLines = [];

  let inConflict = false;
  let headLines = [];
  let remoteLines = [];
  let currentSide = ''; // 'HEAD' or 'REMOTE'

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('<<<<<<< HEAD')) {
      inConflict = true;
      currentSide = 'HEAD';
      headLines = [];
      remoteLines = [];
      continue;
    }
    if (line.startsWith('=======')) {
      currentSide = 'REMOTE';
      continue;
    }
    if (line.match(/^>>>>>>> [a-f0-9]+/)) {
      inConflict = false;

      // Heuristic resolution
      const headText = headLines.join('\n');
      const remoteText = remoteLines.join('\n');

      let resolvedText = null;

      const headHasSticky = headText.includes('sticky right-0');
      const remoteHasSticky = remoteText.includes('sticky right-0');

      if (headHasSticky && !remoteHasSticky) {
        resolvedText = headText;
      } else if (!headHasSticky && remoteHasSticky) {
        resolvedText = remoteText;
      } else if (headHasSticky && remoteHasSticky) {
        // Both have sticky. Take remote, as it usually has newer styles like group-hover or Aksi.
        resolvedText = remoteText;
      } else {
        // Neither has sticky? Maybe it's a different conflict.
        resolvedText = null;
      }

      if (resolvedText !== null) {
        newLines.push(resolvedText);
      } else {
        unknownConflicts.push({ file, headText, remoteText });
        // leave conflict markers
        newLines.push('<<<<<<< HEAD');
        newLines.push(headText);
        newLines.push('=======');
        newLines.push(remoteText);
        newLines.push(line); // >>>>>>> ...
      }
      continue;
    }

    if (inConflict) {
      if (currentSide === 'HEAD') headLines.push(line);
      else remoteLines.push(line);
    } else {
      newLines.push(line);
    }
  }

  fs.writeFileSync(file, newLines.join('\n'));
}
