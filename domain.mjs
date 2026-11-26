// Which part of a codebase a file belongs to, for the map view: { eco, domain, building } or null (a file at the root, or outside it).
// The ecosystem decides what a "domain" is: an Nx lib (or its scope tag), a .NET project, a React page or feature, a Django app or Python package, else a folder.
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, dirname, relative, isAbsolute, basename } from 'node:path';

// folders that only hold other folders, so the domain is the one below them
const NOISE = new Set(['src', 'lib', 'libs', 'app', 'apps', 'packages', 'source', 'sources']);
const REACT_DIRS = new Set(['pages', 'features', 'modules', 'routes', 'views', 'screens', 'app']);
const DOTNET_LAYERS = new Set(['Api', 'Domain', 'Application', 'Infrastructure', 'Web', 'Tests', 'Test', 'UnitTests', 'IntegrationTests', 'Contracts', 'Core', 'Data', 'Persistence', 'Client', 'Server', 'Shared']);

const realFs = {
  exists: p => existsSync(p),
  read: p => { try { return readFileSync(p, 'utf8'); } catch { return ''; } },
  list: p => { try { return readdirSync(p); } catch { return []; } },
};

const stem = name => name.replace(/\.[^.]+$/, '');
const json = text => { try { return JSON.parse(text); } catch { return null; } };

// makes a domainOf(file, root) that remembers what it looked up on disk
// shortcut: lookups are cached for the life of the process, so a marker file added later (a new nx.json) is seen only after a restart
export function makeDomainOf(fs = realFs) {
  const memo = new Map();
  const once = (k, f) => { if (!memo.has(k)) memo.set(k, f()); return memo.get(k); };
  const exists = p => once('e' + p, () => fs.exists(p));
  const read = p => once('r' + p, () => fs.read(p));
  const list = p => once('l' + p, () => fs.list(p));

  // the folders from the file's own folder up to (not including) root, deepest first
  const upFrom = (dir, root) => { const out = []; for (let d = dir; d !== root && relative(root, d) && !relative(root, d).startsWith('..'); d = dirname(d)) out.push(d); return out; };

  // the domain and building after leading container folders; parts end with the file name
  function fromParts(parts, containers = NOISE) {
    let i = 0;
    while (i < parts.length - 1 && containers.has(parts[i])) i++;
    const last = i === parts.length - 1;
    const domain = last ? stem(parts[i]) : parts[i];
    const building = parts.length - 1 > i + 1 ? parts[i + 1] : null;
    return domain ? { domain, building } : null;
  }

  function nx(dir, root, parts) {
    const project = upFrom(dir, root).find(d => exists(join(d, 'project.json')));
    if (project) {
      const tags = json(read(join(project, 'project.json')))?.tags || [];
      const scope = tags.find(t => typeof t === 'string' && t.startsWith('scope:'));
      if (scope) return { domain: scope.slice(6), building: basename(project) };
    }
    let i = 0;
    while (i < parts.length - 1 && ['libs', 'apps', 'packages'].includes(parts[i])) i++;
    // libs/booking/data-access/src/... : the building is the lib, skipping src and lib
    const rest = parts.slice(i + 1, -1).filter(p => !NOISE.has(p));
    return { domain: i === parts.length - 1 ? stem(parts[i]) : parts[i], building: rest[0] || null };
  }

  function dotnet(projectDir, csproj, root) {
    const segs = stem(csproj).split('.');
    const layers = [];
    while (segs.length > 1 && DOTNET_LAYERS.has(segs.at(-1))) layers.unshift(segs.pop());
    const sln = list(root).find(f => f.endsWith('.sln') || f.endsWith('.slnx'));
    const prefix = sln ? stem(sln).split('.') : [];
    while (segs.length > 1 && prefix[0] === segs[0]) { segs.shift(); prefix.shift(); }
    return { domain: segs.join('.'), building: layers.join('.') || null };
  }

  function react(base, file) {
    const parts = relative(base, file).split(/[\\/]/).filter(p => !/^\(.*\)$/.test(p)); // Next.js route groups like (shop) are not folders in the URL
    const at = parts.findIndex((p, i) => i < parts.length - 1 && REACT_DIRS.has(p));
    if (at < 0) return null;
    const r = fromParts(parts.slice(at + 1), new Set());
    return r && r.domain !== 'index' ? r : null;
  }

  return function domainOf(file, root) {
    if (!file || !root) return null;
    const abs = isAbsolute(file) ? file : join(root, file);
    const rel = relative(root, abs);
    if (!rel || rel.startsWith('..') || isAbsolute(rel)) return null;
    const parts = rel.split(/[\\/]/);
    if (parts.length < 2) return null; // a file at the root belongs to the base
    const dir = dirname(abs), ups = upFrom(dir, root);

    for (const d of ups) {
      const csproj = list(d).find(f => f.endsWith('.csproj') || f.endsWith('.fsproj'));
      if (csproj) return { eco: 'dotnet', ...dotnet(d, csproj, root) };
    }
    if (exists(join(root, 'nx.json'))) { const r = nx(dir, root, parts); return r && { eco: 'nx', ...r }; }
    for (const d of [...ups, root]) {
      const pkg = json(read(join(d, 'package.json')));
      if (!pkg) continue;
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      if (deps.react || deps.next) { const r = react(d, abs); if (r) return { eco: 'react', ...r }; }
      break; // the nearest package.json decides
    }
    const django = ups.find(d => exists(join(d, 'apps.py')));
    if (django) {
      const below = relative(django, abs).split(/[\\/]/);
      return { eco: 'python', domain: basename(django), building: below.length > 1 ? below[0] : null };
    }
    const python = ['pyproject.toml', 'setup.py', 'manage.py'].some(f => exists(join(root, f)));
    const r = fromParts(parts);
    return r && { eco: python ? 'python' : 'plain', ...r };
  };
}

export const domainOf = makeDomainOf();
