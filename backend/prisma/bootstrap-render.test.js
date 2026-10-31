const { test } = require('node:test');
const assert = require('node:assert/strict');
const { bootstrapRender } = require('./bootstrap-render');

const env = {
  BOOTSTRAP_ADMIN_ENABLED: 'true',
  ADMIN_USERNAME: 'admin.render',
  ADMIN_INITIAL_PASSWORD: 'RandomBootstrapPassword123!',
};
function setup({ existing = null, count = 0 } = {}) {
  const calls = { personas: [], usuarios: [], seed: 0, hashes: 0 };
  const tx = {
    $executeRaw: async () => undefined,
    usuario: {
      findUnique: async () => existing,
      count: async () => count,
      create: async (data) => calls.usuarios.push(data),
    },
    persona: {
      create: async (data) => {
        calls.personas.push(data);
        return { id_persona: 1 };
      },
    },
    rol: { findFirst: async () => ({ id_rol: 2 }) },
    municipio: { findFirst: async () => ({ id_municipio: 1 }) },
  };
  return {
    calls,
    db: { $transaction: async (fn) => fn(tx) },
    seed: async () => calls.seed++,
    hash: async () => {
      calls.hashes++;
      return 'only-a-hash';
    },
  };
}
test('disabled provisioning does not access the database', async () => {
  assert.equal(await bootstrapRender(null, {}, null, null), 'disabled');
});
test('weak credentials fail before database access and never appear in errors', async () => {
  await assert.rejects(
    bootstrapRender(
      null,
      { ...env, ADMIN_INITIAL_PASSWORD: 'bad-secret' },
      null,
      null,
    ),
    (error) => !error.message.includes('bad-secret'),
  );
});
test('creates only the initial fictitious administrator with a hash and forced change', async () => {
  const s = setup();
  assert.equal(await bootstrapRender(s.db, env, s.seed, s.hash), 'created');
  assert.equal(s.calls.seed, 1);
  assert.equal(s.calls.personas.length, 1);
  assert.equal(s.calls.usuarios.length, 1);
  assert.equal(s.calls.usuarios[0].data.password, 'only-a-hash');
  assert.equal(s.calls.usuarios[0].data.must_change_password, true);
});
test('restarts preserve an existing administrator and do not run catalogs again', async () => {
  const s = setup({
    existing: { activo: true, rol: { activo: true, nombre: 'Administrador' } },
  });
  assert.equal(await bootstrapRender(s.db, env, s.seed, s.hash), 'existing');
  assert.equal(s.calls.seed, 0);
  assert.equal(s.calls.hashes, 0);
  assert.equal(s.calls.usuarios.length, 0);
});
test('refuses to bootstrap an additional account in a populated database', async () => {
  const s = setup({ count: 1 });
  await assert.rejects(
    bootstrapRender(s.db, env, s.seed, s.hash),
    /sin usuarios/,
  );
  assert.equal(s.calls.seed, 0);
  assert.equal(s.calls.personas.length, 0);
});
test('does not reactivate or promote an existing account', async () => {
  const s = setup({
    existing: { activo: false, rol: { activo: true, nombre: 'Doctor' } },
  });
  await assert.rejects(
    bootstrapRender(s.db, env, s.seed, s.hash),
    /no es un administrador activo/,
  );
  assert.equal(s.calls.usuarios.length, 0);
});
