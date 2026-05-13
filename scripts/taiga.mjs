/**
 * taiga.mjs — Cliente CLI para Taiga API
 * Uso: node scripts/taiga.mjs <comando> [opciones]
 *
 * Comandos disponibles:
 *   info                        → Info del proyecto
 *   epics                       → Lista épicas
 *   stories [--epic <ref>]      → Lista user stories
 *   tasks [--story <ref>]       → Lista tasks
 *   issues                      → Lista issues
 *   sprints                     → Lista sprints/milestones
 *   get <tipo> <ref>            → Detalle de un item (epic|story|task|issue)
 *   create <tipo>               → Crear item (lee JSON de stdin)
 *   update <tipo> <ref>         → Actualizar item (lee JSON de stdin)
 *   delete <tipo> <ref>         → Eliminar item
 *   search <texto>              → Buscar en user stories y tasks
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

// ─── CONFIG ─────────────────────────────────────────────────────────────────

const BASE_URL = 'http://62.72.24.240:9011/api/v1';
const PROJECT_SLUG = 'sistema-medico';
const CREDENTIALS = { username: 'CATR27', password: 'Ontheroad27' };
const TOKEN_CACHE = join(homedir(), '.taiga_token.json');

// ─── AUTH ────────────────────────────────────────────────────────────────────

async function getToken() {
  // Intentar usar token cacheado si no expiró
  if (existsSync(TOKEN_CACHE)) {
    try {
      const cached = JSON.parse(readFileSync(TOKEN_CACHE, 'utf8'));
      if (cached.expires_at > Date.now() + 60_000) {
        return cached.token;
      }
    } catch {}
  }
  return await refreshToken();
}

async function refreshToken() {
  const res = await fetch(`${BASE_URL}/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'normal', ...CREDENTIALS }),
  });
  if (!res.ok) throw new Error(`Auth failed: ${res.status}`);
  const data = await res.json();
  // Token expira en ~10 min, cacheamos por 9 min
  writeFileSync(TOKEN_CACHE, JSON.stringify({
    token: data.auth_token,
    expires_at: Date.now() + 9 * 60 * 1000,
  }));
  return data.auth_token;
}

// ─── HTTP ─────────────────────────────────────────────────────────────────────

async function api(method, path, body = null) {
  const token = await getToken();
  const opts = {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(`${BASE_URL}${path}`, opts);

  if (res.status === 401) {
    // Token expirado, forzar refresh y reintentar
    await refreshToken();
    return api(method, path, body);
  }

  const text = await res.text();
  if (!text) return null;

  let data;
  try { data = JSON.parse(text); }
  catch { throw new Error(`Parse error: ${text.substring(0, 200)}`); }

  if (!res.ok) throw new Error(`API ${res.status}: ${JSON.stringify(data)}`);
  return data;
}

const GET    = (path)        => api('GET',    path);
const POST   = (path, body)  => api('POST',   path, body);
const PATCH  = (path, body)  => api('PATCH',  path, body);
const DELETE = (path)        => api('DELETE', path);

// ─── PROJECT ──────────────────────────────────────────────────────────────────

let _projectId = null;
async function getProjectId() {
  if (_projectId) return _projectId;
  const p = await GET(`/projects/by_slug?slug=${PROJECT_SLUG}`);
  _projectId = p.id;
  return _projectId;
}

// ─── RESOLVERS (ref → id) ────────────────────────────────────────────────────

const ENDPOINTS = {
  epic:    '/epics',
  story:   '/userstories',
  task:    '/tasks',
  issue:   '/issues',
  sprint:  '/milestones',
};

async function resolveId(tipo, ref) {
  const pid = await getProjectId();
  const ep = ENDPOINTS[tipo];
  if (!ep) throw new Error(`Tipo desconocido: ${tipo}`);

  // Paginar hasta encontrar el item por ref
  let page = 1;
  while (true) {
    const token = await getToken();
    const res = await fetch(`${BASE_URL}${ep}?project=${pid}&page=${page}&page_size=100`, {
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    });
    const items = await res.json();
    const list = Array.isArray(items) ? items : (items.results || []);
    if (list.length === 0) break;
    const found = list.find(i => i.ref === Number(ref));
    if (found) return found.id;
    // Si vino menos de 100 items ya no hay más páginas
    if (list.length < 100) break;
    page++;
  }
  throw new Error(`No encontrado: ${tipo} #${ref}`);
}

// ─── FORMATTERS ───────────────────────────────────────────────────────────────

const STATUS_COLOR = {
  'New': '\x1b[33m', 'In progress': '\x1b[36m', 'Done': '\x1b[32m',
  'Ready': '\x1b[34m', 'Closed': '\x1b[90m',
};
const RESET = '\x1b[0m';
const BOLD  = '\x1b[1m';
const DIM   = '\x1b[2m';

function statusTag(name) {
  const c = STATUS_COLOR[name] || '\x1b[37m';
  return `${c}[${name}]${RESET}`;
}

function table(rows, cols) {
  const widths = cols.map(c => Math.max(c.length, ...rows.map(r => String(r[c] ?? '').length)));
  const sep = cols.map((_, i) => '─'.repeat(widths[i] + 2)).join('┼');
  const header = cols.map((c, i) => ` ${BOLD}${c.padEnd(widths[i])}${RESET} `).join('│');
  console.log('┌' + sep.replace(/┼/g, '┬') + '┐');
  console.log('│' + header + '│');
  console.log('├' + sep + '┤');
  rows.forEach(r => {
    const line = cols.map((c, i) => ` ${String(r[c] ?? '').padEnd(widths[i])} `).join('│');
    console.log('│' + line + '│');
  });
  console.log('└' + sep.replace(/┼/g, '┴') + '┘');
}

function detail(obj, fields) {
  const maxKey = Math.max(...fields.map(([k]) => k.length));
  fields.forEach(([label, val]) => {
    if (val !== undefined && val !== null && val !== '')
      console.log(`  ${BOLD}${label.padEnd(maxKey)}${RESET}  ${val}`);
  });
}

// ─── COMANDOS ─────────────────────────────────────────────────────────────────

async function cmdInfo() {
  const pid = await getProjectId();
  const p = await GET(`/projects/${pid}`);
  console.log(`\n${BOLD}${p.name}${RESET}  (ID: ${p.id} | Slug: ${p.slug})`);
  console.log(`${DIM}${p.description || 'Sin descripción'}${RESET}\n`);
  detail(p, [
    ['Creado',    p.created_date?.substring(0,10)],
    ['Miembros',  p.members?.length],
    ['Backlog',   p.is_backlog_activated ? '✓' : '✗'],
    ['Kanban',    p.is_kanban_activated  ? '✓' : '✗'],
    ['Issues',    p.is_issues_activated  ? '✓' : '✗'],
    ['Wiki',      p.is_wiki_activated    ? '✓' : '✗'],
  ]);
  console.log();
}

async function cmdEpics() {
  const pid = await getProjectId();
  const epics = await GET(`/epics?project=${pid}`);
  const list = Array.isArray(epics) ? epics : (epics.results || []);
  console.log(`\n${BOLD}ÉPICAS (${list.length})${RESET}\n`);
  const rows = list.map(e => ({
    'Ref':    `#${e.ref}`,
    'Estado': e.status_extra_info?.name || '-',
    'Título': e.subject,
    'US':     e.user_stories_counts?.total ?? '-',
  }));
  table(rows, ['Ref', 'Estado', 'Título', 'US']);
  console.log();
}

async function cmdStories(epicRef = null) {
  const pid = await getProjectId();
  let url = `/userstories?project=${pid}`;
  if (epicRef) {
    const epicId = await resolveId('epic', epicRef);
    url += `&epic=${epicId}`;
  }
  const items = await GET(url);
  const list = Array.isArray(items) ? items : (items.results || []);
  const label = epicRef ? `US de Épica #${epicRef}` : 'USER STORIES';
  console.log(`\n${BOLD}${label} (${list.length})${RESET}\n`);
  const rows = list.map(s => ({
    'Ref':    `#${s.ref}`,
    'Estado': s.status_extra_info?.name || '-',
    'Puntos': s.total_points ?? '-',
    'Título': s.subject.substring(0, 70),
  }));
  table(rows, ['Ref', 'Estado', 'Puntos', 'Título']);
  console.log();
}

async function cmdTasks(storyRef = null) {
  const pid = await getProjectId();
  let url = `/tasks?project=${pid}`;
  if (storyRef) {
    const storyId = await resolveId('story', storyRef);
    url += `&user_story=${storyId}`;
  }
  const items = await GET(url);
  const list = Array.isArray(items) ? items : (items.results || []);
  const label = storyRef ? `Tasks de US #${storyRef}` : 'TASKS';
  console.log(`\n${BOLD}${label} (${list.length})${RESET}\n`);
  const rows = list.map(t => ({
    'Ref':    `#${t.ref}`,
    'Estado': t.status_extra_info?.name || '-',
    'Asig.':  t.assigned_to_extra_info?.full_name_display || '-',
    'Título': t.subject.substring(0, 65),
  }));
  table(rows, ['Ref', 'Estado', 'Asig.', 'Título']);
  console.log();
}

async function cmdIssues() {
  const pid = await getProjectId();
  const items = await GET(`/issues?project=${pid}`);
  const list = Array.isArray(items) ? items : (items.results || []);
  console.log(`\n${BOLD}ISSUES (${list.length})${RESET}\n`);
  if (list.length === 0) { console.log(`  ${DIM}Sin issues registrados.${RESET}\n`); return; }
  const rows = list.map(i => ({
    'Ref':    `#${i.ref}`,
    'Tipo':   i.type_extra_info?.name || '-',
    'Estado': i.status_extra_info?.name || '-',
    'Título': i.subject.substring(0, 60),
  }));
  table(rows, ['Ref', 'Tipo', 'Estado', 'Título']);
  console.log();
}

async function cmdSprints() {
  const pid = await getProjectId();
  const items = await GET(`/milestones?project=${pid}`);
  const list = Array.isArray(items) ? items : (items.results || []);
  console.log(`\n${BOLD}SPRINTS (${list.length})${RESET}\n`);
  if (list.length === 0) { console.log(`  ${DIM}Sin sprints registrados.${RESET}\n`); return; }
  const rows = list.map(m => ({
    'ID':     m.id,
    'Nombre': m.name,
    'Inicio': m.estimated_start || '-',
    'Fin':    m.estimated_finish || '-',
    'Cerrado':m.closed ? 'Sí' : 'No',
  }));
  table(rows, ['ID', 'Nombre', 'Inicio', 'Fin', 'Cerrado']);
  console.log();
}

async function cmdGet(tipo, ref) {
  const id = await resolveId(tipo, ref);
  const ep = ENDPOINTS[tipo];
  const item = await GET(`${ep}/${id}`);
  console.log(`\n${BOLD}${tipo.toUpperCase()} #${ref}${RESET}\n`);
  detail(item, [
    ['Título',      item.subject],
    ['Estado',      item.status_extra_info?.name],
    ['Épica',       item.epic_extra_info?.subject],
    ['US',          item.user_story_extra_info?.subject],
    ['Puntos',      item.total_points],
    ['Asignado a',  item.assigned_to_extra_info?.full_name_display],
    ['Sprint',      item.milestone_slug],
    ['Creado',      item.created_date?.substring(0,10)],
    ['Modificado',  item.modified_date?.substring(0,10)],
    ['Descripción', item.description ? item.description.substring(0,200) : null],
  ]);
  console.log();
}

async function cmdCreate(tipo) {
  const pid = await getProjectId();
  const ep = ENDPOINTS[tipo];
  const input = readFileSync('/dev/stdin', 'utf8');
  const raw = JSON.parse(input);

  // Extraer epic_ref antes de enviar (no es un campo directo de la US)
  const epicRef = raw.epic_ref;
  delete raw.epic_ref;

  const body = { ...raw, project: pid };
  const created = await POST(ep, body);
  console.log(`\n${BOLD}✓ Creado: ${tipo} #${created.ref}${RESET} — ${created.subject}`);

  // Si es una US con epic_ref, vincular usando el endpoint correcto
  if (tipo === 'story' && epicRef) {
    const epicId = await resolveId('epic', epicRef);
    await POST(`/epics/${epicId}/related_userstories`, { epic: epicId, user_story: created.id });
    console.log(`  ${BOLD}↳ Vinculada a Épica #${epicRef}${RESET}`);
  }
  console.log();
}

async function cmdUpdate(tipo, ref) {
  const id = await resolveId(tipo, ref);
  const ep = ENDPOINTS[tipo];
  const input = readFileSync('/dev/stdin', 'utf8');
  const body = JSON.parse(input);
  const updated = await PATCH(`${ep}/${id}`, body);
  console.log(`\n${BOLD}✓ Actualizado: ${tipo} #${ref}${RESET} — ${updated.subject}\n`);
  // Mostrar versión actualizada
  await cmdGet(tipo, ref);
}

async function cmdDelete(tipo, ref) {
  const id = await resolveId(tipo, ref);
  const ep = ENDPOINTS[tipo];
  await DELETE(`${ep}/${id}`);
  console.log(`\n${BOLD}✓ Eliminado: ${tipo} #${ref}${RESET}\n`);
}

async function cmdSearch(text) {
  const pid = await getProjectId();
  const results = await GET(`/search?project=${pid}&text=${encodeURIComponent(text)}`);
  console.log(`\n${BOLD}BÚSQUEDA: "${text}"${RESET}\n`);

  const printItem = (i) => {
    const status = i.status_extra_info?.name || i.status?.name || null;
    const tag = status ? ` ${statusTag(status)}` : '';
    console.log(`  #${i.ref}${tag} ${i.subject}`);
  };
  if (results.userstories?.length) {
    console.log(`${BOLD}User Stories (${results.userstories.length}):${RESET}`);
    results.userstories.forEach(printItem);
  }
  if (results.tasks?.length) {
    console.log(`\n${BOLD}Tasks (${results.tasks.length}):${RESET}`);
    results.tasks.forEach(printItem);
  }
  if (results.issues?.length) {
    console.log(`\n${BOLD}Issues (${results.issues.length}):${RESET}`);
    results.issues.forEach(printItem);
  }
  if (results.epics?.length) {
    console.log(`\n${BOLD}Épicas (${results.epics.length}):${RESET}`);
    results.epics.forEach(printItem);
  }
  console.log();
}

async function cmdAll() {
  await cmdInfo();
  await cmdEpics();
  await cmdStories();
  await cmdTasks();
  await cmdIssues();
  await cmdSprints();
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const cmd = args[0];

  try {
    switch (cmd) {
      case 'info':    await cmdInfo(); break;
      case 'epics':   await cmdEpics(); break;
      case 'stories': await cmdStories(args.includes('--epic') ? args[args.indexOf('--epic')+1] : null); break;
      case 'tasks':   await cmdTasks(args.includes('--story') ? args[args.indexOf('--story')+1] : null); break;
      case 'issues':  await cmdIssues(); break;
      case 'sprints': await cmdSprints(); break;
      case 'get':     await cmdGet(args[1], args[2]); break;
      case 'create':  await cmdCreate(args[1]); break;
      case 'update':  await cmdUpdate(args[1], args[2]); break;
      case 'delete':  await cmdDelete(args[1], args[2]); break;
      case 'search':  await cmdSearch(args.slice(1).join(' ')); break;
      case 'all':     await cmdAll(); break;
      default:
        console.log(`
${BOLD}Taiga CLI — Sistema Medico${RESET}

Uso: node scripts/taiga.mjs <comando> [opciones]

${BOLD}Lectura:${RESET}
  info                         Info del proyecto
  epics                        Lista todas las épicas
  stories [--epic <ref>]       Lista user stories (filtra por épica)
  tasks   [--story <ref>]      Lista tasks (filtra por user story)
  issues                       Lista issues
  sprints                      Lista sprints
  get <tipo> <ref>             Detalle de un item
  search <texto>               Busca en todo el proyecto
  all                          Muestra todo

${BOLD}Escritura (requiere JSON en stdin):${RESET}
  create <tipo>                Crear item
  update <tipo> <ref>          Actualizar campos de un item
  delete <tipo> <ref>          Eliminar item

${BOLD}Tipos válidos:${RESET} epic | story | task | issue | sprint

${BOLD}Ejemplos:${RESET}
  node scripts/taiga.mjs epics
  node scripts/taiga.mjs stories --epic 230
  node scripts/taiga.mjs get task 279
  node scripts/taiga.mjs search "farmacia"
  echo '{"subject":"Nueva tarea"}' | node scripts/taiga.mjs create task
  echo '{"status":3}' | node scripts/taiga.mjs update story 245
`);
    }
  } catch (err) {
    console.error(`\n\x1b[31mError: ${err.message}\x1b[0m\n`);
    process.exit(1);
  }
}

main();
