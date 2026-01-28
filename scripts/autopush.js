#!/usr/bin/env node
// autopush.js - post-commit hook helper that pushes to origin/main
const { spawn } = require('child_process');

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: 'inherit', shell: true });
    p.on('close', code => code === 0 ? resolve() : reject(new Error('exit '+code)));
  });
}

(async ()=>{
  try{
    console.log('[autopush] Pushing commits to origin main...');
    await run('git', ['push','-u','origin','main']);
    console.log('[autopush] Push complete.');
  }catch(err){
    console.error('[autopush] Push failed:', err.message || err);
    process.exit(0); // do not fail commit
  }
})();
