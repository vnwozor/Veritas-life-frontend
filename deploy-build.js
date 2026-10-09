/* Vercel build step ("vercel-build" in package.json).
   1. writes the new source files from veritas-update-bundle.json (src/humans.js, src/arch.js, tools/humans/build-humans.js),
   2. applies the bundle's patches to the game core (Vercel always starts from the files in GitHub),
   3. inlines src/*.js into index.html (build.js),
   4. builds the realistic-people data (vendor/hm) from the free MakeHuman data on GitHub.
   If step 4 fails the game still works with the classic characters. */
const fs = require('fs'), path = require('path'), cp = require('child_process');
const ROOT = __dirname;
const rd = f => fs.readFileSync(path.join(ROOT, f), 'utf8'), wr = (f, s) => { fs.mkdirSync(path.dirname(path.join(ROOT, f)), { recursive: true }); fs.writeFileSync(path.join(ROOT, f), s); };
function stripModules(s) {
  for (const [a, b] of [['/*@@EARLY@@*/', '/*@@END EARLY@@*/'], ['/*@@MODULES@@*/', '/*@@END MODULES@@*/']]) {
    const i = s.indexOf(a), j = s.indexOf(b); if (i >= 0 && j > i) s = s.slice(0, i + a.length) + '\n' + s.slice(j);
  }
  return s;
}
const B = JSON.parse(rd('veritas-update-bundle.json'));
for (const f in B.files) wr(f, B.files[f]);
for (const f in B.patches) {
  let s = rd(f); if (f === 'index.html') s = stripModules(s);
  let applied = 0, skipped = 0;
  for (const [a, b] of B.patches[f]) {
    const n = s.split(a).length - 1;
    if (n === 1) { s = s.replace(a, () => b); applied++; }
    else if (s.includes(b)) skipped++;
    else throw new Error('patch does not fit ' + f + ': ' + a.slice(0, 80));
  }
  wr(f, s); console.log('patched', f, applied, 'applied', skipped, 'already there');
}
cp.execSync('node build.js', { cwd: ROOT, stdio: 'inherit' });
(async () => {
  try {
    if (fs.existsSync(path.join(ROOT, 'vendor/hm/hm.bin'))) { console.log('vendor/hm already present'); return; }
    const sha = 'a8bc2d54ff0ac92e78ff71431b1023eda42bf482', tmp = fs.mkdtempSync('/tmp/mh-');
    const r = await fetch('https://codeload.github.com/makehumancommunity/makehuman/tar.gz/' + sha); if (!r.ok) throw new Error('download ' + r.status);
    fs.writeFileSync(tmp + '/mh.tgz', Buffer.from(await r.arrayBuffer()));
    cp.execSync("tar -xzf mh.tgz --wildcards '*/makehuman/data/3dobjs/*' '*/makehuman/data/rigs/*' '*/makehuman/data/eyes/*' '*/makehuman/data/targets/*'", { cwd: tmp, stdio: 'inherit' });
    const data = path.join(tmp, 'makehuman-' + sha, 'makehuman', 'data');
    cp.execSync('node tools/humans/build-humans.js "' + data + '" vendor/hm', { cwd: ROOT, stdio: 'inherit' });
    fs.copyFileSync(path.join(data, 'eyes/materials/brown_eye.png'), path.join(ROOT, 'vendor/hm/eye.png'));
    console.log('realistic people data built');
  } catch (e) { console.log('realistic people data not built (classic characters will be used):', e.message); }
})();
