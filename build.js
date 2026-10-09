/* Inlines the modules in src/ into index.html (between the @@MODULES markers), in this order.
   Run: node build.js   (then commit index.html together with src/) */
const fs = require('fs'), path = require('path');
// EARLY modules run before the campus is built (they only need the 3D helpers); the rest run after everything else.
const GROUPS = { EARLY: ['visuals.js', 'vehicles.js', 'arch.js'], MODULES: ['arrival.js', 'life.js', 'stories.js', 'dating.js', 'crime.js', 'bandits.js', 'controls.js', 'humans.js', 'homes.js', 'render.js'] };
let html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8'); const used = [];
for (const [name, files] of Object.entries(GROUPS)) {
  const A = '/*@@' + name + '@@*/', B = '/*@@END ' + name + '@@*/'; const i = html.indexOf(A), j = html.indexOf(B);
  if (i < 0 || j < 0) throw new Error('markers missing in index.html: ' + name);
  const have = files.filter(f => fs.existsSync(path.join(__dirname, 'src', f))); used.push(...have);
  const code = have.map(f => '/* ---- src/' + f + ' ---- */\n' + fs.readFileSync(path.join(__dirname, 'src', f), 'utf8').trim()).join('\n');
  html = html.slice(0, i + A.length) + '\n' + code + '\n' + html.slice(j);
}
fs.writeFileSync(path.join(__dirname, 'index.html'), html);
console.log('index.html built with', used.join(', '));
