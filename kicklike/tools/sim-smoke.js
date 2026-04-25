const { loadEnv } = require('./sim-env');

const { ctx } = loadEnv(42);

console.log('KL.engine loaded:', typeof ctx.KL?.engine?.startMatch);
console.log('CONFIG loaded:',    typeof ctx.CONFIG);
console.log('DATA loaded:',      typeof ctx.DATA, '— archetypes:',
  Object.keys(ctx.DATA?.archetypes || {}).length);
console.log('I18N loaded:',      typeof ctx.I18N);
console.log('Tactic handlers:',  Object.keys(ctx.KL?.engine?.TACTIC_HANDLERS || {}).length);
console.log('Determinism check — Math.random() first 5 calls:');
for (let i = 0; i < 5; i++) console.log(' ', ctx.Math.random());
