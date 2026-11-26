import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, existsSync, readFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { makeDomainOf, domainOf } from '../domain.mjs';

const roots = [];
after(() => roots.forEach(r => rmSync(r, { recursive: true, force: true })));

// a temp repo from { 'path/to/file': 'contents' }
function repo(files) {
  const root = mkdtempSync(join(tmpdir(), 'pawsee-domain-'));
  roots.push(root);
  for (const [p, body] of Object.entries(files)) {
    const f = join(root, ...p.split('/'));
    mkdirSync(dirname(f), { recursive: true });
    writeFileSync(f, body);
  }
  return root;
}
const at = (root, p) => join(root, ...p.split('/'));

test('nx: the scope tag wins, the lib is the building', () => {
  const root = repo({ 'nx.json': '{}', 'libs/shop/booking-data/project.json': JSON.stringify({ tags: ['type:data-access', 'scope:booking'] }),
    'libs/shop/booking-data/src/lib/api.ts': '' });
  assert.deepEqual(domainOf(at(root, 'libs/shop/booking-data/src/lib/api.ts'), root), { eco: 'nx', domain: 'booking', building: 'booking-data' });
});

test('nx: without tags the folder under libs is the domain', () => {
  const root = repo({ 'nx.json': '{}', 'libs/booking/data-access/project.json': '{}', 'libs/booking/data-access/src/lib/api.ts': '', 'apps/web/src/main.ts': '' });
  assert.deepEqual(domainOf(at(root, 'libs/booking/data-access/src/lib/api.ts'), root), { eco: 'nx', domain: 'booking', building: 'data-access' });
  assert.deepEqual(domainOf(at(root, 'apps/web/src/main.ts'), root), { eco: 'nx', domain: 'web', building: null });
});

test('dotnet: the solution prefix and layer suffix come off the project name', () => {
  const root = repo({ 'Acme.sln': '', 'src/Acme.Booking.Api/Acme.Booking.Api.csproj': '', 'src/Acme.Booking.Api/Controllers/BookingController.cs': '',
    'tests/Acme.Booking.Api.Tests/Acme.Booking.Api.Tests.csproj': '', 'tests/Acme.Booking.Api.Tests/BookingTests.cs': '',
    'src/Acme.Payments/Acme.Payments.csproj': '', 'src/Acme.Payments/Pay.cs': '' });
  assert.deepEqual(domainOf(at(root, 'src/Acme.Booking.Api/Controllers/BookingController.cs'), root), { eco: 'dotnet', domain: 'Booking', building: 'Api' });
  assert.deepEqual(domainOf(at(root, 'tests/Acme.Booking.Api.Tests/BookingTests.cs'), root), { eco: 'dotnet', domain: 'Booking', building: 'Api.Tests' });
  assert.deepEqual(domainOf(at(root, 'src/Acme.Payments/Pay.cs'), root), { eco: 'dotnet', domain: 'Payments', building: null });
});

test('dotnet: a solution named after one domain keeps that domain', () => {
  const root = repo({ 'Acme.Booking.sln': '', 'Acme.Booking.Api/Acme.Booking.Api.csproj': '', 'Acme.Booking.Api/Program.cs': '' });
  assert.deepEqual(domainOf(at(root, 'Acme.Booking.Api/Program.cs'), root), { eco: 'dotnet', domain: 'Booking', building: 'Api' });
});

test('react: pages, features and Next app routes', () => {
  const root = repo({ 'package.json': JSON.stringify({ dependencies: { react: '18' } }), 'src/features/booking/components/Form.tsx': '',
    'src/pages/Checkout.tsx': '', 'src/pages/index.tsx': '', 'src/utils/date.ts': '' });
  assert.deepEqual(domainOf(at(root, 'src/features/booking/components/Form.tsx'), root), { eco: 'react', domain: 'booking', building: 'components' });
  assert.deepEqual(domainOf(at(root, 'src/pages/Checkout.tsx'), root), { eco: 'react', domain: 'Checkout', building: null });
  assert.deepEqual(domainOf(at(root, 'src/utils/date.ts'), root), { eco: 'plain', domain: 'utils', building: null }); // not under a page folder
  const next = repo({ 'package.json': JSON.stringify({ dependencies: { next: '15', react: '19' } }), 'app/(shop)/booking/[id]/page.tsx': '' });
  assert.deepEqual(domainOf(at(next, 'app/(shop)/booking/[id]/page.tsx'), next), { eco: 'react', domain: 'booking', building: '[id]' });
});

test('python: src packages, and Django apps', () => {
  const root = repo({ 'pyproject.toml': '', 'src/shop/booking/models.py': '', 'src/shop/__init__.py': '' });
  assert.deepEqual(domainOf(at(root, 'src/shop/booking/models.py'), root), { eco: 'python', domain: 'shop', building: 'booking' });
  const dj = repo({ 'manage.py': '', 'booking/apps.py': '', 'booking/views/list.py': '', 'booking/models.py': '' });
  assert.deepEqual(domainOf(at(dj, 'booking/views/list.py'), dj), { eco: 'python', domain: 'booking', building: 'views' });
  assert.deepEqual(domainOf(at(dj, 'booking/models.py'), dj), { eco: 'python', domain: 'booking', building: null });
});

test('plain folders, relative paths, and what belongs to the base', () => {
  const root = repo({ 'lib/parser/tokens.js': '', 'README.md': '' });
  assert.deepEqual(domainOf(at(root, 'lib/parser/tokens.js'), root), { eco: 'plain', domain: 'parser', building: null });
  assert.deepEqual(domainOf('lib/parser/tokens.js', root), { eco: 'plain', domain: 'parser', building: null });
  assert.equal(domainOf(at(root, 'README.md'), root), null);
  assert.equal(domainOf(join(dirname(root), 'elsewhere', 'x.js'), root), null);
  assert.equal(domainOf('', root), null);
  assert.equal(domainOf(at(root, 'lib/parser/tokens.js'), ''), null);
});

test('the disk is asked once per thing', () => {
  const root = repo({ 'nx.json': '{}', 'libs/booking/feature/project.json': '{}', 'libs/booking/feature/a.ts': '', 'libs/booking/feature/b.ts': '' });
  let calls = 0;
  const count = f => (...a) => { calls++; return f(...a); };
  const of = makeDomainOf({ exists: count(existsSync), read: count(p => { try { return readFileSync(p, 'utf8'); } catch { return ''; } }), list: count(p => { try { return readdirSync(p); } catch { return []; } }) });
  of(at(root, 'libs/booking/feature/a.ts'), root);
  const first = calls;
  assert.deepEqual(of(at(root, 'libs/booking/feature/b.ts'), root), { eco: 'nx', domain: 'booking', building: 'feature' });
  assert.equal(calls, first);
});
