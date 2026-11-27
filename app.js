/* Dynolt Task Tracker v3. Each login is a private team tracker. Data and logins live in Supabase. */
{
/* Password reset links arrive with the tokens (or an error) in the address; read them before Supabase clears it. */
const LINK_HASH = location.hash || "";
const LINK_RECOVERY = /(^|[#&])type=recovery(&|$)/.test(LINK_HASH);
const LINK_ERROR = /(^|[#&])error(_code)?=/.test(LINK_HASH) ? (/otp_expired|expired/i.test(LINK_HASH) ? "This reset link has expired or was already used. Request a new one below." : "This link did not work. Request a new reset link below.") : "";
if (LINK_ERROR) try { history.replaceState(null, "", location.pathname + location.search); } catch (e) {}
/* =========================================================== constants and helpers */
const STAT = ["Not Started", "In Progress", "On Hold", "Completed", "Dropped"];
const SCOL = { "Not Started": "#9aa0aa", "In Progress": "#3767d6", "On Hold": "#c27a00", "Completed": "#1ec79a", "Dropped": "#d93f3f" };
const REPEAT = [["", "Does not repeat"], ["daily", "Every day"], ["weekly", "Every week"], ["fortnightly", "Every 2 weeks"], ["monthly", "Every month"], ["quarterly", "Every 3 months"]];
const STALE_DAYS = 7, SOON_DAYS = 10;
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const esc = v => String(v ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const iso = d => { const z = new Date(d.getTime() - d.getTimezoneOffset() * 6e4); return z.toISOString().slice(0, 10); };
const TODAY = () => iso(new Date());
const addDays = (s, n) => { const d = new Date(s + "T12:00:00"); d.setDate(d.getDate() + n); return iso(d); };
const days = (a, b) => Math.round((new Date(b + (b.length === 10 ? "T12:00:00" : "")) - new Date(a + (a.length === 10 ? "T12:00:00" : ""))) / 864e5);
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const fmt = s => { if (!s) return ""; const [y, m, d] = s.slice(0, 10).split("-"); return `${d}-${MON[+m - 1]}-${y.slice(2)}`; };
const fmtTime = s => { const d = new Date(s); return `${fmt(iso(d))} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`; };
const ago = s => { const m = Math.round((Date.now() - new Date(s)) / 6e4); return m < 1 ? "just now" : m < 60 ? m + " min ago" : m < 1440 ? Math.round(m / 60) + " h ago" : m < 2880 ? "yesterday" : fmt(iso(new Date(s))); };
const ls = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };
const initials = n => (n || "?").trim().split(/\s+/).slice(0, 2).map(w => w[0]).join("").toUpperCase();
const HUES = ["#e4f8f1:#0d7a5b", "#e8eefc:#3767d6", "#fff3dc:#8a5300", "#fdecec:#b42318", "#f1e8fc:#6b3fc4", "#e6f4fb:#126b93", "#fbe8f3:#a3326f"];
const avStyle = n => { let h = 0; for (const c of n || "") h = (h * 31 + c.charCodeAt(0)) >>> 0; const [bg, fg] = HUES[h % HUES.length].split(":"); return `background:${bg};color:${fg}`; };
const av = (n, sm) => `<span class="av${sm ? " sm" : ""}" style="${avStyle(n)}">${esc(initials(n))}</span>`;
const pl = (n, w) => `${n} ${w}${n === 1 ? "" : "s"}`;
const IC = {
  home: '<path d="M3 11 12 4l9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  tasks: '<path d="M9 6h11M9 12h11M9 18h11"/><path d="m3.5 6 1.2 1.2L7 5M3.5 12l1.2 1.2L7 11M3.5 18l1.2 1.2L7 17"/>',
  cal: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  team: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><circle cx="17" cy="9" r="2.6"/><path d="M16 14.2a5 5 0 0 1 6 4.8"/>',
  tpl: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  invite: '<circle cx="10" cy="8" r="4"/><path d="M3 20a7 7 0 0 1 12-4.9M19 14v6M16 17h6"/>',
  bell: '<path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  sun: '<circle cx="12" cy="12" r="4.5"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
  xls: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 13l4 5M12 13l-4 5"/>',
  up: '<path d="M12 19V5M5 12l7-7 7 7"/>',
  clip: '<path d="m21 11-8.5 8.5a5.5 5.5 0 0 1-7.8-7.8L13.2 3.2a3.7 3.7 0 0 1 5.2 5.2l-8.5 8.5a1.8 1.8 0 0 1-2.6-2.6l7.8-7.8"/>',
  repeat: '<path d="M17 2l4 4-4 4"/><path d="M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4"/><path d="M21 13v2a3 3 0 0 1-3 3H3"/>',
  lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  check: '<path d="m4 12 5 5L20 6"/>',
  flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
  more: '<circle cx="5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="19" cy="12" r="1.3"/>',
  out: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  board: '<rect x="3" y="4" width="5" height="16" rx="1.5"/><rect x="10" y="4" width="5" height="11" rx="1.5"/><rect x="17" y="4" width="4" height="7" rx="1.5"/>',
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  eyeoff: '<path d="M10.6 5.1A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3 3.9M6.6 6.6A17 17 0 0 0 2 12s3.5 7 10 7a9.7 9.7 0 0 0 5.4-1.6M3 3l18 18M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
  chevl: '<path d="m11 17-5-5 5-5M18 17l-5-5 5-5"/>',
  chevr: '<path d="m13 17 5-5-5-5M6 17l5-5-5-5"/>'
};
const ic = (n, cls) => `<svg class="i${cls ? " " + cls : ""}" viewBox="0 0 24 24" aria-hidden="true">${IC[n]}</svg>`;

/* =========================================================== data layer */
function makeApi() {
  const cfg = window.TT_CONFIG || {};
  if (!window.supabase || !cfg.SUPABASE_URL || cfg.SUPABASE_URL.includes("YOUR-PROJECT")) return null;
  const sb = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
  const ok = r => { if (r.error) throw r.error; return r.data; };
  const B = () => sb.storage.from("attachments");
  return {
    async user() { const { data } = await sb.auth.getSession(); return data.session ? data.session.user : null; },
    async signIn(email, password) { ok(await sb.auth.signInWithPassword({ email, password })); },
    async signUp(full_name, email, password) { const d = ok(await sb.auth.signUp({ email, password, options: { data: { full_name } } })); return !!d.session; },
    async signOut() { await sb.auth.signOut(); },
    async changePassword(password) { ok(await sb.auth.updateUser({ password })); },
    async verifyPassword(email, password) { ok(await sb.auth.signInWithPassword({ email, password })); },
    async resetPassword(email) { ok(await sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname })); },
    onRecovery(cb) { sb.auth.onAuthStateChange(ev => { if (ev === "PASSWORD_RECOVERY") cb(); }); },
    async loadAll() {
      const [t, p, c, pr, tp] = await Promise.all([
        sb.from("tasks").select("*").order("no"),
        sb.from("people").select("*").order("name"),
        sb.from("categories").select("id,name").order("name"),
        sb.from("profiles").select("*").order("created_at"),
        sb.from("templates").select("*").order("name")]);
      return { tasks: ok(t), people: ok(p), categories: ok(c), profiles: ok(pr) || [], templates: tp.error ? [] : tp.data };
    },
    async activity() { return ok(await sb.from("task_updates").select("id,task_id,author_id,author_name,body,kind,created_at").order("created_at", { ascending: false }).limit(60)); },
    async deleteAccount() { ok(await sb.rpc("delete_my_account")); try { await sb.auth.signOut(); } catch (e) {} },
    async forwarded() { const r = await sb.rpc("forwarded_progress"); return r.error ? [] : r.data || []; },
    async notes() { return ok(await sb.from("task_updates").select("task_id,author_id,author_name,body,created_at").eq("kind", "note").order("created_at", { ascending: false }).limit(5000)); },
    async addNotes(task_id, bodies) { if (bodies.length) ok(await sb.from("task_updates").insert(bodies.map(body => ({ task_id, body })))); },
    async history(task_id) { return ok(await sb.from("task_updates").select("id,author_name,body,kind,created_at").eq("task_id", task_id).order("created_at", { ascending: false })); },
    async historyFor(ids) {
      const out = [];
      for (let i = 0; i < ids.length; i += 150) out.push(...ok(await sb.from("task_updates").select("task_id,author_name,body,kind,created_at").in("task_id", ids.slice(i, i + 150)).order("created_at")));
      return out;
    },
    async insertTask(row) { return ok(await sb.from("tasks").insert(row).select().single()); },
    async updateTask(id, patch) { return ok(await sb.from("tasks").update(patch).eq("id", id).select().single()); },
    async updateMany(ids, patch) { ok(await sb.from("tasks").update(patch).in("id", ids)); },
    async deleteTask(id) { ok(await sb.from("tasks").delete().eq("id", id)); },
    async addNote(task_id, body) { ok(await sb.from("task_updates").insert({ task_id, body })); },
    async updateName(id, full_name) { ok(await sb.from("profiles").update({ full_name }).eq("id", id)); },
    async addPerson(row) { return ok(await sb.from("people").insert(row).select().single()); },
    async updatePerson(id, patch) { ok(await sb.from("people").update(patch).eq("id", id)); },
    async suggestions() { const r = await sb.rpc("account_suggestions"); return r.error ? [] : r.data || []; },
    async deletePerson(id) { ok(await sb.from("people").delete().eq("id", id)); },
    async addCategory(name) { ok(await sb.from("categories").insert({ name })); },
    async deleteCategory(id) { ok(await sb.from("categories").delete().eq("id", id)); },
    async addTemplate(row) { ok(await sb.from("templates").insert(row)); },
    async deleteTemplate(id) { ok(await sb.from("templates").delete().eq("id", id)); },
    async files(owner, taskId) { const d = ok(await B().list(`${owner}/${taskId}`, { limit: 100, sortBy: { column: "created_at", order: "asc" } })); return (d || []).filter(f => f.name && f.id !== null); },
    async upload(owner, taskId, file) { const safe = file.name.replace(/[^\w.\- ]+/g, "_").slice(-90); ok(await B().upload(`${owner}/${taskId}/${Date.now()}_${safe}`, file, { upsert: false })); },
    async fileUrl(owner, taskId, name) { return ok(await B().createSignedUrl(`${owner}/${taskId}/${name}`, 600)).signedUrl; },
    async removeFile(owner, taskId, name) { ok(await B().remove([`${owner}/${taskId}/${name}`])); },
    subscribe(cb) {
      sb.channel("tt-live").on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, cb)
        .on("postgres_changes", { event: "*", schema: "public", table: "task_updates" }, cb).subscribe();
    }
  };
}
const api = window.TT_MOCK_API || makeApi();

/* =========================================================== state */
let sugg = [], teamSel = "", newTeamOpen = false, me = null, tasks = [], people = [], cats = [], profiles = [], templates = [], activity = [], notesBy = new Map(), fwd = new Map();
const openUpd = new Set(), openCl = new Set();
let scope = "mine", editing = null, loading = false, signup = false, lmode = LINK_RECOVERY ? "recover" : LINK_ERROR ? "forgot" : "", calMonth = null, repDays = 90;
let F = { q: "", person: "", cat: "", status: "", urgent: false, flag: "", view: "open", group: ls.get("tt-group") || "none" };
let sort = { k: "urgency", d: 1 }, showF = false;
const LAY = { tasks: ls.get("tt-lay-tasks") || "list", team: ls.get("tt-lay-team") || "cards", templates: ls.get("tt-lay-templates") || "list", board: ls.get("tt-board") || "status" };
const laySeg = (k, opts) => `<div class="seg lay" role="group" aria-label="Layout">${opts.map(([v, l, i]) => `<button class="${LAY[k] === v ? "on" : ""}" data-lay="${k}:${v}" title="${l}">${ic(i)} ${l}</button>`).join("")}</div>`;
const selected = new Set();
const blankF = () => ({ q: "", person: "", team: "", cat: "", status: "", urgent: false, flag: "", view: "open", group: F.group });

const team = () => people.filter(p => p.owner_id === me.id);
/* Teams: named groups of people. A person can be in several. Empty new teams are kept in this browser until someone is added. */
const pTeams = p => Array.isArray(p.teams) ? p.teams : [];
const extraTeamsKey = () => `tt_teams_${me && me.id}`;
const extraTeams = () => { try { return JSON.parse(localStorage.getItem(extraTeamsKey()) || "[]"); } catch (e) { return []; } };
const setExtraTeams = a => { try { localStorage.setItem(extraTeamsKey(), JSON.stringify(a)); } catch (e) {} };
const allTeams = () => [...new Set([...team().flatMap(pTeams), ...extraTeams()])].sort((a, b) => a.localeCompare(b));
const dismissKey = () => `tt_sugg_noteclosed_${me && me.id}`;
const dismissed = () => { try { return new Set(JSON.parse(localStorage.getItem(dismissKey()) || "[]")); } catch (e) { return new Set(); } };
function suggestions() {
  const T = team(), em = new Set(T.map(p => (p.email || "").toLowerCase()).filter(Boolean)), nm = new Set(T.map(p => p.name.trim().toLowerCase())), hid = dismissed();
  return sugg.filter(a => a.email && !em.has(a.email.toLowerCase()) && !nm.has((a.full_name || "").trim().toLowerCase()));
}
/* new colleagues show as notifications; closing one keeps them under Colleagues on the Team page */
const noteSugg = () => { const hid = dismissed(); return suggestions().filter(a => !hid.has(a.id)); };
const sgName = a => (a.full_name || a.email.split("@")[0]).trim();
const sgRow = (a, inPop) => `<div class="sgi">${av(sgName(a), 1)}<div class="grow"><b>${esc(sgName(a))}</b><div class="sub">${inPop ? "Joined the tracker · " : ""}${esc(a.email)}</div></div><button class="btn sm pri" data-sgadd="${a.id}">Add</button>${inPop ? `<button class="btn sm ghost icon sgx" data-sghide="${a.id}" title="Close. They stay under Colleagues on the Team page." aria-label="Close notification">${ic("x")}</button>` : ""}</div>`;
const pName = id => (people.find(p => p.id === id) || {}).name || "";
const tById = id => tasks.find(t => t.id === id);
const mine = t => t.owner_id === me.id;
const sharedTasks = () => tasks.filter(t => !mine(t));
const inScope = t => scope === "shared" ? !mine(t) : mine(t);
const isOpen = t => t.status !== "Completed" && t.status !== "Dropped";
const awaiting = t => t.status === "Completed" && !t.validated;
const needsAction = t => isOpen(t) || awaiting(t);
const urgentT = t => t.priority === "HIGH";
const left = t => t.due_date ? days(TODAY(), t.due_date) : null;
const blockedT = t => { if (!t.blocked_by || !isOpen(t)) return null; const b = tById(t.blocked_by); return b && isOpen(b) ? b : null; };
const cl = t => Array.isArray(t.checklist) ? t.checklist : [];
/* Optional due time: "17:00:00" -> "5:00 PM". Times are the wall clock where the tracker is used. */
const hm = s => { if (!s) return ""; let [h, m] = s.split(":").map(Number); const ap = h < 12 ? "AM" : "PM"; h = h % 12 || 12; return `${h}:${String(m).padStart(2, "0")} ${ap}`; };
const nowMin = () => { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); };
const dueMin = t => t.due_time ? (+t.due_time.slice(0, 2)) * 60 + (+t.due_time.slice(3, 5)) : null;
const minsLeftToday = t => left(t) === 0 && t.due_time ? dueMin(t) - nowMin() : null;
const dueText = t => t.due_date ? fmt(t.due_date) + (t.due_time ? " " + hm(t.due_time) : "") : "";
const dueToday = t => isOpen(t) && left(t) === 0 && flag(t) !== "Overdue";
const dur = m => m < 60 ? `${m} min` : `${Math.floor(m / 60)} h` + (m % 60 && m < 600 ? ` ${m % 60} min` : "");
function flag(t) {
  if (t.status === "Completed") return t.validated ? "Done" : "Awaiting validation";
  if (t.status === "Dropped") return "Dropped";
  if (!t.due_date) return "No due date";
  const d = left(t); if (d < 0) return "Overdue"; if (d === 0 && t.due_time && dueMin(t) <= nowMin()) return "Overdue"; if (d <= SOON_DAYS) return "Due soon"; return "On track";
}
const dropReq = t => !!t.drop_requested && isOpen(t);
const isStale = t => isOpen(t) && (!t.updated_on || days(t.updated_on, TODAY()) > STALE_DAYS);
const missingList = t => isOpen(t) && mine(t) ? [!t.person_id && "assignee", !t.due_date && "due date", !t.category && "category", !t.status && "status"].filter(Boolean) : [];
const missing = t => missingList(t).length > 0;
const closed7 = t => !needsAction(t) && t.updated_on && days(t.updated_on, TODAY()) <= 7;
const urgency = t => { if (!needsAction(t)) return 1e7; if (awaiting(t)) return -0.5; const d = left(t); return (d === null ? 1e6 : d) + (t.due_time ? dueMin(t) / 1440 * 0.5 : 0.5) - (urgentT(t) ? 0.25 : 0); };
const statOpts = t => mine(t) ? STAT : STAT.filter(s => s !== "Dropped");
/* What I may do on a task: owner = everything; assignee = per-task access set by the owner. */
/* What the assignee may change, field by field. The owner can change everything. */
const RIGHTS = [["status", "Change the status"], ["waiting_on", "Edit \"waiting on\""], ["checklist", "Tick and edit the checklist"], ["notes", "Add updates"], ["title", "Edit the title"], ["category", "Change the category"], ["priority", "Mark or unmark urgent"], ["due", "Change the due date and time"]];
const DEF_CAN = ["status", "waiting_on", "checklist", "notes"];
/* My own entries on other people's team lists (visible only for people who were given sign-in). */
const myPids = () => people.filter(p => p.owner_id !== me.id).map(p => p.id);
const isAssignee = t => !mine(t) && t.assignee_can_see !== false && myPids().includes(t.person_id);
const isMember = t => !mine(t) && !isAssignee(t);
const itemWho = x => x.person_id ? (pName(x.person_id) || x.person_name || "") : "";
const myItem = (t, x) => isMember(t) && x.share && myPids().includes(x.person_id);
const canArr0 = t => Array.isArray(t.assignee_can) ? t.assignee_can : t.assignee_access === "view" ? [] : t.assignee_access === "edit" ? RIGHTS.map(r => r[0]) : DEF_CAN;
const canArr = t => !mine(t) && isMember(t) ? ["notes"] : canArr0(t);
const can = (t, k) => mine(t) || canArr(t).includes(k);
const canAny = t => mine(t) || canArr(t).length > 0;
const rightsText = arr => arr.length ? arr.map(k => (RIGHTS.find(r => r[0] === k) || [k, k])[1].toLowerCase()).join(", ") : "nothing (view only)";
const sameSet = (x, y) => x.length === y.length && x.every(k => y.includes(k));
/* Changing the title, an existing assignee or an existing due date needs a reason. */
const tm5 = s => s ? String(s).slice(0, 5) : null;
function importantChanges(t, p) {
  const r = [];
  if ("title" in p && p.title !== t.title) r.push("title");
  if ("person_id" in p && t.person_id && (p.person_id || null) !== (t.person_id || null)) r.push("assignee");
  if (t.due_date && (("due_date" in p && (p.due_date || null) !== t.due_date) || ("due_time" in p && tm5(p.due_time) !== tm5(t.due_time)))) r.push("due date");
  return r;
}
const withReason = (p, reason) => ({ ...p, change_reason: reason, change_reason_at: new Date().toISOString() });
let RSN = null;
function askReason(what, taskLabel, msg) {
  return new Promise(res => {
    RSN = res;
    const wasOpen = $("#modal").classList.contains("open") ? { t: $("#mt").textContent, b: $("#mb").innerHTML, f: $("#mf").innerHTML } : null; RSN.prev = wasOpen;
    openModal(msg ? "Request to drop" : "Reason for this change", `<p style="margin-top:0">${msg ? esc(msg) : `You are changing the <b>${esc(what.join(", "))}</b>${taskLabel ? ` of ${esc(taskLabel)}` : ""}. Write why. It is saved in the task history with your name.`}</p><label class="f">Reason<textarea id="rsn" rows="3" placeholder="e.g. Supplier delayed samples by a week"></textarea></label>`, `<button class="btn pri" data-act="rsnok">Save change</button><button class="btn ghost" data-act="rsnno">Cancel</button>`);
    setTimeout(() => $("#rsn") && $("#rsn").focus(), 50);
  });
}
function askConfirm(title, html, ok, danger) {
  return new Promise(res => {
    const prev = $("#modal").classList.contains("open") ? { t: $("#mt").textContent, b: $("#mb").innerHTML, f: $("#mf").innerHTML } : null;
    RSN = res; RSN.prev = prev;
    openModal(title, html, `<button class="btn ${danger ? "danger" : "pri"}" data-act="cnfok">${esc(ok)}</button><button class="btn ghost" data-act="rsnno">Cancel</button>`);
  });
}
function endReason(v) { const r = RSN; RSN = null; if (!r) return; if (r.prev) { $("#mt").textContent = r.prev.t; $("#mb").innerHTML = r.prev.b; $("#mf").innerHTML = r.prev.f; } else closeModal(); r(v); }
const kids = t => tasks.filter(x => x.parent_id === t.id && x.owner_id === t.owner_id);
const parentOf = t => t.parent_id ? tById(t.parent_id) : null;
function subInfo(t) { const K = kids(t), f = fwd.get(t.id); const total = K.length + (f ? f.total : 0), done = K.filter(k => k.status === "Completed").length + (f ? f.done : 0); return total ? { total, done, fw: f } : null; }
const personOf = t => people.find(p => p.id === t.person_id);
function countdown(t) {
  const f = flag(t);
  if (f === "Awaiting validation") return `<span class="chip c-await">Awaiting validation</span>`;
  if (f === "Done") return `<span class="chip c-ok">${ic("check")} Done</span>`;
  if (f === "Dropped") return `<span class="chip">Dropped</span>`;
  if (f === "No due date") return `<span class="chip">No due date</span>`;
  const d = left(t);
  if (d < 0) return `<span class="chip c-over">${pl(-d, "day")} overdue</span>`;
  if (d === 0 && t.due_time) { const m = minsLeftToday(t); return m <= 0 ? `<span class="chip c-over">${dur(-m)} overdue</span>` : `<span class="chip c-today">${dur(m)} left</span>`; }
  if (d === 0) return `<span class="chip c-today">Due today</span>`;
  if (d <= SOON_DAYS) return `<span class="chip ${d <= 3 ? "c-urgent" : "c-soon"}">${pl(d, "day")} left</span>`;
  return `<span class="chip c-ok">On track</span>`;
}
const cdText = t => { const d = left(t); if (!isOpen(t) || d === null) return ""; if (d === 0 && t.due_time) { const m = minsLeftToday(t); return m <= 0 ? `${dur(-m)} overdue` : `${dur(m)} left`; } return d < 0 ? `${pl(-d, "day")} overdue` : d === 0 ? "due today" : `${pl(d, "day")} left`; };
function toast(m, undo) {
  const e = $("#toast"); e.innerHTML = ""; const sp = document.createElement("span"); sp.textContent = m; e.appendChild(sp);
  if (undo) { const b = document.createElement("button"); b.textContent = "Undo"; b.onclick = async () => { e.style.display = "none"; try { await undo(); await reload(); toast("Undone"); } catch (err) { toast(errMsg(err)); } }; e.appendChild(b); }
  e.style.display = "flex"; clearTimeout(toast.t); toast.t = setTimeout(() => e.style.display = "none", undo ? 7000 : 2800);
}
function errMsg(e) {
  const m = (e && (e.message || e.error_description)) || "Something went wrong";
  if (/fetch|network/i.test(m)) return "No connection. Check your internet and try again.";
  if (/NOT_INVITED|Database error saving new user/i.test(m)) return "This email has not been invited. Ask the person who runs this site to invite you.";
  return m.replace(/^.*?ERROR:\s*/, "");
}
const undoTo = t => () => api.updateTask(t.id, { status: t.status, validated: !!t.validated && t.status === "Completed" });

/* =========================================================== shell */
const VIEWS = { today: ["Today", "home"], tasks: ["Tasks", "tasks"], calendar: ["Calendar", "cal"], reports: ["Reports", "chart"], team: ["Team", "team"], templates: ["Templates", "tpl"], settings: ["Settings", "gear"], accounts: ["Accounts", "invite"], more: ["More", "more"] };
function view() { const v = (location.hash || "#today").slice(1); if (v === "accounts" && !me?.is_admin) return "today"; return VIEWS[v] ? v : "today"; }
function attention() { const T = tasks.filter(mine); return T.filter(dropReq).length + T.filter(t => flag(t) === "Overdue").length + T.filter(dueToday).length + T.filter(awaiting).length; }
function renderShell() {
  const v = view(), T = tasks.filter(mine);
  const nav = [["today", attention()], ["tasks", T.filter(needsAction).length], ["calendar"], ["reports"], ["team", team().length], ["templates", templates.length || ""], ["settings"]];
  if (me.is_admin) nav.push(["accounts"]);
  $("#nav").innerHTML = nav.map(([k, c], i) => `${i === 4 ? `<div class="navlabel">Manage</div>` : ""}<a href="#${k}" class="${v === k ? "on" : ""}" title="${VIEWS[k][0]}">${ic(VIEWS[k][1])}<span class="nl">${VIEWS[k][0]}</span>${c ? `<span class="cnt${k === "today" ? " hot" : ""}">${c}</span>` : ""}</a>`).join("");
  $("#tabbar").innerHTML = ["today", "tasks", "calendar", "reports", "more"].map(k => `<a href="#${k}" class="${v === k || (k === "more" && ["team", "templates", "settings", "accounts"].includes(v)) ? "on" : ""}">${ic(VIEWS[k][1])}${VIEWS[k][0]}</a>`).join("");
  const nm = me.full_name || me.email;
  $("#meav").outerHTML = `<div class="av" id="meav" style="${avStyle(nm)}">${esc(initials(nm))}</div>`;
  $("#menm").textContent = nm; $("#meem").textContent = me.email; $("#meem").title = me.email;
  const mini = $(".shell").classList.contains("mini"), sb = $(".sbtn");
  sb.innerHTML = ic(mini ? "chevr" : "chevl"); sb.title = sb.ariaLabel = mini ? "Expand sidebar" : "Collapse sidebar";
  const n = attention() + newOthers().length + noteSugg().length;
  $$("[data-badge]").forEach(b => { b.hidden = !n; b.textContent = n > 99 ? "99+" : n; });
  $$('[data-act="bell"]').forEach(b => b.innerHTML = ic("bell"));
  $("#add").innerHTML = `${ic("plus")} New task`; $("#fab").innerHTML = ic("plus");
  $("#px").innerHTML = ic("x"); $("#mx").innerHTML = ic("x");
  paintMode();
}
function render() {
  if (!api) { showLogin(); $("#lerr").textContent = "This copy is not connected to a database yet. Fill in config.js (see README)."; return; }
  if (!me) { showLogin(); return; }
  $("#login").hidden = true; $("#app").hidden = false;
  const v = view();
  document.body.dataset.page = v;
  renderShell();
  const T = tasks.filter(inScope);
  const titles = { today: [greeting(), ""], tasks: ["Tasks", `${T.filter(needsAction).length} open · ${T.filter(t => flag(t) === "Overdue").length} overdue`], calendar: ["Calendar", "Due dates by day"], reports: ["Reports", "How the team is delivering"], team: ["Team", "The people you give tasks to. Names only; they need no login."], templates: ["Templates", "Reusable tasks with their checklist"], settings: ["Settings", "Your account, lists and data"], accounts: ["Accounts", "Everyone who has signed up. You see names only, never their tasks."], more: ["More", ""] };
  $("#ptitle").textContent = titles[v][0]; $("#psub").textContent = titles[v][1];
  const ae = document.activeElement, keep = ae && ae.id === "q2" ? ae.selectionStart : null;
  $("#page").innerHTML = { today: viewToday, tasks: viewTasks, calendar: viewCalendar, reports: viewReports, team: viewTeam, templates: viewTemplates, settings: viewSettings, accounts: viewAccounts, more: viewMore }[v]();
  if (keep !== null && $("#q2")) { const i = $("#q2"); i.focus(); i.setSelectionRange(keep, keep); }
}
const nowText = () => { const d = new Date(); return `${d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })} · ${hm(String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0"))}`; };
/* Keep the clock, greeting and time-based countdowns current. */
setInterval(() => { if (!me || document.hidden) return; if (view() === "today") { $("#ptitle").textContent = greeting(); const c = heroClock(); if ($("#hclock")) { $("#hclock").textContent = c.t; $("#hdate").textContent = c.d; } } }, 10000);
let lastMin = -1; setInterval(() => { const m = nowMin(); if (m === lastMin || !me || document.hidden) return; lastMin = m; const busy = document.body.classList.contains("p-open") || $("#modal").classList.contains("open") || (document.activeElement && document.activeElement.matches && document.activeElement.matches("#page input, #page textarea, #page select")); if (!busy && tasks.some(t => isOpen(t) && t.due_time && left(t) === 0)) render(); }, 15000);
const greeting = () => { const h = new Date().getHours(), n = (me.full_name || "").split(" ")[0]; return `${h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening"}${n ? ", " + n : ""}`; };
function showLogin() {
  $("#app").hidden = true; $("#login").hidden = false;
  const fg = lmode === "forgot", rc = lmode === "recover", su = signup && !lmode;
  $("#lname-wrap").hidden = !su; $("#lname").required = su;
  $("#lemail-wrap").hidden = rc; $("#lemail").required = !rc;
  $("#lpass-wrap").hidden = fg; $("#lpass").required = !fg;
  $("#lpass2-wrap").hidden = !rc; $("#lpass2").required = rc;
  $("#lpass-lbl").textContent = rc ? "New password" : "Password";
  $("#ltitle").textContent = rc ? "Set a new password" : fg ? "Reset your password" : su ? "Create your account" : "Task Tracker";
  $("#lintro").textContent = rc ? "Choose a new password of at least 8 characters." : fg ? "Enter your account email. We will send you a link to set a new password." : su ? "You get your own private team tracker. Nobody else can see your tasks." : "Sign in to your private team tracker.";
  $("#lbtn").textContent = rc ? "Save new password" : fg ? "Send reset link" : su ? "Create account" : "Sign in";
  $("#lswitch").textContent = lmode ? "Back to sign in" : su ? "I already have an account" : "New here? Create an account";
  $("#lforgot").hidden = !!lmode || su;
  $("#lpass").autocomplete = rc || su ? "new-password" : "current-password";
  paintMode();
}
function scopeBar() {
  if (!sharedTasks().length) { scope = "mine"; return ""; }
  const c = k => tasks.filter(t => k === "shared" ? !mine(t) : mine(t)).filter(needsAction).length;
  return `<div class="seg" style="margin-bottom:14px">${[["mine", "My tracker"], ["shared", "Shared with me"]].map(([k, l]) => `<button class="${scope === k ? "on" : ""}" data-scope="${k}">${l}<span>${c(k)}</span></button>`).join("")}</div>`;
}

/* =========================================================== notifications */
/* The bell list lives at page level so it shows on phones too, where the desktop header is hidden. */
document.body.appendChild($("#pop"));
const lastSeen = () => ls.get("tt-seen-" + me.id) || "1970-01-01";
const byOther = a => a.author_id ? a.author_id !== me.id : !!a.author_name && a.author_name !== me.full_name;
const newOthers = () => activity.filter(a => byOther(a) && a.created_at > lastSeen() && tById(a.task_id));
function bellPop() {
  const T = tasks.filter(mine), od = T.filter(t => flag(t) === "Overdue"), td = T.filter(dueToday), aw = T.filter(awaiting), bl = T.filter(blockedT), no = newOthers();
  const row = (icon, txt, sub, attrs) => `<a href="#tasks" ${attrs}>${ic(icon)}<span><b>${txt}</b><br><span class="sub">${sub}</span></span></a>`;
  let h = `<div class="pop">`;
  if (od.length) h += row("flag", pl(od.length, "task") + " overdue", "Oldest: " + esc(od.sort((a, b) => left(a) - left(b))[0].title), 'data-pf="Overdue"');
  if (td.length) h += row("cal", pl(td.length, "task") + " due today", esc(td.map(t => t.title + (t.due_time ? " (" + hm(t.due_time) + ")" : "")).slice(0, 2).join(", ")), 'data-pf="today"');
  const dr = T.filter(dropReq); if (dr.length) h += row("flag", pl(dr.length, "drop request") + " to confirm", esc(dr.map(t => "#" + t.no + " " + t.title).slice(0, 2).join(", ")), 'data-pf="dropreq"');
  if (aw.length) h += row("check", pl(aw.length, "task") + " awaiting your validation", "Check the work, then press Validate & close", 'data-pf="Awaiting validation"');
  if (bl.length) h += row("lock", pl(bl.length, "task") + " blocked", "Waiting for another task to finish", 'data-pf="blocked"');
  if (no.length) h += `<h4>New from others</h4>` + no.slice(0, 6).map(a => { const t = tById(a.task_id); return `<a href="#today" data-open="${t.id}">${av(a.author_name, 1)}<span><b>#${t.no} ${esc(t.title)}</b><br><span class="sub">${esc(a.author_name)}: ${esc(a.body)} · ${ago(a.created_at)}</span></span></a>`; }).join("");
  const ns = noteSugg(); if (ns.length) h += `<h4>New colleagues</h4><div class="sglist pops">${ns.slice(0, 6).map(a => sgRow(a, true)).join("")}</div>${ns.length > 6 ? `<a href="#team" data-gocol="1"><span class="sub">See all ${ns.length} under Colleagues</span></a>` : ""}`;
  if (!od.length && !td.length && !aw.length && !bl.length && !no.length && !ns.length) h += `<div class="empty">All clear. Nothing needs you right now.</div>`;
  return h + `</div>`;
}
function toggleBell(btn) {
  const host = $("#pop"), open = host.innerHTML !== "";
  try { host.innerHTML = open ? "" : bellPop(); } catch (e) { host.innerHTML = `<div class="pop"><div class="empty">Could not load notifications. Refresh the page.</div></div>`; console.error(e); }
  if (!open) { ls.set("tt-seen-" + me.id, new Date().toISOString()); setTimeout(renderShell, 50); }
}

/* =========================================================== Today */
function viewToday() {
  const T = tasks.filter(inScope), O = T.filter(isOpen);
  let h = scopeBar();
  if (!tasks.length) return h + `<div class="card"><h2>Welcome. This tracker is private to you.</h2><p class="sub" style="margin:0 0 12px">Your team members do not need a login and cannot see it.</p><div class="row"><a class="btn pri" href="#team">${ic("team")} Add your team</a><button class="btn" data-act="new">${ic("plus")} Create the first task</button><button class="btn" data-act="import">${ic("xls")} Import from Excel</button></div></div>`;
  const k = [["Open", O.length, "", { view: "open" }], ["Overdue", T.filter(t => flag(t) === "Overdue").length, "red", { flag: "Overdue" }], ["Due in 10 days", T.filter(t => flag(t) === "Due soon").length, "amber", { flag: "Due soon" }],
    ["To validate", T.filter(awaiting).length, "orange", { flag: "Awaiting validation" }], [`No update ${STALE_DAYS}+ days`, O.filter(isStale).length, "orange", { flag: "stale" }], ["Closed this week", T.filter(closed7).length, "green", { flag: "closed7", view: "closed" }]];
  viewToday.k = k;
  h += heroPanel(T, k);
  const sec = (title, arr, icn) => arr.length ? `<h4>${ic(icn)} ${title} <span class="sub">${arr.length}</span></h4>` + arr.slice(0, 6).map(t => `<a href="#today" data-open="${t.id}"><span><b style="font-weight:500">${esc(t.title)}</b></span>${countdown(t)}<span class="sub">#${t.no}${t.person_id ? " · " + esc(pName(t.person_id)) : ""}${blockedT(t) ? " · blocked by #" + blockedT(t).no : ""}</span></a>`).join("") + (arr.length > 6 ? `<a href="#tasks" data-pf="${title === "Overdue" ? "Overdue" : ""}" class="sub">+ ${arr.length - 6} more</a>` : "") : "";
  const sortU = a => a.sort((x, y) => urgency(x) - urgency(y));
  const att = sec("Overdue", sortU(T.filter(t => flag(t) === "Overdue")), "flag") + sec("Due in the next 3 days", sortU(O.filter(t => left(t) !== null && left(t) >= 0 && left(t) <= 3 && flag(t) !== "Overdue")), "cal") + sec("Drop requests to confirm", T.filter(dropReq), "flag") + sec("Awaiting your validation", T.filter(awaiting), "check") + sec("Blocked", O.filter(blockedT), "lock") + sec("Urgent, no due date", O.filter(t => urgentT(t) && !t.due_date), "flag");
  h += `<div class="grid2"><div class="card"><h2>Needs your attention</h2><div class="alist">${att || `<div class="empty">Nothing urgent. Good week.</div>`}</div></div><div class="stack">`;
  const groups = {}; for (const t of T.filter(needsAction)) { const p = mine(t) ? t.person_id || 0 : -1; (groups[p] = groups[p] || []).push(t); }
  const rows = Object.entries(groups).map(([p, G]) => ({ p: +p, open: G.filter(isOpen).length, od: G.filter(t => flag(t) === "Overdue").length, av: G.filter(awaiting).length })).sort((a, b) => b.od - a.od || b.open - a.open);
  const lab = p => p === -1 ? "Shared with me" : p ? pName(p) : "Unassigned";
  h += `<div class="card"><h2>Team workload</h2><div class="tw"><table class="t"><thead><tr><th>Person</th><th class="n">Open</th><th class="n">Overdue</th><th class="n">To validate</th></tr></thead><tbody>${rows.map(r => `<tr class="click" data-pf-person="${r.p}"><td><span class="row" style="gap:8px">${av(lab(r.p), 1)}${esc(lab(r.p))}</span></td><td class="n">${r.open}</td><td class="n${r.od ? " hot" : ""}">${r.od}</td><td class="n">${r.av}</td></tr>`).join("") || `<tr><td colspan="4" class="sub">Nothing open.</td></tr>`}</tbody></table></div></div>`;
  const ids = new Set(T.map(t => t.id)), A = activity.filter(a => ids.has(a.task_id)).slice(0, 10);
  h += `<div class="card act"><h2>Recent activity</h2>${A.map(a => { const t = tById(a.task_id), other = byOther(a); return `<a href="#today" data-open="${t.id}" class="${other ? "other" : ""}">${av(a.author_name || "?", 1)}<span class="body"><b>#${t.no} ${esc(t.title)}</b><div>${esc(a.body)}</div><span class="tiny">${esc(a.author_name || "")} · ${ago(a.created_at)}</span></span></a>`; }).join("") || `<span class="sub">Changes and updates will show here.</span>`}</div></div></div>`;
  return h;
}

/* Today hero: a charger-style load bar with one block per open task, most urgent first. */
const segKind = t => flag(t) === "Overdue" ? "od" : awaiting(t) ? "aw" : flag(t) === "Due soon" ? "soon" : flag(t) === "On track" ? "ok" : "nd";
const SEG_ORDER = ["od", "soon", "aw", "ok", "nd"];
function heroClock() { const d = new Date(); return { t: hm(String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0")), d: d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) }; }
function heroPanel(T, k) {
  const NA = T.filter(needsAction), cnt = Object.fromEntries(SEG_ORDER.map(x => [x, 0]));
  NA.forEach(t => cnt[segKind(t)]++);
  const N = NA.length, MAX = 48;
  let blocks = [];
  if (N <= MAX) SEG_ORDER.forEach(x => { for (let i = 0; i < cnt[x]; i++) blocks.push(x); });
  else {
    const raw = SEG_ORDER.map(x => ({ x, v: cnt[x] * MAX / N })), base = raw.map(r => ({ ...r, n: cnt[r.x] ? Math.max(1, Math.floor(r.v)) : 0 }));
    let left2 = MAX - base.reduce((a, r) => a + r.n, 0);
    [...base].sort((a, b) => (b.v - Math.floor(b.v)) - (a.v - Math.floor(a.v))).forEach(r => { if (left2 > 0 && cnt[r.x]) { r.n++; left2--; } });
    base.forEach(r => { for (let i = 0; i < r.n; i++) blocks.push(r.x); });
  }
  const parts = [cnt.od && `${cnt.od} overdue`, cnt.aw && `${cnt.aw} waiting for your validation`, cnt.soon && `${cnt.soon} due in the next ${SOON_DAYS} days`].filter(Boolean);
  const sum = !N ? "Nothing open. Add a task to get started." : parts.length ? parts.join(", ").replace(/, ([^,]*)$/, " and $1") + "." : "Everything open is on track.";
  const label = `${N} open: ${cnt.od} overdue, ${cnt.soon} due soon, ${cnt.aw} to validate, ${cnt.ok} on track, ${cnt.nd} without a due date`;
  const sw = { 1: "od", 2: "soon", 3: "aw" }, c = heroClock();
  return `<section class="hero">
    <div class="hl"><div class="hclock" id="hclock">${esc(c.t)}</div><div class="hdate" id="hdate">${esc(c.d)}</div><p class="hsum">${esc(sum)}</p></div>
    <div class="hr">
      <div class="chg${N ? "" : " empty"}" role="img" aria-label="${esc(label)}">${(N ? blocks : Array(24).fill("x")).map(x => `<i class="s-${x}"></i>`).join("")}</div>
      <p class="chgcap">${N ? `One block per open task, most urgent first.${N > MAX ? ` Scaled to ${MAX} blocks.` : ""} Green is on track, grey has no due date.` : "No open tasks."}</p>
      <div class="reads">${k.map((x, i) => `<button class="read ${x[2]}" data-act="kpi" data-i="${i}"><b>${x[1]}</b><span>${sw[i] ? `<i class="sw s-${sw[i]}"></i>` : ""}${esc(x[0])}</span></button>`).join("")}</div>
    </div></section>`;
}

/* =========================================================== Tasks */
function filtered(src) {
  const q = (F.q || "").toLowerCase();
  return (src || tasks.filter(inScope)).filter(t => {
    if (F.view === "open" && !needsAction(t)) return false;
    if (F.view === "closed" && needsAction(t)) return false;
    if (F.person !== "" && String(t.person_id || 0) !== String(F.person)) return false;
    if (F.team && !(t.person_id && pTeams(people.find(p => p.id === t.person_id) || {}).includes(F.team))) return false;
    if (F.cat && (t.category || "(none)") !== F.cat) return false;
    if (F.status && t.status !== F.status) return false;
    if (F.urgent && !urgentT(t)) return false;
    if (F.flag === "stale" && !isStale(t)) return false;
    if (F.flag === "closed7" && !closed7(t)) return false;
    if (F.flag === "missing" && !missing(t)) return false;
    if (F.flag === "blocked" && !blockedT(t)) return false;
    if (F.flag === "today" && !(isOpen(t) && left(t) === 0)) return false; /* includes ones whose time has passed */
    if (F.flag === "repeat" && !t.recurrence) return false;
    if (F.flag === "dropreq" && !dropReq(t)) return false;
    if (F.flag && !["stale", "closed7", "missing", "blocked", "today", "repeat", "dropreq"].includes(F.flag) && flag(t) !== F.flag) return false;
    if (q && !`${t.no} ${t.title} ${t.latest_update || ""} ${t.waiting_on || ""} ${pName(t.person_id)} ${t.category || ""} ${cl(t).map(c => c.text).join(" ")}`.toLowerCase().includes(q)) return false;
    return true;
  }).sort((a, b) => { if (sort.k === "urgency") return urgency(a) - urgency(b) || a.no - b.no; const x = a[sort.k] ?? "", y = b[sort.k] ?? ""; if (x === y) return a.no - b.no; if (x === "") return 1; if (y === "") return -1; return (x < y ? -1 : 1) * sort.d; });
}
const opt = (arr, cur, all) => (all !== null ? `<option value="">${all}</option>` : "") + arr.map(([v, l]) => `<option value="${esc(v)}"${String(v) === String(cur) ? " selected" : ""}>${esc(l)}</option>`).join("");
const allCats = () => [...new Set([...cats.map(c => c.name), ...tasks.filter(mine).map(t => t.category).filter(Boolean)])].sort();
/* Latest update on the row, with the earlier ones one tap away. */
function updBlock(t) {
  const N = notesBy.get(t.id) || [];
  if (!N.length) return t.latest_update ? `<div class="upd">${esc(t.latest_update)}</div>` : "";
  const more = N.length - 1, open = openUpd.has(t.id);
  return `<div class="upd"><span class="ud">${esc(shortDate(N[0].created_at))}</span> ${esc(N[0].body)}</div>${more ? `<button type="button" class="updmore" data-upd="${t.id}">${open ? "Hide" : "Show"} ${pl(more, "earlier update")}</button>` : ""}${open ? `<div class="updlist">${N.slice(1).map(n => `<div><span class="ud">${esc(shortDate(n.created_at))}${n.author_name ? " · " + esc(n.author_name) : ""}</span>${esc(n.body)}</div>`).join("")}</div>` : ""}`;
}
const shortDate = s => { const d = new Date(s); return `${d.getDate()} ${MON[d.getMonth()]}${d.getFullYear() !== new Date().getFullYear() ? " " + String(d.getFullYear()).slice(2) : ""}`; };
function taskRow(t) {
  const ago2 = t.updated_on ? days(t.updated_on, TODAY()) : null, c = cl(t), cd = c.filter(x => x.done).length, b = blockedT(t);
  const who = mine(t) ? (t.person_id ? `<span class="who">${av(pName(t.person_id), 1)}${esc(pName(t.person_id))}</span>` : `<span class="who sub">Unassigned</span>`) : `<span class="chip c-blue">Shared with you</span>`;
  return `<div class="trow${needsAction(t) ? "" : " closed"}${flag(t) === "Overdue" ? " od" : ""}${selected.has(t.id) ? " sel" : ""}${openUpd.has(t.id) ? " xo" : ""}" data-u="${needsAction(t) ? segKind(t) : "done"}" data-id="${t.id}">
    <span class="ckc">${true ? `<input type="checkbox" data-sel="${t.id}" aria-label="Select task ${t.no}"${selected.has(t.id) ? " checked" : ""}>` : ""}</span>
    <span class="no">#${t.no}</span>
    <div class="mn"><div class="tt">${urgentT(t) ? `<span class="flag-urgent">${ic("flag")} Urgent</span> ` : ""}${esc(t.title)}</div>
      <div class="meta">${who}${t.category ? `<span class="tag">${esc(t.category)}</span>` : ""}${c.length ? `<button type="button" class="clchip${openCl.has(t.id) ? " on" : ""}" data-clrow="${t.id}" title="Show checklist">${ic("check")} ${cd}/${c.length}</button>` : ""}${dropReq(t) ? `<span class="chip c-over">Drop requested</span>` : ""}${(() => { const s = subInfo(t); return s ? `<span class="chip c-blue" title="Subtasks done">${ic("tasks")} ${s.done}/${s.total} subtasks</span>` : ""; })()}${mine(t) && cl(t).some(x => x.share) ? `<span class="tag" title="Checklist items shared with: ${esc([...new Set(cl(t).filter(x => x.share).map(x => pName(x.person_id)))].join(", "))}">${ic("team")} shared items</span>` : ""}${t.parent_id ? `<span class="sub" title="Subtask">&#8627; part of #${parentOf(t) ? parentOf(t).no + (parentOf(t).owner_id !== t.owner_id ? " (shared with you)" : "") : "?"}</span>` : ""}${mine(t) && t.person_id && personOf(t) && personOf(t).shared ? (t.assignee_can_see === false ? `<span class="tag" title="Hidden from ${esc(pName(t.person_id))}">${ic("lock")} hidden</span>` : !canArr(t).length ? `<span class="tag">view only</span>` : !sameSet(canArr(t), DEF_CAN) ? `<span class="tag" title="${esc(pName(t.person_id))} may change: ${esc(rightsText(canArr(t)))}">custom rights</span>` : "") : ""}${!mine(t) && isMember(t) ? `<span class="chip c-blue">checklist item for you</span>` : !mine(t) && !canArr(t).length ? `<span class="tag">view only</span>` : ""}${t.recurrence ? `<span title="Repeats">${ic("repeat")} ${esc(REPEAT.find(r => r[0] === t.recurrence)[1])}</span>` : ""}${b ? `<span class="chip c-blue">${ic("lock")} Blocked by #${b.no}</span>` : ""}${t.waiting_on ? `<span>Waiting on: ${esc(t.waiting_on)}</span>` : ""}${missing(t) ? `<span class="miss" title="Fill these in so the task can be tracked">Missing: ${missingList(t).join(", ")}</span>` : ""}</div>
      ${openCl.has(t.id) && c.length ? `<div class="rowcl">${c.map((x, i) => `<label class="chk"><input type="checkbox" data-rcl="${t.id}:${i}"${x.done ? " checked" : ""}${can(t, "checklist") || myItem(t, x) ? "" : " disabled"}> <span${x.done ? ' class="dn"' : ""}>${esc(x.text)}</span>${itemWho(x) ? ` <span class="tag">${esc(itemWho(x))}</span>` : ""}</label>`).join("")}${can(t, "checklist") && cd < c.length ? `<button type="button" class="linkb" data-rclall="${t.id}">Tick all</button>` : ""}</div>` : ""}
      ${updBlock(t)}</div>
    <span class="stc"><select data-qs="${t.id}" data-st="${esc(t.status || "")}" aria-label="Status"${can(t, "status") ? "" : " disabled title=\"You cannot change the status\""}>${statOpts(t).map(s => `<option${s === t.status ? " selected" : ""}>${s}</option>`).join("")}</select>${awaiting(t) && mine(t) ? ` <button class="btn sm brand" data-val="${t.id}">Validate &amp; close</button>` : ""}</span>
    <span class="due">${t.due_date ? `<span>${esc(dueText(t))}</span>` : ""}${countdown(t)}</span>
    <span class="ago${isStale(t) ? " stale" : ""}">${ago2 === null ? "Never" : ago2 === 0 ? "Today" : ago2 + "d ago"}</span></div>`;
}
function viewTasks() {
  const S = tasks.filter(inScope), R = filtered(S);
  const vc = { open: S.filter(needsAction).length, closed: S.filter(t => !needsAction(t)).length, all: S.length };
  const nf = ["person", "cat", "status", "flag"].filter(k => F[k] !== "").length + (F.urgent ? 1 : 0);
  const fl = [["Overdue", "Overdue"], ["today", "Due today"], ["Due soon", "Due in 10 days"], ["No due date", "No due date"], ["On track", "On track"], ["Awaiting validation", "Awaiting validation"], ["blocked", "Blocked"], ["dropreq", "Drop requested"], ["repeat", "Repeating"], ["stale", `No update ${STALE_DAYS}+ days`], ["missing", "Missing details"], ["closed7", "Closed this week"], ["Done", "Done and validated"], ["Dropped", "Dropped"]];
  let h = scopeBar() + `<label class="search m"><input type="search" id="q2" placeholder="Search tasks" value="${esc(F.q)}"></label>
  <div class="toolbar"><div class="seg">${[["open", "Open"], ["closed", "Closed"], ["all", "All"]].map(([k, l]) => `<button class="${F.view === k ? "on" : ""}" data-view="${k}">${l}<span>${vc[k]}</span></button>`).join("")}</div>
  ${laySeg("tasks", [["list", "List", "list"], ["board", "Board", "board"]])}
  <button class="btn" data-act="ftog">${ic("list")} Filters${nf ? ` (${nf})` : ""}</button>
  ${LAY.tasks === "board" ? `<select data-boardby style="width:auto;min-height:38px;font-size:13.5px" aria-label="Board columns">${opt([["status", "Columns: status"], ["person", "Columns: person"]], LAY.board, null)}</select>` : `<select data-group style="width:auto;min-height:38px;font-size:13.5px" aria-label="Group by">${opt([["none", "No grouping"], ["person", "Group by person"], ["category", "Group by category"], ["status", "Group by status"], ["due", "Group by due week"]], F.group, null)}</select>`}
  <span class="grow"></span><button class="btn" data-act="import">${ic("up")} Import</button><button class="btn" data-act="export">${ic("xls")} Export to Excel</button></div>`;
  if (showF || nf) h += `<div class="filters">
    ${scope === "mine" ? `<select data-f="person">${opt([...team().map(p => [p.id, p.name]), [0, "Unassigned"]], F.person, "Everyone")}</select>` : ""}
    ${scope === "mine" && allTeams().length ? `<select data-f="team">${opt(allTeams().map(x => [x, x]), F.team, "All teams")}</select>` : ""}
    <select data-f="cat">${opt([...allCats(), "(none)"].map(c => [c, c]), F.cat, "All categories")}</select>
    <select data-f="status">${opt(STAT.map(s => [s, s]), F.status, "All statuses")}</select>
    <select data-f="flag">${opt(fl, F.flag, "Any flag")}</select>
    <label class="chk" style="flex:0 0 auto"><input type="checkbox" data-t="urgent"${F.urgent ? " checked" : ""}> Urgent only</label>
    <button class="btn sm ghost" data-act="clear">Clear filters</button></div>`;
  const SEL = tasks.filter(t => selected.has(t.id)), selOwn = SEL.filter(mine).length, selShared = SEL.length - selOwn;
  if (selected.size) h += `<div class="selbar"><b>${selected.size} selected${selShared ? ` <span class="sub" style="color:inherit;opacity:.75">(${selShared} shared with you)</span>` : ""}</b>
    <select data-bulk="status" aria-label="Set status"><option value="">Set status</option>${STAT.filter(s => s !== "Dropped").map(s => `<option>${s}</option>`).join("")}</select>
    ${selOwn ? `<select data-bulk="person_id" aria-label="Assign to"><option value="">Assign to</option>${team().map(p => `<option value="${p.id}">${esc(p.name)}</option>`).join("")}<option value="0">Unassigned</option></select>` : ""}
    <select data-bulk="category" aria-label="Category"><option value="">Category</option>${allCats().map(c => `<option>${esc(c)}</option>`).join("")}</select>
    <input type="date" data-bulk="due_date" aria-label="Set due date" title="Set due date">
    ${selOwn ? `<select data-bulk="access" aria-label="Assignee access"><option value="">Assignee access</option><option value="hide">Hide from assignee</option><option value="show">Show to assignee</option><option value="view">View only (no edits)</option><option value="update">Default rights</option><option value="edit">Allow all edits</option></select>` : ""}
    <button class="btn" data-act="bulkdone">${ic("check")} Mark completed</button>
    <button class="btn" data-act="bulkfwd">${ic("up")} Forward</button>
    <button class="btn" data-act="bulkurgent">${ic("flag")} Urgent on/off</button>
    <button class="btn" data-act="mailsel">${ic("mail")} Email</button>
    <button class="btn" data-act="exportsel">${ic("xls")} Excel</button>
    ${selOwn ? `<button class="btn danger" data-act="bulkdel">${ic("x")} Delete</button>` : ""}
    <span class="grow"></span><button class="btn" data-act="selnone">Clear</button></div>`;
  if (LAY.tasks === "board") return h + viewBoard(R);
  const allSel = R.length && R.every(t => selected.has(t.id));
  const head = `<div class="thead"><span><input type="checkbox" data-selall="1" aria-label="Select all shown"${allSel ? " checked" : ""}></span><span data-sort="no">No.</span><span data-sort="title">Task</span><span data-sort="status">Status</span><span data-sort="due_date">Due</span><span data-sort="updated_on">Updated</span></div>`;
  if (!R.length) return h + `<div class="tlist">${head}<div class="empty">${S.length ? "No tasks match. Try another tab or clear the filters." : "No tasks yet."}</div></div>`;
  let body = "";
  if (F.group === "none") body = R.map(taskRow).join("");
  else {
    const key = t => F.group === "person" ? (mine(t) ? pName(t.person_id) || "Unassigned" : "Shared with you") : F.group === "category" ? t.category || "No category" : F.group === "status" ? t.status : (() => { const d = left(t); if (!needsAction(t)) return "Closed"; if (d === null) return "No due date"; if (d < 0) return "Overdue"; if (d <= 7) return "This week"; if (d <= 14) return "Next week"; return "Later"; })();
    const order = F.group === "status" ? STAT : F.group === "due" ? ["Overdue", "This week", "Next week", "Later", "No due date", "Closed"] : null;
    const G = {}; R.forEach(t => (G[key(t)] = G[key(t)] || []).push(t));
    const names = Object.keys(G).sort((a, b) => order ? order.indexOf(a) - order.indexOf(b) : a.localeCompare(b));
    body = names.map(n => `<div class="ghead">${F.group === "person" ? av(n, 1) : ""}${esc(n)} <span class="sub">${G[n].length}</span></div>` + G[n].map(taskRow).join("")).join("");
  }
  return h + `<div class="tlist">${head}${body}</div><p class="tiny" style="margin-top:8px">${R.length} shown · ${sort.k === "urgency" ? "most urgent first" : "sorted by column, click Clear filters to reset"} · press N for a new task</p>`;
}

/* =========================================================== Board */
function boardCols(R) {
  if (LAY.board === "person" && scope === "mine") {
    const cols = [...team().map(p => ({ key: "p" + p.id, label: p.name, pid: p.id, av: true })), { key: "p0", label: "Unassigned", pid: null }];
    return cols.map(c => ({ ...c, items: R.filter(t => (t.person_id || null) === c.pid) })).filter(c => c.items.length || c.pid !== null || true);
  }
  const cols = [["Not Started", t => t.status === "Not Started"], ["In Progress", t => t.status === "In Progress"], ["On Hold", t => t.status === "On Hold"], ["Awaiting validation", awaiting]];
  if (F.view !== "open") cols.push(["Closed", t => !needsAction(t)]);
  return cols.map(([label, f]) => ({ key: "s" + label, label, items: R.filter(f) }));
}
function viewBoard(R) {
  const cols = boardCols(R);
  const card = t => `<div class="bcard${flag(t) === "Overdue" ? " od" : ""}" data-u="${needsAction(t) ? segKind(t) : "done"}" draggable="${can(t, "status") || mine(t)}" data-bid="${t.id}" data-open="${t.id}" tabindex="0">
    <div class="bt">${urgentT(t) ? `<span class="flag-urgent">${ic("flag")}</span> ` : ""}<span class="no">#${t.no}</span> ${esc(t.title)}</div>
    <div class="bm">${LAY.board === "status" && t.person_id && mine(t) ? `<span class="who">${av(pName(t.person_id), 1)}${esc(pName(t.person_id))}</span>` : ""}${!mine(t) ? `<span class="chip c-blue">Shared</span>` : ""}${(() => { const s = subInfo(t); return s ? `<span class="tag">${s.done}/${s.total} sub</span>` : ""; })()}${cl(t).length ? `<span class="tag">${ic("check")} ${cl(t).filter(x => x.done).length}/${cl(t).length}</span>` : ""}</div>
    <div class="bd">${t.due_date ? `<span class="sub">${esc(dueText(t))}</span>` : ""}${countdown(t)}</div></div>`;
  return `<div class="board">${cols.map(c => `<div class="bcol" data-col="${c.key}"><div class="bh">${c.av ? av(c.label, 1) : `<i class="dot" style="background:${SCOL[c.label] || (c.label === "Awaiting validation" ? "var(--s-aw)" : "var(--faint)")}"></i>`}<b>${esc(c.label)}</b><span class="sub">${c.items.length}</span></div><div class="bl">${c.items.map(card).join("") || `<div class="bempty">Drop tasks here</div>`}</div></div>`).join("")}</div>
  <p class="tiny" style="margin-top:8px">${R.length} shown · drag a card to another column to ${LAY.board === "person" ? "reassign it" : "change its status"} · tap a card to open it</p>`;
}
async function boardDrop(id, col) {
  const t = tById(id); if (!t) return;
  try {
    if (col.startsWith("p")) {
      if (!mine(t)) return toast("Only the owner can reassign a task");
      const pid = col === "p0" ? null : +col.slice(1); if ((t.person_id || null) === pid) return;
      let patch = { person_id: pid };
      if (importantChanges(t, patch).length) { const r = await askReason(["assignee"], `#${t.no}`); if (!r) return; patch = withReason(patch, r); }
      await api.updateTask(t.id, patch); await reload(); toast(`#${t.no} assigned to ${pid ? pName(pid) : "nobody"}`, () => api.updateTask(t.id, withReason({ person_id: t.person_id }, "Undo of a board move"))); return;
    }
    const label = col.slice(1);
    if (!can(t, "status")) return toast("You are not allowed to change the status of this task");
    if (label === "Closed") { if (!mine(t)) return toast("Only the owner can close a task"); if (!awaiting(t) && t.status !== "Completed") return toast("Mark it completed first, then validate it"); return quickValidate(t.id); }
    const s = label === "Awaiting validation" ? "Completed" : label;
    if (t.status === s && !(s === "Completed" && t.validated)) return;
    if (s === "Completed" && t.validated) { await api.updateTask(t.id, { validated: false }); await reload(); toast(`#${t.no} reopened for validation`, () => api.updateTask(t.id, { validated: true })); return; }
    quickStatus(t, s);
  } catch (e) { toast(errMsg(e)); }
}

/* =========================================================== Calendar */
function viewCalendar() {
  const base = calMonth || TODAY().slice(0, 7);
  const [y, m] = base.split("-").map(Number), first = new Date(y, m - 1, 1), start = new Date(first); start.setDate(1 - ((first.getDay() + 6) % 7));
  const T = tasks.filter(inScope).filter(t => t.due_date && t.status !== "Dropped");
  const byDay = {}; T.forEach(t => (byDay[t.due_date] = byDay[t.due_date] || []).push(t));
  let h = scopeBar() + `<div class="toolbar"><button class="btn" data-cal="-1">Previous</button><button class="btn" data-cal="0">This month</button><button class="btn" data-cal="1">Next</button><h2 style="font-size:17px;margin-left:8px">${first.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}</h2><span class="grow"></span><span class="sub">${T.filter(t => t.due_date.startsWith(base)).length} tasks due this month</span></div>`;
  h += `<div class="cal">${["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(d => `<div class="dh">${d}</div>`).join("")}`;
  for (let i = 0; i < 42; i++) {
    const d = new Date(start); d.setDate(start.getDate() + i); const k = iso(d);
    if (i === 35 && d.getMonth() !== m - 1) break;
    const L = (byDay[k] || []).sort((a, b) => urgency(a) - urgency(b));
    h += `<div class="day${d.getMonth() !== m - 1 ? " out" : ""}${k === TODAY() ? " today" : ""}"><span class="dn">${d.getDate()}</span>${L.slice(0, 4).map(t => `<button class="ev ${!needsAction(t) ? "done" : flag(t) === "Overdue" ? "over" : left(t) <= 3 ? "soon" : ""}" data-open="${t.id}" title="${esc(t.title)}">${t.due_time ? `<b>${esc(hm(t.due_time).replace(":00", ""))}</b> ` : ""}${esc(t.title)}</button>`).join("")}${L.length > 4 ? `<span class="tiny">+${L.length - 4} more</span>` : ""}</div>`;
  }
  h += `</div><div class="agenda">`;
  const ds = Object.keys(byDay).filter(k => k.startsWith(base)).sort();
  h += ds.map(k => `<div class="ad${k === TODAY() ? " today" : ""}">${new Date(k + "T12:00:00").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}</div><div class="tlist">${byDay[k].map(taskRow).join("")}</div>`).join("") || `<div class="empty">No tasks due this month.</div>`;
  return h + `</div>`;
}

/* =========================================================== Reports */
function stats(G, since) {
  const closedIn = G.filter(t => t.status === "Completed" && t.completed_on && t.completed_on >= since);
  const withDue = closedIn.filter(t => t.due_date), onTime = withDue.filter(t => t.completed_on <= t.due_date).length;
  const spans = closedIn.map(t => days(t.created_at.slice(0, 10), t.completed_on)).filter(x => x >= 0);
  return { open: G.filter(isOpen).length, closed: closedIn.length, onTime: withDue.length ? Math.round(onTime / withDue.length * 100) : null, avg: spans.length ? Math.round(spans.reduce((a, b) => a + b, 0) / spans.length) : null, od: G.filter(t => flag(t) === "Overdue").length, av: G.filter(awaiting).length, created: G.filter(t => t.created_at.slice(0, 10) >= since).length, dropped: G.filter(t => t.status === "Dropped" && t.updated_on >= since).length };
}
function viewReports() {
  const T = tasks.filter(mine), since = addDays(TODAY(), -repDays), all = stats(T, since);
  let h = `<div class="toolbar"><div class="seg">${[[30, "30 days"], [90, "90 days"], [180, "6 months"], [365, "12 months"]].map(([d, l]) => `<button class="${repDays === d ? "on" : ""}" data-rep="${d}">${l}</button>`).join("")}</div><span class="grow"></span><button class="btn" data-act="exportrep">${ic("xls")} Export report</button></div>`;
  h += `<div class="kpis">${[["Created", all.created, ""], ["Completed", all.closed, "green"], ["On time", all.onTime === null ? "n/a" : all.onTime + "%", all.onTime !== null && all.onTime < 70 ? "red" : "green"], ["Avg days to close", all.avg ?? "n/a", ""], ["Overdue now", all.od, all.od ? "red" : ""], ["Dropped", all.dropped, ""]].map(x => `<div class="kpi ${x[2]}"><b>${x[1]}</b><span>${x[0]}</span></div>`).join("")}</div>`;
  const rows = [...team().map(p => [p.name, T.filter(t => t.person_id === p.id)]), ["Unassigned", T.filter(t => !t.person_id)]].filter(r => r[1].length).map(([n, G]) => [n, stats(G, since)]);
  h += `<div class="grid2"><div class="card"><h2>By person <span class="sub">completed in the last ${repDays} days</span></h2><p class="tiny mhint" style="margin:-4px 0 6px">Swipe the table sideways to see On time, Avg days and To validate.</p><div class="tw"><table class="t"><thead><tr><th>Person</th><th class="n">Open</th><th class="n">Overdue</th><th class="n">Completed</th><th>On time</th><th class="n">Avg days</th><th class="n">To validate</th></tr></thead><tbody>${rows.map(([n, s]) => `<tr><td><span class="row" style="gap:8px">${av(n, 1)}${esc(n)}</span></td><td class="n">${s.open}</td><td class="n${s.od ? " hot" : ""}">${s.od}</td><td class="n">${s.closed}</td><td>${s.onTime === null ? `<span class="sub">n/a</span>` : `<div class="row" style="gap:8px;flex-wrap:nowrap"><div class="meter grow"><i style="width:${s.onTime}%;background:${s.onTime < 70 ? "var(--red)" : "var(--brand)"}"></i></div><b style="font-size:12.5px">${s.onTime}%</b></div>`}</td><td class="n">${s.avg ?? "-"}</td><td class="n">${s.av}</td></tr>`).join("") || `<tr><td colspan="7" class="sub">No data yet.</td></tr>`}</tbody></table></div><p class="tiny" style="margin-top:10px">On time = completed on or before the due date. Avg days = from creation to completion.</p></div>`;
  const months = []; for (let i = 5; i >= 0; i--) { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - i); months.push(iso(d).slice(0, 7)); }
  const md = months.map(mk => [mk, T.filter(t => t.created_at.slice(0, 7) === mk).length, T.filter(t => t.completed_on && t.completed_on.slice(0, 7) === mk).length]);
  const mx = Math.max(1, ...md.map(r => Math.max(r[1], r[2])));
  h += `<div class="card"><h2>Created vs completed <span class="sub">last 6 months</span></h2><div class="bars">${md.map(([mk, c, d]) => `<div class="m"><div class="pair"><div class="b" style="height:${c / mx * 100}%;background:var(--faint)"><span>${c || ""}</span></div><div class="b" style="height:${d / mx * 100}%;background:var(--brand)"><span>${d || ""}</span></div></div><span class="lbl">${MON[+mk.slice(5) - 1]}</span></div>`).join("")}</div><div class="legend"><span><i class="dot" style="background:var(--faint)"></i> Created</span><span><i class="dot" style="background:var(--brand)"></i> Completed</span></div></div></div>`;
  const cg = {}; T.filter(isOpen).forEach(t => { const c = t.category || "No category"; cg[c] = cg[c] || [0, 0]; cg[c][0]++; if (flag(t) === "Overdue") cg[c][1]++; });
  h += `<div class="card" style="margin-top:16px"><h2>Open work by category</h2><div class="tw"><table class="t"><thead><tr><th>Category</th><th class="n">Open</th><th class="n">Overdue</th><th style="width:45%"></th></tr></thead><tbody>${Object.entries(cg).sort((a, b) => b[1][0] - a[1][0]).map(([c, [o, d]]) => `<tr><td>${esc(c)}</td><td class="n">${o}</td><td class="n${d ? " hot" : ""}">${d}</td><td><div class="meter"><i style="width:${o / Math.max(1, ...Object.values(cg).map(v => v[0])) * 100}%"></i></div></td></tr>`).join("") || `<tr><td colspan="4" class="sub">No open tasks.</td></tr>`}</tbody></table></div></div>`;
  return h;
}

/* =========================================================== Team */
function viewTeam() {
  const TT = allTeams(); if (teamSel && !TT.includes(teamSel)) teamSel = "";
  const T = team().filter(p => !teamSel || pTeams(p).includes(teamSel));
  let h = `<div class="card" style="margin-bottom:16px"><h2 id="pform-t">Add a team member</h2><div class="fgrid">
    <label class="f">Name<input id="p-name" placeholder="e.g. John Doe"></label>
    <label class="f">Email (optional, for emailing tasks)<input id="p-email" type="email" placeholder="name@dynolt.com"></label>
    <div class="f w"><span>Teams</span><div class="teamchk" id="p-teams">${TT.map(x => `<label class="chk"><input type="checkbox" value="${esc(x)}"${teamSel === x ? " checked" : ""}> ${esc(x)}</label>`).join("")}<input id="p-newteam" placeholder="${TT.length ? "Or type a new team name" : "Team name, e.g. Quality (optional)"}"></div></div>
    <label class="chk w"><input type="checkbox" id="p-shared"> Let this person sign in and see their own tasks (off keeps the tracker fully private)</label></div>
    <div class="row" style="margin-top:12px"><button class="btn pri" data-act="savep">Add</button><button class="btn" data-act="cancelp" hidden>Cancel</button><span class="grow"></span><button class="btn danger" data-act="delp" hidden>Remove</button></div>
    <div class="confirm" id="pcf"><span>Remove this person? Their tasks stay, marked Unassigned.</span><button class="btn danger sm" data-act="delpyes">Remove</button><button class="btn sm" data-act="delpno">Keep</button></div></div>`;
  const S = suggestions();
  const colleagues = () => S.length ? `<div class="card sugg" id="colleagues" style="margin-top:16px"><h2>Colleagues <span class="sub">${S.length} not on your team</span></h2><p class="sub" style="margin:-6px 0 10px">People who signed up to this tracker with your company email. Add the ones you work with${teamSel ? ` (they go into ${esc(teamSel)})` : ""}. Adding is optional.</p>
    <div class="sglist">${S.map(a => sgRow(a, false)).join("")}</div></div>` : "";
  h += `<div class="toolbar teambar"><div class="seg tseg">${[["", `All <span>${team().length}</span>`], ...TT.map(x => [x, `${esc(x)} <span>${team().filter(p => pTeams(p).includes(x)).length}</span>`])].map(([k, l]) => `<button class="${teamSel === k ? "on" : ""}" data-teamsel="${esc(k)}">${l}</button>`).join("")}</div>
    ${newTeamOpen ? `<span class="row" style="gap:6px"><input id="nt-name" placeholder="New team name" style="width:200px;min-height:36px"><button class="btn sm pri" data-act="ntsave">Create</button><button class="btn sm" data-act="ntcancel">Cancel</button></span>` : `<button class="btn" data-act="ntopen">${ic("plus")} New team</button>`}
    ${teamSel ? `<button class="btn ghost" data-act="ntdel">Delete team</button>` : ""}<span class="grow"></span>${laySeg("team", [["cards", "Cards", "team"], ["list", "List", "list"]])}</div>
    <div class="confirm" id="ntcf"><span>Delete the team "${esc(teamSel)}"? People stay on your list; only the team label is removed.</span><button class="btn danger sm" data-act="ntdelyes">Delete team</button><button class="btn sm" data-act="ntdelno">Keep</button></div>`;
  if (LAY.team === "list") return h + colleagues() + (T.length ? `<div class="card" style="padding:6px 14px"><div class="tw"><table class="t"><thead><tr><th>Name</th><th>Email</th><th>Sign-in</th><th class="n">Open</th><th class="n">Overdue</th><th class="n">To validate</th><th class="n">Hidden from them</th><th></th></tr></thead><tbody>${T.map(p => { const P = tasks.filter(t => mine(t) && t.person_id === p.id), o = P.filter(isOpen), od = o.filter(t => flag(t) === "Overdue").length; return `<tr><td><span class="row" style="gap:8px;flex-wrap:nowrap">${av(p.name, 1)}<b>${esc(p.name)}</b></span></td><td class="sub">${esc(p.email || "")}</td><td>${p.shared ? `<span class="chip c-blue">On</span>` : `<span class="sub">Off</span>`}</td><td class="n">${o.length}</td><td class="n${od ? " hot" : ""}">${od}</td><td class="n">${P.filter(awaiting).length}</td><td class="n">${P.filter(t => t.assignee_can_see === false).length}</td><td style="white-space:nowrap;text-align:right"><button class="btn sm" data-pf-person="${p.id}">Tasks</button> ${o.length ? `<button class="btn sm" data-mailp="${p.id}" aria-label="Email tasks">${ic("mail")}</button> ` : ""}<button class="btn sm ghost" data-editp="${p.id}">Edit</button></td></tr>`; }).join("")}</tbody></table></div></div>` : `<div class="empty">${teamSel ? `Nobody in ${esc(teamSel)} yet. Add someone above, or edit a person and tick ${esc(teamSel)}.` : "No team members yet. Add the first one above."}</div>`);
  h += `<div class="pgrid">${T.map(p => { const P = tasks.filter(t => mine(t) && t.person_id === p.id); const o = P.filter(isOpen); return `<div class="pcard"><div class="hd">${av(p.name)}<div class="grow"><b>${esc(p.name)}</b><div class="sub">${esc(p.email || "No email saved")}</div></div>${p.shared ? `<span class="chip c-blue">Can see own tasks</span>` : ""}</div>${pTeams(p).length ? `<div class="row" style="gap:5px">${pTeams(p).map(x => `<span class="tag">${esc(x)}</span>`).join("")}</div>` : ""}
    <div class="pstats"><div><b>${o.length}</b><span>Open</span></div><div><b class="${o.some(t => flag(t) === "Overdue") ? "hot" : ""}">${o.filter(t => flag(t) === "Overdue").length}</b><span>Overdue</span></div><div><b>${P.filter(awaiting).length}</b><span>To validate</span></div></div>
    <div class="row"><button class="btn sm" data-pf-person="${p.id}">View tasks</button>${o.length || P.filter(awaiting).length ? `<button class="btn sm" data-mailp="${p.id}">${ic("mail")} Email tasks</button>` : ""}<span class="grow"></span><button class="btn sm ghost" data-editp="${p.id}">Edit</button></div></div>`; }).join("") || `<div class="empty">${teamSel ? `Nobody in ${esc(teamSel)} yet. Add someone above, or edit a person and tick ${esc(teamSel)}.` : "No team members yet. Add the first one above."}</div>`}</div>`;
  return h + colleagues();
}
let editP = null;
function fillPersonForm(p) {
  editP = p; $("#pform-t").textContent = p ? `Edit ${p.name}` : "Add a team member";
  $("#p-name").value = p ? p.name : ""; $("#p-email").value = p ? (p.email || "") : ""; $("#p-shared").checked = p ? p.shared : false;
  $$("#p-teams input[type=checkbox]").forEach(c => { c.checked = p ? pTeams(p).includes(c.value) : c.value === teamSel; }); if ($("#p-newteam")) $("#p-newteam").value = "";
  $('[data-act="savep"]').textContent = p ? "Save" : "Add"; $('[data-act="cancelp"]').hidden = !p; $('[data-act="delp"]').hidden = !p; $("#pcf").style.display = "none";
  $("#p-name").focus(); window.scrollTo({ top: 0, behavior: "smooth" });
}
async function savePerson() {
  const name = $("#p-name").value.trim(), email = $("#p-email").value.trim().toLowerCase() || null, sh = $("#p-shared").checked;
  if (!name) return toast("Name is required");
  if (sh && !email) return toast("Add their email to let them sign in");
  const nt = ($("#p-newteam") ? $("#p-newteam").value : "").trim().replace(/\s+/g, " ");
  const teams = [...new Set([...$$("#p-teams input[type=checkbox]:checked").map(c => c.value), ...(nt ? [nt] : [])])];
  const row = { name, email, shared: sh }; if (teams.length || (editP && pTeams(editP).length)) row.teams = teams;
  try { if (editP) await api.updatePerson(editP.id, row); else await api.addPerson(row); if (nt) setExtraTeams(extraTeams().filter(x => x !== nt)); toast(editP ? "Saved" : `${name} added`); editP = null; await reload(); }
  catch (e) { toast(/duplicate/i.test(e.message || "") ? "That name is already on your team" : /teams/i.test(e.message || "") ? "Teams need the latest database update (update_9.sql)" : errMsg(e)); }
}

/* =========================================================== Templates */
function viewTemplates() {
  const tplCards = () => `<div class="pgrid" style="grid-template-columns:repeat(auto-fill,minmax(220px,1fr))">${templates.map(t => `<div class="pcard"><b>${esc(t.name)}</b><div class="sub">${esc(t.title)}</div><div class="row" style="gap:6px">${t.category ? `<span class="tag">${esc(t.category)}</span>` : ""}${(t.checklist || []).length ? `<span class="tag">${ic("check")} ${(t.checklist || []).length} items</span>` : ""}${t.recurrence ? `<span class="tag">${ic("repeat")} ${esc(REPEAT.find(r => r[0] === t.recurrence)[1])}</span>` : ""}</div><div class="row"><button class="btn sm pri" data-usetpl="${t.id}">Use</button><span class="grow"></span><button class="btn sm ghost" data-deltpl="${t.id}" aria-label="Delete template">${ic("x")}</button></div></div>`).join("")}</div>`;
  let h = `<div class="grid2"><div class="card"><div class="row" style="justify-content:space-between;margin-bottom:10px"><h2 style="margin:0">Your templates</h2>${laySeg("templates", [["list", "List", "list"], ["cards", "Cards", "tpl"]])}</div>${templates.length && LAY.templates === "cards" ? tplCards() : templates.length ? `<div class="tw"><table class="t"><thead><tr><th>Name</th><th>Category</th><th class="n">Checklist</th><th>Repeats</th><th></th></tr></thead><tbody>${templates.map(t => `<tr><td><b>${esc(t.name)}</b><div class="sub">${esc(t.title)}</div></td><td>${esc(t.category || "")}</td><td class="n">${(t.checklist || []).length}</td><td>${esc((REPEAT.find(r => r[0] === (t.recurrence || "")) || ["", ""])[1])}</td><td style="white-space:nowrap;text-align:right"><button class="btn sm pri" data-usetpl="${t.id}">Use</button> <button class="btn sm ghost" data-deltpl="${t.id}" aria-label="Delete template">${ic("x")}</button></td></tr>`).join("")}</tbody></table></div>` : `<div class="empty">No templates yet. Create one on the right, or open any task and choose More, then Save as template.</div>`}</div>`;
  h += `<div class="card"><h2>New template</h2><div class="fgrid">
    <label class="f w">Template name<input id="tp-name" placeholder="e.g. PPAP submission"></label>
    <label class="f w">Task title<input id="tp-title" placeholder="e.g. PPAP documents for ..."></label>
    <label class="f">Category<select id="tp-cat">${opt(allCats().map(c => [c, c]), "", "None")}</select></label>
    <label class="f">Repeats<select id="tp-rep">${opt(REPEAT, "", null)}</select></label>
    <label class="chk w"><input type="checkbox" id="tp-urg"> Urgent</label>
    <label class="f w">Checklist (one item per line)<textarea id="tp-cl" rows="6" placeholder="PSW&#10;Control plan&#10;PFMEA"></textarea></label></div>
    <div style="margin-top:12px"><button class="btn pri" data-act="savetpl">Save template</button></div></div></div>`;
  return h;
}

/* =========================================================== Settings, invites, more */
function viewSettings() {
  return `<div class="grid2"><div class="stack">
  <div class="card"><h2>Your account</h2><div class="fgrid"><label class="f w">Your name<input id="a-name" value="${esc(me.full_name)}"></label><label class="f w">Email<input value="${esc(me.email)}" disabled></label></div>
    <div class="row" style="margin-top:12px"><button class="btn pri" data-act="savename">Save name</button><span class="grow"></span><button class="btn danger" data-act="signout">${ic("out")} Sign out</button></div></div>
  <div class="card"><h2>Change password</h2><div class="fgrid"><label class="f w">Current password<input type="password" id="a-p0" autocomplete="current-password"></label><label class="f">New password<input type="password" id="a-p1" autocomplete="new-password"></label><label class="f">Repeat it<input type="password" id="a-p2" autocomplete="new-password"></label></div>
    <div class="row" style="margin-top:12px;justify-content:space-between"><button class="btn pri" data-act="savepw">Change password</button><span class="sub" style="font-size:12.5px">Forgot it? Sign out and use "Forgot password?"</span></div></div>
  <div class="card"><h2>Categories</h2><div class="row" style="gap:6px">${cats.map(c => `<span class="tag" style="padding:4px 4px 4px 10px;gap:4px">${esc(c.name)} <button class="btn icon ghost sm" style="width:24px;min-height:24px" data-delcat="${c.id}" aria-label="Remove ${esc(c.name)}">${ic("x")}</button></span>`).join("") || `<span class="sub">No categories yet.</span>`}</div>
    <div class="row" style="margin-top:10px;flex-wrap:nowrap"><input id="a-cat" placeholder="New category, e.g. CQA"><button class="btn" data-act="addcat">Add</button></div></div></div>
  <div class="stack"><div class="card"><h2>Your data</h2><p class="sub" style="margin-top:-4px">Download a full backup now and then and keep it somewhere safe, such as OneDrive. If anything is ever lost, use <b>Restore from backup</b> with that file.</p>
    <div class="row"><button class="btn pri" data-act="backup">${ic("xls")} Download full backup</button><button class="btn" data-act="restore">${ic("up")} Restore from backup</button><button class="btn" data-act="export">${ic("xls")} Custom Excel export</button><button class="btn" data-act="import">${ic("up")} Import from Excel</button></div></div>
  <div class="card danger-zone"><h2>Delete my account</h2><p class="sub" style="margin:-4px 0 10px">Removes your login and your whole tracker for good: tasks, team list, categories, templates and their history. Download a backup first if you may need any of it.</p>
    <button class="btn danger" data-act="delacct">${ic("x")} Delete my account</button></div>
  <div class="card"><h2>How it works</h2><ol style="margin:0;padding-left:18px;font-size:13.5px;line-height:1.7">
    <li>This tracker, your team list and every task are visible only to you.</li>
    <li>Team members are names. They need no login and see nothing.</li>
    <li>When someone reports a task done, set it to Completed. It stays open, marked "Awaiting validation", until you check the work and press <b>Validate &amp; close</b>. Only you can validate.</li>
    <li>Only you can drop a task, and dropping needs a reason. Nothing disappears silently; closed work stays under the Closed tab.</li>
    <li>Repeating tasks create the next one when completed.</li>
    <li>"Blocked by" links a task to another that must finish first.</li>
    <li>Press <b>/</b> to search and <b>N</b> for a new task.</li></ol></div></div></div>`;
}
function viewAccounts() {
  return `<div class="card"><h2>Accounts on this site <span class="sub">${profiles.length}</span></h2><p class="sub" style="margin-top:-4px">Anyone with the link can create an account. Each account is a separate private tracker: you see who has joined, never their tasks.</p>
    <div class="tw"><table class="t"><thead><tr><th>Name</th><th>Email</th><th>Joined</th></tr></thead><tbody>${profiles.map(p => `<tr><td>${av(p.full_name || p.email, 1)} ${esc(p.full_name)}${p.is_admin ? ` <span class="chip c-ok">Admin</span>` : ""}</td><td>${esc(p.email)}</td><td>${esc(fmt(p.created_at))}</td></tr>`).join("")}</tbody></table></div>
    <p class="tiny" style="margin-top:10px">To remove an account or reset a password, use the Supabase dashboard (Authentication, Users).</p></div>`;
}
function viewMore() {
  const items = [["team", "Team", "People you give tasks to"], ["templates", "Templates", "Reusable tasks"], ["settings", "Settings", "Account, categories, backup"]];
  if (me.is_admin) items.push(["accounts", "Accounts", "Who has signed up"]);
  return `<div class="tlist">${items.map(([k, l, s]) => `<a href="#${k}" class="trow" style="grid-template-columns:28px 1fr;text-decoration:none;color:var(--ink)">${ic(VIEWS[k][1])}<span><b>${l}</b><br><span class="sub">${s}</span></span></a>`).join("")}<a href="#settings" class="trow" data-act="signout" style="grid-template-columns:28px 1fr;text-decoration:none;color:var(--red)">${ic("out")}<b>Sign out</b></a></div>`;
}

/* =========================================================== task panel */
let draft = null;
function openPanel() { document.body.classList.add("p-open"); }
function closePanel() { document.body.classList.remove("p-open"); editing = null; draft = null; }
async function openTask(id, preset) {
  histAll = false;
  const t0 = id ? tById(+id) : { id: null, no: "", title: "", category: "", priority: null, status: "Not Started", due_date: "", waiting_on: "", latest_update: "", person_id: null, owner_id: me.id, assignee_can_see: true, assignee_can: DEF_CAN.slice(), parent_id: null, validated: false, checklist: [], recurrence: null, blocked_by: null };
  if (!t0) return;
  editing = t0; draft = { ...t0, checklist: cl(t0).map(x => ({ ...x })), ...(preset || {}) };
  if (preset && preset.checklist) draft.checklist = preset.checklist.map(x => ({ text: x.text, done: false }));
  drawPanel(preset); openPanel();
  setTimeout(() => (id ? $("#e-new") : $("#e-title"))?.focus(), 60);
  if (id && mine(t0)) loadFiles(t0);
  if (id) loadHistory(t0);
}
function drawPanel(preset) {
  const t = draft, t0 = editing, own = mine(t0), isNew = !t0.id;
  const cn = k => isNew || can(t0, k), d_ = k => cn(k) ? "" : " disabled", upd = isNew || canAny(t0);
  $("#pt").textContent = isNew ? (t.parent_id ? "New subtask" : "New task") : `Task #${t0.no}${own ? "" : " · shared with you"}`;
  const others = tasks.filter(x => mine(x) && x.id !== t0.id && needsAction(x)).sort((a, b) => a.no - b.no);
  const c = t.checklist, cd = c.filter(x => x.done).length, P = parentOf(t);
  let h = "";
  if (P) h += `<a href="#tasks" class="plink" data-open="${P.id}">&#8627; Part of #${P.no} ${esc(P.title)}${P.owner_id !== me.id ? " (shared with you)" : ""}</a>`;
  else if (t.parent_id) h += `<div class="plink sub">&#8627; Part of a task you can no longer see</div>`;
  if (isNew && templates.length && !t.parent_id) h += `<label class="f" style="margin-bottom:14px">Start from a template<select id="e-tpl">${opt(templates.map(x => [x.id, x.name]), "", "Blank task")}</select></label>`;
  if (!isNew && dropReq(t0)) h += own ? `<div class="note err"><b>Drop requested</b>${t0.person_id ? ` by ${esc(pName(t0.person_id))}` : ""}. The reason is in the change history below. <div class="row" style="margin-top:8px"><button type="button" class="btn danger sm" data-act="dropok">Approve drop</button><button type="button" class="btn sm" data-act="dropno">Keep task</button></div></div>` : `<div class="note">You asked to drop this task. Waiting for the owner to confirm. <button type="button" class="linkb" data-act="dropcancel">Withdraw request</button></div>`;
  if (!own && isMember(t0)) h += `<div class="note">A checklist item on this task is shared with you. You can tick <b>your</b> items and add updates; everything else is read only.</div>`;
  else if (!own) h += `<div class="note">${canArr(t0).length ? `Shared with you. You may: <b>${esc(rightsText(canArr(t0)))}</b>. Only the owner can change the assignee or validate it.` : "Shared with you as <b>view only</b>. You can read it but not change it."} You can forward it to your own team.</div>`;
  if (preset && preset.status === "Dropped") h += `<div class="note err">You are dropping this task. Write the reason in the update box, then Save. It stays under the Closed tab.</div>`;
  h += `<textarea class="ttl" id="e-title" rows="2" placeholder="What needs to be done?"${d_("title")}>${esc(t.title)}</textarea>
  <div class="pills" role="radiogroup" aria-label="Status">${statOpts(t0).map(s => `<button type="button" data-st="${s}" class="${t.status === s ? "on" : ""}"${d_("status")}><i class="dot" style="background:${SCOL[s]}"></i>${s}</button>`).join("")}</div>
  <div class="fgrid">
    <label class="f">Assigned to${own ? `<select id="e-person_id">${opt(team().map(p => [p.id, p.name]), t.person_id || "", "Unassigned")}</select>` : `<input value="You" disabled>`}</label>
    <label class="f w">Due date and time <span class="sub" style="font-weight:400">(time optional)</span><span class="dt"><input type="date" id="e-due_date" value="${esc(t.due_date || "")}"${d_("due")}><input type="time" id="e-due_time" value="${esc((t.due_time || "").slice(0, 5))}" aria-label="Due time (optional)"${d_("due")}></span>${cn("due") ? `<span class="quick"><button type="button" data-due="0">Today</button><button type="button" data-due="1">Tomorrow</button><button type="button" data-due="7">+1 week</button><button type="button" data-due="14">+2 weeks</button><button type="button" data-due="30">+1 month</button></span>` : ""}</label>
    <label class="f">Category${own ? `<select id="e-category">${opt([...new Set([...allCats(), t.category].filter(Boolean))].map(x => [x, x]), t.category || "", "None")}</select>` : `<input id="e-category" value="${esc(t.category || "")}"${d_("category")}>`}</label>
    <label class="f">Repeats<select id="e-recurrence"${own ? "" : " disabled"}>${opt(REPEAT, t.recurrence || "", null)}</select></label>
    <label class="chk"${cn("priority") ? "" : ' style="opacity:.6"'}><input type="checkbox" id="e-urgent"${urgentT(t) ? " checked" : ""}${d_("priority")}> ${ic("flag")} Urgent</label>
    <label class="f">Blocked by${own ? `<select id="e-blocked_by">${opt(others.map(x => [x.id, `#${x.no} ${x.title.slice(0, 50)}`]), t.blocked_by || "", "Nothing")}</select>` : `<input value="${t.blocked_by && tById(t.blocked_by) ? "#" + tById(t.blocked_by).no : "Nothing"}" disabled>`}</label>
    <label class="f w">Waiting on<input id="e-waiting_on" value="${esc(t.waiting_on || "")}" placeholder="Supplier, PO, a person..."${d_("waiting_on")}></label></div>`;
  /* who can see it and what they can do */
  if (own) {
    const p = people.find(x => x.id === t.person_id);
    if (p) h += `<div class="sec acc"><h3>${ic("lock")} ${esc(p.name)}'s access</h3>${p.shared ? "" : `<p class="sub" style="margin:-4px 0 8px">${esc(p.name)} cannot sign in yet, so these apply only if you turn on sign-in for them on the Team page.</p>`}
      <label class="chk"><input type="checkbox" id="e-can_see"${t.assignee_can_see === false ? "" : " checked"}> ${esc(p.name)} can see this task</label>
      <div class="rights"${t.assignee_can_see === false ? ' style="opacity:.5"' : ""}><div class="rh"><span class="sub">${esc(p.name)} may:</span><span class="grow"></span><button type="button" class="linkb" data-rset="none">None</button><button type="button" class="linkb" data-rset="def">Default</button><button type="button" class="linkb" data-rset="all">All</button></div>
      <div class="rgrid">${RIGHTS.map(([k, l]) => `<label class="chk"><input type="checkbox" data-right="${k}"${canArr0(t).includes(k) ? " checked" : ""}${t.assignee_can_see === false ? " disabled" : ""}> ${esc(l)}</label>`).join("")}</div>
      <p class="tiny" style="margin:6px 0 0">Nothing ticked means view only. Only you can change the assignee, validate, drop or delete.</p></div></div>`;
  }
  /* checklist, each item optionally for a person */
  const tm = own ? team() : [];
  h += `<div class="sec"><h3>${ic("check")} Checklist <span class="sub">${c.length ? `${cd} of ${c.length} done` : ""}</span>${cn("checklist") && c.length && cd < c.length ? ` <button type="button" class="linkb" data-act="tickall">Tick all</button>` : ""}</h3>${c.length ? `<div class="prog"><i style="width:${cd / c.length * 100}%"></i></div>` : ""}<div class="cl">${c.map((x, i) => `<div class="cli${x.done ? " done" : ""}"><input type="checkbox" data-cli="${i}"${x.done ? " checked" : ""}${cn("checklist") || myItem(t0, x) ? "" : " disabled"} aria-label="Done"><span class="clt">${esc(x.text)}${myItem(t0, x) ? ` <span class="chip c-blue">yours</span>` : ""}</span>${own && tm.length ? `<select class="clp" data-clp="${i}" aria-label="Person for this item">${opt(tm.map(p => [p.id, p.name]), x.person_id || "", "Anyone")}</select>${(() => { const p = people.find(q => q.id === x.person_id); return p && p.shared && p.id !== t.person_id ? `<label class="clsh" title="Let ${esc(p.name)} see this task and tick this item"><input type="checkbox" data-clsh="${i}"${x.share ? " checked" : ""}> Share</label>` : ""; })()}` : itemWho(x) ? (x.person_email && !myPids().includes(x.person_id) ? `<a class="tag" href="mailto:${esc(x.person_email)}?subject=${encodeURIComponent("#" + t0.no + " " + t0.title + ": " + x.text)}" title="Email ${esc(itemWho(x))} (${esc(x.person_email)})">${ic("mail")} ${esc(itemWho(x))}</a>` : `<span class="tag">${esc(itemWho(x))}${myPids().includes(x.person_id) ? " (you)" : ""}</span>`) : ""}${cn("checklist") ? `<button type="button" data-clx="${i}" aria-label="Remove item">${ic("x")}</button>` : ""}</div>`).join("")}</div>
    ${cn("checklist") ? `<div class="row" style="margin-top:6px;flex-wrap:nowrap"><input id="e-clnew" placeholder="Add a checklist item and press Enter"><button type="button" class="btn" data-act="cladd">Add</button></div>` : ""}</div>`;
  /* subtasks */
  if (!isNew && own) {
    const K = kids(t0), f = fwd.get(t0.id);
    h += `<div class="sec"><h3>${ic("tasks")} Subtasks <span class="sub">${K.length ? `${K.filter(k => k.status === "Completed").length} of ${K.length} done` : ""}</span></h3>
      ${K.length ? `<div class="subs">${K.sort((x, y) => x.no - y.no).map(k => `<a href="#tasks" data-open="${k.id}" class="subt"><span class="no">#${k.no}</span><span class="grow">${esc(k.title)}</span>${k.person_id ? av(pName(k.person_id), 1) : ""}${countdown(k)}</a>`).join("")}</div>` : ""}
      ${f ? `<div class="note" style="margin-top:8px">Forwarded into other people's trackers: <b>${f.done} of ${f.total} done</b>${f.overdue ? `, ${f.overdue} overdue` : ""}. You see progress only, not their tasks.</div>` : ""}
      <button type="button" class="btn" style="margin-top:8px" data-act="addsub">${ic("plus")} Add subtask</button> <button type="button" class="btn ghost" data-act="splitsub">Split into several</button></div>`;
  }
  if (own && !isNew) h += `<div class="sec"><h3>${ic("clip")} Attachments <span class="sub">optional · up to 10 MB each</span></h3><div class="files" id="files"><span class="sub">Loading...</span></div><label class="btn" style="margin-top:4px">${ic("up")} Add files<input type="file" id="e-files" multiple hidden></label></div>`;
  if (own && t0.status === "Completed") h += `<label class="valbox"><input type="checkbox" id="e-validated"${t0.validated ? " checked" : ""}> <span><b>Validated</b>: I have checked this is really done${t0.validated_on ? ` (${esc(fmt(t0.validated_on))})` : ""}</span></label>`;
  if (!isNew) { const N = notesBy.get(t0.id) || []; h += `<div class="sec"><h3>Updates <span class="sub">${N.length ? pl(N.length, "update") + ", newest first" : ""}</span></h3>${N.length ? `<div class="hist updall">${N.map((n, i) => `<div${i === 0 ? ' class="latest"' : ""}><span>${esc(fmtTime(n.created_at))}${n.author_name ? " · " + esc(n.author_name) : ""}${i === 0 ? " · latest" : ""}</span>${esc(n.body)}</div>`).join("")}</div>` : t0.latest_update ? `<div style="font-size:13.5px">${esc(t0.latest_update)}</div>` : `<span class="sub">No updates yet.</span>`}</div>`; }
  if (cn("notes")) h += `<div class="sec"><label class="f">${preset && preset.status === "Dropped" ? "Reason for dropping" : "New update"}<textarea id="e-new" placeholder="What did they report? What did you check? Next step?"></textarea></label></div>`;
  if (!isNew) h += `<div class="sec"><h3>${ic("list")} Change history <span class="sub">who changed what</span></h3><div class="hist chg" id="hist"><span class="sub">Loading...</span></div></div>`;
  $("#pb").innerHTML = h;
  $("#pfoot").innerHTML = `${upd ? `<button class="btn pri" data-act="save">${isNew ? (t.parent_id ? "Create subtask" : "Create task") : "Save"}</button>` : `<button class="btn" data-act="close">Close</button>`}${!isNew && own && awaiting(t0) ? `<button class="btn brand" data-act="validate">${ic("check")} Validate &amp; close</button>` : ""}${!isNew && cn("status") && isOpen(t0) && t.status !== "Completed" ? `<button class="btn" data-act="done">Mark completed</button>` : ""}${!isNew && !own && isOpen(t0) ? `<button class="btn" data-act="forward">${ic("up")} Forward</button>` : ""}${!isNew && isAssignee(t0) && can(t0, "status") && isOpen(t0) && !t0.drop_requested ? `<button class="btn ghost" data-act="dropask">Request to drop</button>` : ""}<span class="grow"></span>${!isNew ? `<div class="menu" id="pmenu"><button class="btn icon" data-act="pmenu" aria-label="More actions">${ic("more")}</button><div class="dd"><button data-act="mailone">${ic("mail")} Email this task</button>${own ? `<button data-act="savetplfrom">${ic("tpl")} Save as template</button><button data-act="dup">${ic("plus")} Duplicate</button><button data-act="del" class="danger">${ic("x")} Delete for good</button>` : `<button data-act="forward">${ic("up")} Forward or split</button>`}</div></div>` : ""}
  <div class="confirm" id="cf">Delete task #${t0.no} for good? Use Dropped to keep the record. <button class="btn danger sm" data-act="delyes">Delete</button><button class="btn sm" data-act="delno">Keep</button></div>`;
}
function syncDraft() {
  if (!draft) return;
  const g = k => $("#e-" + k);
  if (g("title")) draft.title = g("title").value;
  ["due_date", "due_time", "category", "recurrence", "waiting_on"].forEach(k => { if (g(k)) draft[k] = g(k).value; });
  if (g("person_id")) draft.person_id = g("person_id").value ? +g("person_id").value : null;
  if (g("blocked_by")) draft.blocked_by = g("blocked_by").value ? +g("blocked_by").value : null;
  if (g("urgent")) draft.priority = g("urgent").checked ? "HIGH" : null;
  if (g("can_see")) draft.assignee_can_see = g("can_see").checked;
  if ($("[data-right]")) draft.assignee_can = $$("[data-right]").filter(x => x.checked).map(x => x.dataset.right);
}
async function loadFiles(t) {
  const el = $("#files"); if (!el) return;
  try {
    const F2 = await api.files(t.owner_id, t.id); if (editing !== t || !$("#files")) return;
    $("#files").innerHTML = F2.map(f => `<div class="fi">${ic("clip")}<span>${esc(f.name.replace(/^\d+_/, ""))}</span><span class="tiny">${f.metadata && f.metadata.size ? Math.max(1, Math.round(f.metadata.size / 1024)) + " KB" : ""}</span><button class="btn sm" data-fopen="${esc(f.name)}">Open</button><button class="btn sm ghost" data-fdel="${esc(f.name)}" aria-label="Delete file">${ic("x")}</button></div>`).join("") || `<span class="sub">No files attached. Optional: add photos or reports if useful.</span>`;
  } catch (e) { el.innerHTML = `<span class="sub">Attachments are not available: ${esc(errMsg(e))}. Run update_3.sql in Supabase.</span>`; }
}
let histAll = false;
async function loadHistory(t) {
  try {
    const H = (await api.history(t.id)).filter(u => u.kind !== "note"); if (editing !== t || !$("#hist")) return;
    const show = histAll ? H : H.slice(0, 8);
    const fmtB = b => esc(b).replace(/(Reason: )(.*)$/, '<span class="rsn">$1$2</span>');
    $("#hist").innerHTML = show.map(u => `<div><span>${esc(fmtTime(u.created_at))} · <b>${esc(u.author_name || "System")}</b></span>${fmtB(u.body)}</div>`).join("") + (H.length > show.length ? `<button type="button" class="linkb" data-act="histall">Show all ${H.length} changes</button>` : "") || `<span class="sub">No changes yet.</span>`;
  } catch (e) { $("#hist").innerHTML = `<span class="sub">History could not load: ${esc(errMsg(e))}</span>`; }
}
async function save(extra) {
  syncDraft();
  const t = editing, d = draft, own = mine(t), note = ($("#e-new")?.value || "").trim();
  const btn = $('[data-act="save"]'); if (btn) btn.disabled = true;
  try {
    if (!t.id) {
      if (!d.title.trim()) { toast("Write what needs to be done first. A task cannot be saved without it"); $("#e-title").focus(); return; }
      if (!d._force && !d.parent_id) { const m = findMatch(d.title, tasks.filter(mine)); if (m) { dupModal(m, { person_id: d.person_id, category: d.category, due_date: d.due_date, due_time: d.due_date ? d.due_time : "", waiting_on: d.waiting_on, priority: d.priority, recurrence: d.recurrence, status: d.status, checklist: d.checklist, notes: note ? [note] : [] }); return; } }
      const row = { title: d.title.trim(), category: d.category || null, priority: d.priority || null, status: d.status || "Not Started", due_date: d.due_date || null, due_time: d.due_date && d.due_time ? d.due_time : null, waiting_on: d.waiting_on || null, person_id: d.person_id || null, owner_id: me.id, recurrence: d.recurrence || null, blocked_by: d.blocked_by || null, checklist: d.checklist, assignee_can_see: d.assignee_can_see !== false, assignee_can: d.assignee_can || DEF_CAN };
      if (d.parent_id) row.parent_id = d.parent_id;
      const n = await api.insertTask(row);
      if (note) await api.addNote(n.id, note);
      closePanel(); await reload(); toast(`Task #${n.no} created`);
      return;
    }
    if (!canAny(t) && !isMember(t)) { closePanel(); return; }
    const dueT = d.due_date && d.due_time ? (d.due_time.length === 5 ? d.due_time + ":00" : d.due_time) : null;
    let patch = {};
    if (can(t, "status")) patch.status = d.status;
    if (can(t, "waiting_on")) patch.waiting_on = d.waiting_on || null;
    if (can(t, "checklist") || (isMember(t) && cl(t).some(x => myItem(t, x)))) patch.checklist = own ? d.checklist.map(x => x.person_id && pName(x.person_id) ? { ...x, person_name: pName(x.person_id) } : x) : d.checklist;
    if (can(t, "title")) patch.title = d.title.trim() || t.title;
    if (can(t, "category")) patch.category = d.category || null;
    if (can(t, "priority")) patch.priority = d.priority || null;
    if (can(t, "due")) { patch.due_date = d.due_date || null; patch.due_time = dueT; }
    if (own) {
      Object.assign(patch, { title: d.title.trim(), person_id: d.person_id || null, recurrence: d.recurrence || null, blocked_by: d.blocked_by || null, assignee_can_see: d.assignee_can_see !== false, assignee_can: d.assignee_can || canArr0(t) });
      if ($("#e-validated")) patch.validated = $("#e-validated").checked;
      if (!patch.title) { toast("The task cannot be empty"); return; }
    }
    Object.assign(patch, extra || {});
    if (patch.status === "Dropped" && t.status !== "Dropped" && !note) { toast("Write the reason for dropping in the update box, then Save"); $("#e-new")?.focus(); return; }
    if (patch.status === "Completed" && t.status !== "Completed") {
      const ck = patch.checklist || cl(t), op = ck.filter(x => !x.done);
      if (op.length) {
        if (!(can(t, "checklist"))) { toast(`Tick every checklist item first (${op.length} open). You may not tick them on this task`); return; }
        const go = await askConfirm(`Complete #${t.no}?`, `<p style="margin-top:0">A task can be completed only when its whole checklist is ticked. Still open: <b>${op.map(x => esc(x.text) + (itemWho(x) ? ` (${esc(itemWho(x))})` : "")).join(", ")}</b>.</p>`, op.length === 1 ? "Tick it and complete" : `Tick all ${op.length} and complete`);
        if (!go) return;
        patch.checklist = ck.map(x => ({ ...x, done: true }));
      }
      if (blockedT(t)) toast(`Note: #${blockedT(t).no} it depends on is still open`);
    }
    const same = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
    for (const k of Object.keys(patch)) if (same(patch[k], t[k]) || (k === "due_time" && tm5(patch[k]) === tm5(t[k])) || (k === "validated" && !patch[k] && !t[k]) || (k === "assignee_can" && sameSet(patch[k] || [], canArr0(t)))) delete patch[k];
    const changed = Object.keys(patch).length > 0;
    const imp = importantChanges(t, patch);
    if (imp.length) { const r = await askReason(imp, `#${t.no}`); if (!r) return; patch = withReason(patch, r); }
    if (changed) await api.updateTask(t.id, patch);
    if (note) await api.addNote(t.id, note);
    const big = patch.status !== t.status || (!!patch.validated) !== (!!t.validated);
    closePanel(); await reload();
    toast(patch.validated && !t.validated ? `#${t.no} validated and closed` : patch.status === "Dropped" && t.status !== "Dropped" ? `#${t.no} dropped. It is under the Closed tab` : patch.status === "Completed" && t.status !== "Completed" ? `#${t.no} marked completed. ${own ? "It stays open until you validate it" : "It stays open until the owner validates it"}${t.recurrence ? ". Next one created" : ""}` : changed || note ? "Saved" : "No changes", changed && big ? undoTo(t) : null);
  } catch (e) { toast(errMsg(e)); }
  finally { if (btn) btn.disabled = false; }
}
/* A task is completed only when its checklist is done. Offer to tick the open items in the same step. */
const openItems = t => cl(t).filter(x => !x.done).length;
const allTicked = t => cl(t).map(x => ({ ...x, done: true }));
async function completeTasks(list, silent) {
  list = list.filter(t => isOpen(t) && t.status !== "Completed");
  if (!list.length) return toast("Nothing to complete");
  const blocked = list.filter(t => !can(t, "status") || (openItems(t) && !can(t, "checklist")));
  const ok = list.filter(t => !blocked.includes(t)), open = ok.reduce((n, t) => n + openItems(t), 0);
  if (!ok.length) return toast(blocked.length === 1 ? `You cannot complete #${blocked[0].no}: ${!can(blocked[0], "status") ? "you may not change its status" : "its checklist has open items you may not tick"}` : "You may not complete these tasks");
  if (open) {
    const go = await askConfirm(ok.length === 1 ? `Complete #${ok[0].no}?` : `Complete ${ok.length} tasks?`, `<p style="margin-top:0">A task can be completed only when its whole checklist is ticked. <b>${pl(open, "checklist item")}</b> ${open === 1 ? "is" : "are"} still open:</p><div class="tlist" style="max-height:220px;overflow:auto;padding:6px 12px">${ok.filter(openItems).map(t => `<div style="padding:5px 0"><b>#${t.no} ${esc(t.title)}</b><div class="sub">${cl(t).filter(x => !x.done).map(x => esc(x.text) + (itemWho(x) ? ` (${esc(itemWho(x))})` : "")).join(" · ")}</div></div>`).join("")}</div><p class="sub" style="margin:10px 0 0">Make sure the work is really done, then tick them all and complete.</p>${blocked.length ? `<p class="sub">${pl(blocked.length, "task")} will be skipped because you may not complete ${blocked.length === 1 ? "it" : "them"}.</p>` : ""}`, open === 1 ? "Tick it and complete" : `Tick all ${open} and complete`);
    if (!go) return false;
  }
  const done = [];
  try {
    for (const t of ok) { await api.updateTask(t.id, openItems(t) ? { checklist: allTicked(t), status: "Completed" } : { status: "Completed" }); done.push(t); }
  } catch (e) { toast(errMsg(e)); }
  await reload();
  if (done.length && !silent) toast(done.length === 1 ? `#${done[0].no} completed${mine(done[0]) ? ". Validate it when checked" : ". The owner will validate it"}` : `${done.length} tasks completed. Validate them when checked`, done.length === 1 && !openItems(done[0]) ? undoTo(done[0]) : null);
  return true;
}
async function quickStatus(t, s) {
  if (s === "Completed") { const r = await completeTasks([t]); if (r === false) render(); return; }
  try { await api.updateTask(t.id, { status: s }); await reload(); toast(`#${t.no} moved to ${s}${s === "Completed" ? (mine(t) ? ". It stays open until you validate it" : ". It stays open until the owner validates it") : ""}`, undoTo(t)); } catch (e) { toast(errMsg(e)); render(); }
}
async function quickValidate(id) {
  const t = tById(+id); if (!t) return;
  try { await api.updateTask(t.id, { validated: true }); await reload(); toast(`#${t.no} validated and closed`, undoTo(t)); } catch (e) { toast(errMsg(e)); }
}


/* =========================================================== duplicates: match and merge */
const normT = s => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
function bigr(s) { s = s.replace(/ /g, ""); const m = new Map(); for (let i = 0; i < s.length - 1; i++) { const b = s.slice(i, i + 2); m.set(b, (m.get(b) || 0) + 1); } return m; }
function simil(a, b) {
  if (a === b) return 1; if (a.length < 3 || b.length < 3) return 0;
  const A = bigr(a), B = bigr(b); let i = 0, na = 0, nb = 0;
  for (const v of A.values()) na += v; for (const v of B.values()) nb += v; for (const [k, v] of A) i += Math.min(v, B.get(k) || 0);
  return 2 * i / (na + nb);
}
const SIM = 0.88; /* catches small spelling differences such as clearence / clearance */
function findMatch(title, pool, exceptId) {
  const k = normT(title); if (!k) return null; let best = null, bs = 0;
  for (const t of pool) { if (t.id === exceptId) continue; const s = simil(k, normT(t.title)) + (needsAction(t) ? 0.001 : 0); if (s > bs) { bs = s; best = t; } }
  return bs >= SIM ? best : null;
}
const normNote = s => normT(String(s || "").replace(/^\[[^\]]*\]\s*/, ""));
/* What an incoming task (typed or imported) would add to or change in an existing one. */
function diffInto(e, inc) {
  const items = [], has = v => v !== undefined && v !== null && v !== "";
  const push = (key, label, from, to, val, kind) => items.push({ key, label, from, to, val, kind, on: kind === "add" });
  if (inc.person_id || inc.personName) {
    const toName = inc.person_id ? pName(inc.person_id) : inc.personName;
    if (!e.person_id) push("person_id", "Assigned to", "", toName, inc.person_id || "__new:" + inc.personName, "add");
    else if (normT(pName(e.person_id)) !== normT(toName)) push("person_id", "Assigned to", pName(e.person_id), toName, inc.person_id || "__new:" + inc.personName, "change");
  }
  if (has(inc.category)) { if (!e.category) push("category", "Category", "", inc.category, inc.category, "add"); else if (normT(e.category) !== normT(inc.category)) push("category", "Category", e.category, inc.category, inc.category, "change"); }
  if (has(inc.due_date)) { if (!e.due_date) push("due_date", "Due date", "", fmt(inc.due_date), inc.due_date, "add"); else if (e.due_date !== inc.due_date) push("due_date", "Due date", fmt(e.due_date), fmt(inc.due_date), inc.due_date, "change"); }
  if (has(inc.due_time)) { const it = inc.due_time.slice(0, 5); if (!e.due_time) push("due_time", "Due time", "", hm(it), it + ":00", "add"); else if (e.due_time.slice(0, 5) !== it) push("due_time", "Due time", hm(e.due_time), hm(it), it + ":00", "change"); }
  if (has(inc.waiting_on)) { if (!e.waiting_on) push("waiting_on", "Waiting on", "", inc.waiting_on, inc.waiting_on, "add"); else if (normT(e.waiting_on) !== normT(inc.waiting_on)) push("waiting_on", "Waiting on", e.waiting_on, inc.waiting_on, inc.waiting_on, "change"); }
  if (inc.priority === "HIGH" && e.priority !== "HIGH") push("priority", "Urgent", "", "Yes", "HIGH", "add");
  if (has(inc.recurrence) && inc.recurrence !== e.recurrence) push("recurrence", "Repeats", e.recurrence ? REPEAT.find(r => r[0] === e.recurrence)[1] : "", REPEAT.find(r => r[0] === inc.recurrence)[1], inc.recurrence, e.recurrence ? "change" : "add");
  if (has(inc.status) && inc.status !== "Not Started" && inc.status !== e.status) push("status", "Status", e.status, inc.status, inc.status, "change");
  const haveCl = new Set(cl(e).map(x => normT(x.text))), newCl = (inc.checklist || []).filter(x => !haveCl.has(normT(x.text)));
  if (newCl.length) push("checklist", "Checklist", "", `+${pl(newCl.length, "item")}: ${newCl.map(x => x.text).join("; ")}`, newCl, "add");
  const haveN = new Set([...(notesBy.get(e.id) || []).map(n => normNote(n.body)), normNote(e.latest_update)]), seen = new Set();
  const newN = (inc.notes || []).filter(b => { const k = normNote(b); if (!k || haveN.has(k) || seen.has(k)) return false; seen.add(k); return true; });
  if (newN.length) push("notes", "Updates", "", newN.length === 1 ? newN[0] : `+${pl(newN.length, "update")} (latest: ${newN[newN.length - 1]})`, newN, "add");
  return items;
}
async function applyMerge(e, items, peopleCache, reason) {
  const patch = {}; let notes = [];
  for (const it of items.filter(x => x.on)) {
    if (it.key === "notes") { notes = it.val; continue; }
    if (it.key === "checklist") { patch.checklist = [...cl(e), ...it.val.map(x => ({ text: x.text, done: false }))]; continue; }
    if (it.key === "person_id" && String(it.val).startsWith("__new:")) {
      const nm = it.val.slice(6), key = nm.toLowerCase();
      let pid = peopleCache && peopleCache.get(key); if (!pid) { const p = await api.addPerson({ name: nm }); pid = p.id; if (peopleCache) peopleCache.set(key, pid); }
      patch.person_id = pid; continue;
    }
    patch[it.key] = it.val;
  }
  if (patch.due_time && !patch.due_date && !e.due_date) delete patch.due_time;
  if (Object.keys(patch).length) await api.updateTask(e.id, importantChanges(e, patch).length ? withReason(patch, reason || "Updated from a duplicate entry") : patch);
  if (notes.length) await api.addNotes(e.id, notes);
  return Object.keys(patch).length + notes.length;
}
const diffRow = it => `<label class="chk dif"><input type="checkbox" data-dif="${it.i}"${it.on ? " checked" : ""}> <span><b>${esc(it.label)}</b>: ${it.from ? `<s>${esc(it.from)}</s> to ` : ""}${esc(it.to)}${it.kind === "change" ? ` <span class="chip c-soon">replaces existing</span>` : ""}</span></label>`;

/* Manual entry: warn before creating a second copy of a task. */
let DUP = null;
function dupModal(e, inc) {
  const items = diffInto(e, inc).map((x, i) => ({ ...x, i }));
  DUP = { e, inc, items };
  const who = e.person_id ? pName(e.person_id) : "Unassigned";
  openModal(`Already in your tracker: #${e.no}`, `<p style="margin-top:0">This looks like task <b>#${e.no} ${esc(e.title)}</b> (${esc(who)}, ${esc(e.status)}${e.due_date ? ", due " + esc(dueText(e)) : ""}${needsAction(e) ? "" : ", closed"}).</p>
    ${items.length ? `<p class="sub" style="margin:0 0 6px">Tick what to add to #${e.no}. New information is ticked; anything that would replace an existing value is not.</p><div class="difs">${items.map(diffRow).join("")}</div>` : `<div class="note">Nothing new to add. Everything you entered is already on #${e.no}.</div>`}`,
    `${items.length ? `<button class="btn pri" data-act="dupmerge">Update #${e.no}</button>` : `<button class="btn pri" data-act="dupopen">Open #${e.no}</button>`}<button class="btn" data-act="dupnew">Create a new task anyway</button><button class="btn ghost" data-act="dupcancel">Back</button>`);
}

/* =========================================================== subtasks and forwarding */
let SPL = null;
/* Forwarding extras: an optional note and files that go onto every forwarded task */
let FX = { note: "", files: [] };
const fxReset = () => { FX = { note: "", files: [] }; };
function fxHtml() {
  return `<div class="fx"><label class="f">Note for the person <span class="sub" style="font-weight:400">(optional, added as the first update)</span><textarea id="fx-note" rows="3" placeholder="Context, instructions or what you need back">${esc(FX.note)}</textarea></label>
    <div class="f"><span>Attachments <span class="sub" style="font-weight:400">(optional, up to 10 MB each)</span></span>
    <div class="row" style="gap:8px;flex-wrap:wrap"><label class="btn sm">${ic("clip")} Add files<input type="file" id="fx-files" multiple hidden></label>
    ${FX.files.map((f, i) => `<span class="chip fxf">${esc(f.name)} <button type="button" class="btn ghost icon sm" data-fxrm="${i}" aria-label="Remove ${esc(f.name)}">${ic("x")}</button></span>`).join("")}</div></div></div>`;
}
const fxSync = () => { const n = $("#fx-note"); if (n) FX.note = n.value; };
async function fxApply(taskIds) {
  fxSync(); const note = FX.note.trim(), files = FX.files; let failed = 0;
  for (const id of taskIds) {
    if (note) { try { await api.addNote(id, note); } catch (e) { failed++; } }
    for (const f of files) { try { await api.upload(me.id, id, f); } catch (e) { failed++; } }
  }
  return failed;
}
function splitModal(parent, mode) {
  fxReset();
  const fwdMode = mode === "fwd", T = team();
  if (!T.length) { toast(fwdMode ? "Add your own team on the Team page first, then forward to them" : "Add people on the Team page first"); return; }
  SPL = { parent, mode, rows: fwdMode ? [{ title: parent.title, person_id: "", due: parent.due_date || "" }] : [{ title: "", person_id: "", due: parent.due_date || "" }, { title: "", person_id: "", due: parent.due_date || "" }] };
  drawSplit();
}
function drawSplit() {
  const { parent, mode, rows } = SPL, fwdMode = mode === "fwd", T = team();
  openModal(fwdMode ? `Forward #${parent.no}` : `Subtasks for #${parent.no}`, `<p style="margin-top:0"><b>#${parent.no} ${esc(parent.title)}</b>${parent.due_date ? ` · due ${esc(dueText(parent))}` : ""}</p>
    ${fwdMode ? `<p class="sub" style="margin:0 0 10px">Forward the whole task to one person, or add rows to split it into parts for different people. The new tasks go into <b>your</b> tracker, linked to this one. The owner sees how many are done, not your tracker.</p>` : `<p class="sub" style="margin:0 0 10px">Each row becomes a subtask in your tracker, linked to #${parent.no}.</p>`}
    <div class="splits">${rows.map((r, i) => `<div class="splitrow"><input data-sp="title" data-i="${i}" value="${esc(r.title)}" placeholder="${fwdMode && rows.length === 1 ? "Task" : "Part " + (i + 1)}" aria-label="Title"><select data-sp="person_id" data-i="${i}" aria-label="Person">${opt(T.map(p => [p.id, p.name]), r.person_id, "Choose person")}</select><input type="date" data-sp="due" data-i="${i}" value="${esc(r.due)}" aria-label="Due date">${rows.length > 1 ? `<button type="button" class="btn icon ghost" data-sprm="${i}" aria-label="Remove row">${ic("x")}</button>` : ""}</div>`).join("")}</div>
    <button type="button" class="btn" style="margin-top:8px" data-act="spadd">${ic("plus")} ${fwdMode && rows.length === 1 ? "Split into parts" : "Add another part"}</button>
    ${fxHtml()}
    ${fwdMode && can(parent, "notes") ? `<label class="chk" style="margin-top:12px"><input type="checkbox" id="sp-note" checked> Add an update on the original task saying who it was forwarded to</label>` : ""}`,
    `<button class="btn pri" data-act="spgo">${fwdMode ? (rows.length === 1 ? "Forward" : `Forward as ${rows.length} parts`) : `Create ${pl(rows.length, "subtask")}`}</button>`);
}
async function splitGo() {
  const { parent, mode, rows } = SPL, fwdMode = mode === "fwd";
  const R = rows.map(r => ({ ...r, title: r.title.trim() })).filter(r => r.title);
  if (!R.length) return toast("Give each part a title");
  if (R.some(r => !r.person_id)) return toast("Choose a person for each part");
  const btn = $('[data-act="spgo"]'); btn.disabled = true;
  try {
    const made = [], newIds = []; fxSync();
    for (const r of R) {
      const whole = fwdMode && R.length === 1;
      const n = await api.insertTask({ title: r.title, person_id: +r.person_id, owner_id: me.id, parent_id: parent.id, status: "Not Started", due_date: r.due || null, due_time: r.due && r.due === parent.due_date ? parent.due_time || null : null, category: parent.category || null, priority: parent.priority || null, checklist: whole ? cl(parent).map(x => ({ text: x.text, done: false })) : [], assignee_can_see: true, assignee_can: DEF_CAN });
      made.push(`${pName(+r.person_id)}${R.length > 1 ? " (" + r.title + ")" : ""}`); if (n && n.id) newIds.push(n.id);
    }
    const fxN = (FX.note.trim() || FX.files.length) ? await fxApply(newIds) : 0;
    if (fxN) toast("Forwarded, but some notes or files could not be added. Add them from the task.");
    if (fwdMode && $("#sp-note") && $("#sp-note").checked) { try { await api.addNote(parent.id, `Forwarded by ${me.full_name || me.email} to ${made.join(", ")}`); } catch (e) {} }
    closeModal(); closePanel(); SPL = null; fxReset(); await reload();
    toast(fwdMode ? `Forwarded to ${made.join(", ")}. The new ${R.length === 1 ? "task is" : "tasks are"} in your tracker` : `${pl(R.length, "subtask")} created`);
  } catch (e) { toast(errMsg(e)); } finally { if (btn) btn.disabled = false; }
}

/* =========================================================== bulk delete and forward */
async function bulkDelete() {
  const S = tasks.filter(t => selected.has(t.id)), own = S.filter(mine), skip = S.length - own.length;
  if (!own.length) return toast("You can delete only tasks in your own tracker");
  const kidsN = own.reduce((n, t) => n + kids(t).filter(k => !selected.has(k.id)).length, 0);
  const go = await askConfirm(`Delete ${pl(own.length, "task")} for good?`, `<div class="tlist" style="max-height:220px;overflow:auto;padding:6px 12px">${own.map(t => `<div style="padding:4px 0"><b>#${t.no}</b> ${esc(t.title)}${t.person_id ? ` <span class="sub">· ${esc(pName(t.person_id))}</span>` : ""}</div>`).join("")}</div>
    <p style="margin:10px 0 0">This cannot be undone. Their updates and change history are deleted with them.${kidsN ? ` ${pl(kidsN, "subtask")} of these will stay, no longer linked.` : ""}</p>
    <p class="sub" style="margin:6px 0 0">To keep a record instead, close this and set them to Dropped.${skip ? ` ${pl(skip, "task")} shared with you will be skipped: only their owner can delete them.` : ""}</p>`, `Delete ${pl(own.length, "task")}`, true);
  if (!go) return;
  let n = 0;
  try { for (const t of own) { await api.deleteTask(t.id); selected.delete(t.id); n++; } } catch (e) { toast(errMsg(e)); }
  await reload(); toast(`${pl(n, "task")} deleted`);
}
let BFW = null;
function bulkForward() {
  const S = tasks.filter(t => selected.has(t.id) && isOpen(t)), T = team();
  if (!S.length) return toast("Select open tasks to forward");
  if (!T.length) return toast("Add your team on the Team page first, then forward to them");
  const shared = S.filter(t => !mine(t)), own = S.filter(mine);
  BFW = { S, shared, own }; fxReset();
  openModal(`Forward ${pl(S.length, "task")}`, `<div class="fgrid">
    <label class="f">Forward to<select id="bf-person">${opt(T.map(p => [p.id, p.name]), "", "Choose person")}</select></label>
    <label class="f">New due date <span class="sub" style="font-weight:400">(optional)</span><input type="date" id="bf-due"></label></div>
    <div class="note" style="margin-top:12px">${shared.length ? `<div><b>${pl(shared.length, "task")} shared with you</b> will be copied into your tracker for this person, linked to the original. The owner sees progress, not your tracker.</div>` : ""}${own.length ? `<div${shared.length ? ' style="margin-top:6px"' : ""}><b>${pl(own.length, "task")} in your tracker</b> will be reassigned to this person${own.some(t => t.person_id) ? "; you will be asked for a reason" : ""}.</div>` : ""}</div>
    ${shared.some(t => can(t, "notes")) ? `<label class="chk" style="margin-top:10px"><input type="checkbox" id="bf-note" checked> Add an update on each original saying who it was forwarded to</label>` : ""}
    <p class="sub" style="margin:10px 0 0">Leave the due date empty to keep each task's own due date.</p>${fxHtml()}`, `<button class="btn pri" data-act="bfgo">Forward ${pl(S.length, "task")}</button>`);
}
async function bulkForwardGo() {
  const pid = +$("#bf-person").value, due = $("#bf-due").value, note = $("#bf-note") && $("#bf-note").checked;
  if (!pid) return toast("Choose who to forward to");
  const { shared, own } = BFW, who = pName(pid);
  const needR = own.filter(t => importantChanges(t, { person_id: pid, ...(due ? { due_date: due } : {}) }).length);
  let reason = null;
  if (needR.length) { reason = await askReason(due ? ["assignee", "due date"] : ["assignee"], pl(needR.length, "task")); if (!reason) return; }
  const btn = $('[data-act="bfgo"]'); if (btn) btn.disabled = true;
  let a = 0, b = 0; const touched = []; fxSync();
  try {
    for (const t of shared) {
      const nt = await api.insertTask({ title: t.title, person_id: pid, owner_id: me.id, parent_id: t.id, status: "Not Started", due_date: due || t.due_date || null, due_time: due ? null : t.due_time || null, category: t.category || null, priority: t.priority || null, checklist: cl(t).map(x => ({ text: x.text, done: false })), assignee_can_see: true, assignee_can: DEF_CAN });
      if (nt && nt.id) touched.push(nt.id);
      if (note && can(t, "notes")) { try { await api.addNote(t.id, `Forwarded by ${me.full_name || me.email} to ${who}`); } catch (e) {} }
      a++;
    }
    for (const t of own) {
      let p = { person_id: pid }; if (due) p.due_date = due;
      if (importantChanges(t, p).length) p = withReason(p, reason);
      await api.updateTask(t.id, p); b++; touched.push(t.id);
    }
    if (FX.note.trim() || FX.files.length) { const f = await fxApply(touched); if (f) toast("Forwarded, but some notes or files could not be added. Add them from the task."); }
  } catch (e) { toast(errMsg(e)); }
  closeModal(); BFW = null; fxReset(); selected.clear(); await reload();
  toast([a ? `${pl(a, "shared task")} forwarded` : "", b ? `${pl(b, "task")} reassigned` : ""].filter(Boolean).join(", ") + ` to ${who}`);
}

/* =========================================================== modal helpers */
function openModal(title, body, foot) { $("#mt").textContent = title; $("#mb").innerHTML = body; $("#mf").innerHTML = foot; $("#modal").classList.add("open"); }
function closeModal() { $("#modal").classList.remove("open"); $("#mb").innerHTML = ""; }

/* ---------- email ---------- */
function mailText(list) {
  const ps = [...new Set(list.map(t => t.person_id).filter(Boolean))];
  const single = ps.length === 1 && list.every(t => t.person_id === ps[0]) ? people.find(p => p.id === ps[0]) : null;
  const first = single ? single.name.split(" ")[0] : "";
  const sorted = list.slice().sort((a, b) => urgency(a) - urgency(b));
  const line = (t, i) => {
    const bits = [`Due: ${t.due_date ? dueText(t) + (cdText(t) ? " (" + cdText(t) + ")" : "") : "not set"}`, `Status: ${t.status}`];
    if (urgentT(t)) bits.push("URGENT");
    let out = `${i + 1}. #${t.no} ${t.title}\n   ${bits.join(" | ")}`;
    const c = cl(t); if (c.length) out += `\n   Checklist: ${c.filter(x => x.done).length}/${c.length} done; open: ${c.filter(x => !x.done).map(x => x.text + (itemWho(x) ? " (" + itemWho(x) + ")" : "")).join("; ") || "none"}`;
    if (t.waiting_on) out += `\n   Waiting on: ${t.waiting_on}`;
    if (t.latest_update) out += `\n   Latest update: ${t.latest_update}`;
    return out;
  };
  const body = `Hi${first ? " " + first : ""},\n\n${list.length === 1 ? "Please find the task below." : `Please find the ${list.length} tasks below, most urgent first.`} Kindly share an update on each.\n\n${sorted.map(line).join("\n\n")}\n\nRegards,\n${me.full_name || ""}`;
  const subject = list.length === 1 ? `Task #${list[0].no}: ${list[0].title}` : `${list.length} open tasks${single ? " for " + single.name : ""}${sorted[0] && flag(sorted[0]) === "Overdue" ? " (includes overdue)" : ""}`;
  return { to: single && single.email ? single.email : "", subject, body };
}
function openMail(list) {
  if (!list.length) return toast("Select at least one task");
  closePanel(); const m = mailText(list);
  openModal(list.length === 1 ? "Email task" : `Email ${list.length} tasks`, `<div class="fgrid">
    <label class="f w">To<input id="m-to" type="email" value="${esc(m.to)}" placeholder="name@dynolt.com"></label>
    <label class="f w">Subject<input id="m-sub" value="${esc(m.subject)}"></label>
    <label class="f w">Message (edit freely)<textarea id="m-body" class="mono" rows="15">${esc(m.body)}</textarea></label></div>
    <p class="sub" style="margin:10px 0 0">"Open in email app" starts a new email in Outlook or your mail app. Nothing is sent until you press Send there. For long lists, use Copy text.</p>`,
    `<button class="btn pri" data-act="mailgo">${ic("mail")} Open in email app</button><button class="btn" data-act="mailcopy">Copy text</button>`);
}
function mailGo() {
  const url = `mailto:${encodeURIComponent($("#m-to").value.trim())}?subject=${encodeURIComponent($("#m-sub").value)}&body=${encodeURIComponent($("#m-body").value)}`;
  if (url.length > 1900) toast("Long message: if the email opens cut short, use Copy text instead");
  location.href = url;
}
async function mailCopy() {
  const txt = `Subject: ${$("#m-sub").value}\n\n${$("#m-body").value}`;
  try { await navigator.clipboard.writeText(txt); toast("Copied. Paste it into a new email"); } catch (e) { const ta = $("#m-body"); ta.focus(); ta.select(); toast("Press Ctrl+C to copy"); }
}

/* ---------- Excel ---------- */
let XL = null;
function loadExcel() {
  if (window.ExcelJS) return Promise.resolve(window.ExcelJS);
  if (XL) return XL;
  XL = new Promise((res, rej) => { const s = document.createElement("script"); s.src = "vendor/exceljs.min.js"; s.onload = () => res(window.ExcelJS); s.onerror = () => { XL = null; rej(new Error("Could not load the Excel tool. Check your connection.")); }; document.head.appendChild(s); });
  return XL;
}
/* Excel has no time zones: give it the wall-clock value. */
const xd = s => s ? new Date(s.slice(0, 10) + "T00:00:00Z") : null;
const xdt = s => { const d = new Date(s); return new Date(d.getTime() - d.getTimezoneOffset() * 6e4); };
const COLS = [
  ["no", "No.", 7, t => t.no], ["title", "Task", 46, t => t.title], ["person", "Assigned to", 16, t => pName(t.person_id) || "Unassigned"],
  ["category", "Category", 13, t => t.category || ""], ["urgent", "Urgent", 8, t => urgentT(t) ? "Yes" : ""], ["status", "Status", 13, t => t.status],
  ["flag", "Flag", 18, t => flag(t)], ["due", "Due date", 12, t => xd(t.due_date)], ["duetime", "Due time", 10, t => t.due_time ? hm(t.due_time) : ""], ["countdown", "Days left", 10, t => { const d = left(t); return isOpen(t) && d !== null ? d : null; }],
  ["completed", "Completed on", 13, t => xd(t.completed_on)], ["validated", "Validated on", 13, t => xd(t.validated_on)],
  ["waiting", "Waiting on", 22, t => t.waiting_on || ""], ["blocked", "Blocked by", 11, t => t.blocked_by && tById(t.blocked_by) ? "#" + tById(t.blocked_by).no : ""],
  ["repeat", "Repeats", 13, t => t.recurrence ? REPEAT.find(r => r[0] === t.recurrence)[1] : ""], ["checklist", "Checklist done", 12, t => cl(t).length ? `${cl(t).filter(x => x.done).length}/${cl(t).length}` : ""],
  ["checkitems", "Checklist items", 36, t => cl(t).map(x => (x.done ? "[x] " : "[ ] ") + x.text + (itemWho(x) ? " (" + itemWho(x) + ")" : "")).join("\n")],
  ["parent", "Part of", 10, t => parentOf(t) ? "#" + parentOf(t).no : ""], ["subs", "Subtasks done", 12, t => { const s = subInfo(t); return s ? `${s.done}/${s.total}` : ""; }],
  ["seen", "Visible to assignee", 12, t => t.person_id ? (t.assignee_can_see === false ? "No" : "Yes") : ""], ["access", "Assignee may change", 30, t => t.person_id ? rightsText(canArr(t)) : ""], ["update", "Latest update", 44, t => t.latest_update || ""],
  ["updated", "Last updated", 12, t => xd(t.updated_on)], ["added", "Date added", 12, t => xd(iso(new Date(t.created_at)))]
];
const DEF_COLS = ["no", "title", "person", "category", "urgent", "status", "due", "duetime", "countdown", "waiting", "update", "updated"];
function exportModal(onlySelected) {
  const P = [...team().map(p => [String(p.id), p.name]), ["0", "Unassigned"]];
  const saved = JSON.parse(ls.get("tt-xl") || "null") || {};
  const cols = saved.cols || DEF_COLS;
  const ck = (name, v, l, on) => `<label class="chk"><input type="checkbox" name="${name}" value="${esc(v)}"${on ? " checked" : ""}> ${esc(l)}</label>`;
  openModal(onlySelected ? `Export ${selected.size} selected tasks` : "Export to Excel", `
  ${onlySelected ? `<input type="hidden" id="x-sel" value="1">` : `
  <fieldset class="fs"><legend>Which tasks</legend><div class="opts">${[["open", "Open"], ["closed", "Closed"], ["all", "All"]].map(([v, l]) => `<label class="chk"><input type="radio" name="x-view" value="${v}"${v === (F.view || "open") ? " checked" : ""}> ${l}</label>`).join("")}</div></fieldset>
  <fieldset class="fs"><legend>People</legend><div class="opts">${P.map(([v, l]) => ck("x-person", v, l, !F.person || String(F.person) === v)).join("")}</div></fieldset>
  <fieldset class="fs"><legend>Status</legend><div class="opts">${STAT.map(s => ck("x-status", s, s, !F.status || F.status === s)).join("")}</div></fieldset>
  <fieldset class="fs"><legend>Category</legend><div class="opts">${[...allCats(), "(none)"].map(c => ck("x-cat", c, c, !F.cat || F.cat === c)).join("")}</div></fieldset>
  <fieldset class="fs"><legend>Narrow down (optional)</legend><div class="fgrid">
    <label class="f">Flag<select id="x-flag">${opt([["Overdue", "Overdue"], ["Due soon", "Due in 10 days"], ["Awaiting validation", "Awaiting validation"], ["No due date", "No due date"], ["stale", `No update ${STALE_DAYS}+ days`], ["blocked", "Blocked"]], F.flag, "Any")}</select></label>
    <label class="chk" style="align-self:end"><input type="checkbox" id="x-urgent"${F.urgent ? " checked" : ""}> Urgent only</label>
    <label class="f">Due from<input type="date" id="x-df"></label><label class="f">Due to<input type="date" id="x-dt"></label>
    <label class="f">Added from<input type="date" id="x-af"></label><label class="f">Added to<input type="date" id="x-at"></label></div></fieldset>`}
  <fieldset class="fs"><legend>Columns</legend><div class="opts">${COLS.map(c => ck("x-col", c[0], c[1], cols.includes(c[0]))).join("")}</div></fieldset>
  <fieldset class="fs"><legend>Extra sheets</legend><div class="opts">${ck("x-sheet", "summary", "Summary by person", saved.summary !== false)}${ck("x-sheet", "history", "History of these tasks", !!saved.history)}</div></fieldset>
  <label class="f">File name<input id="x-name" value="Dynolt_Tasks_${TODAY()}"></label>
  <p class="sub" id="x-count" style="margin:10px 0 0"></p>`,
    `<button class="btn pri" data-act="xlgo">${ic("xls")} Download Excel</button><button class="btn ghost" data-act="xlreset">Reset choices</button>`);
  updateXCount();
}
function xPick() {
  const vals = n => $$(`#mb [name="${n}"]:checked`).map(i => i.value);
  if ($("#x-sel")) return tasks.filter(t => selected.has(t.id)).sort((a, b) => urgency(a) - urgency(b));
  const view = ($("#mb [name=x-view]:checked") || {}).value || "open", ps = vals("x-person"), st = vals("x-status"), cs = vals("x-cat");
  const fl = $("#x-flag").value, ur = $("#x-urgent").checked, df = $("#x-df").value, dt = $("#x-dt").value, af = $("#x-af").value, at = $("#x-at").value;
  return tasks.filter(mine).filter(t => {
    if (view === "open" && !needsAction(t)) return false; if (view === "closed" && needsAction(t)) return false;
    if (!ps.includes(String(t.person_id || 0))) return false; if (!st.includes(t.status)) return false; if (!cs.includes(t.category || "(none)")) return false;
    if (ur && !urgentT(t)) return false;
    if (fl === "stale" ? !isStale(t) : fl === "blocked" ? !blockedT(t) : fl && flag(t) !== fl) return false;
    if (df && (!t.due_date || t.due_date < df)) return false; if (dt && (!t.due_date || t.due_date > dt)) return false;
    const a = t.created_at.slice(0, 10); if (af && a < af) return false; if (at && a > at) return false;
    return true;
  }).sort((a, b) => urgency(a) - urgency(b));
}
function updateXCount() { const n = xPick().length, el = $("#x-count"); if (el) el.textContent = `${n} task${n === 1 ? "" : "s"} will be exported.`; }
function styleHeader(ws, n) {
  const r = ws.getRow(1); r.height = 22;
  for (let i = 1; i <= n; i++) { const c = r.getCell(i); c.font = { name: "Arial", bold: true, color: { argb: "FFFFFFFF" }, size: 10 }; c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1A1A1A" } }; c.alignment = { vertical: "middle", wrapText: true }; }
  ws.views = [{ state: "frozen", ySplit: 1 }];
  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: n } };
}
function bodyFont(ws) { ws.eachRow((row, i) => { if (i > 1) row.eachCell({ includeEmpty: true }, c => { c.font = Object.assign({ name: "Arial", size: 10 }, c.font && c.font.bold ? { bold: true } : {}); c.alignment = Object.assign({ vertical: "top", wrapText: true }, c.alignment || {}); }); }); }
async function download(wb, name) {
  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name.replace(/[^\w\- ]+/g, "_") + ".xlsx"; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}
function tasksSheet(wb, list, colKeys, title) {
  const cols = COLS.filter(c => colKeys.includes(c[0]));
  const ws = wb.addWorksheet(title || "Tasks");
  ws.columns = cols.map(c => ({ header: c[1], key: c[0], width: c[2] }));
  list.forEach(t => {
    const r = ws.addRow(Object.fromEntries(cols.map(c => [c[0], c[3](t)])));
    cols.forEach((c, i) => { if (["due", "completed", "validated", "updated", "added"].includes(c[0])) r.getCell(i + 1).numFmt = "dd-mmm-yy"; });
    const f = flag(t);
    if (f === "Overdue") r.eachCell({ includeEmpty: true }, c => c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFDECEC" } });
    else if (!needsAction(t)) r.eachCell({ includeEmpty: true }, c => c.font = { name: "Arial", size: 10, color: { argb: "FF808080" } });
    const fi = cols.findIndex(c => c[0] === "flag"); if (fi >= 0) r.getCell(fi + 1).font = { name: "Arial", size: 10, bold: true, color: { argb: f === "Overdue" ? "FFB42318" : f === "Due soon" ? "FF8A5300" : f === "Awaiting validation" ? "FFA33F00" : "FF333333" } };
  });
  styleHeader(ws, cols.length); bodyFont(ws);
  return ws;
}
function summarySheet(wb, list) {
  const ws = wb.addWorksheet("Summary by person");
  ws.columns = [["Person", 22], ["Tasks", 9], ["Open", 9], ["Overdue", 10], ["Due in 10 days", 15], ["Awaiting validation", 19], ["Completed", 11], ["Dropped", 10]].map(([h, w]) => ({ header: h, width: w }));
  const G = {}; list.forEach(t => { const k = pName(t.person_id) || "Unassigned"; (G[k] = G[k] || []).push(t); });
  Object.keys(G).sort().forEach(k => { const L = G[k]; ws.addRow([k, L.length, L.filter(isOpen).length, L.filter(t => flag(t) === "Overdue").length, L.filter(t => flag(t) === "Due soon").length, L.filter(awaiting).length, L.filter(t => t.status === "Completed").length, L.filter(t => t.status === "Dropped").length]); });
  const tr = ws.addRow(["Total", list.length, list.filter(isOpen).length, list.filter(t => flag(t) === "Overdue").length, list.filter(t => flag(t) === "Due soon").length, list.filter(awaiting).length, list.filter(t => t.status === "Completed").length, list.filter(t => t.status === "Dropped").length]);
  styleHeader(ws, 8); bodyFont(ws); tr.eachCell(c => c.font = { name: "Arial", size: 10, bold: true });
}
async function historySheet(wb, list) {
  const H = await api.historyFor(list.map(t => t.id)), ws = wb.addWorksheet("Task history");
  ws.columns = [["Task no.", 9], ["Task", 40], ["Date and time", 18], ["By", 18], ["Update", 70]].map(([h, w]) => ({ header: h, width: w }));
  const map = new Map(list.map(t => [t.id, t]));
  H.forEach(u => { const t = map.get(u.task_id); if (t) { const r = ws.addRow([t.no, t.title, xdt(u.created_at), u.author_name || "", u.body]); r.getCell(3).numFmt = "dd-mmm-yy hh:mm"; } });
  styleHeader(ws, 5); bodyFont(ws);
}
function aboutSheet(wb, lines) {
  const ws = wb.addWorksheet("About this file"); ws.columns = [{ width: 24 }, { width: 70 }];
  [["Generated by", me.full_name || me.email], ["Generated on", fmtTime(new Date().toISOString())], ...lines].forEach(l => ws.addRow(l));
  ws.getColumn(1).font = { name: "Arial", bold: true, size: 10 }; ws.getColumn(2).font = { name: "Arial", size: 10 };
}
async function exportGo() {
  const list = xPick(); if (!list.length) return toast("No tasks match these choices");
  const cols = $$('#mb [name="x-col"]:checked').map(i => i.value); if (!cols.length) return toast("Pick at least one column");
  const sheets = $$('#mb [name="x-sheet"]:checked').map(i => i.value);
  ls.set("tt-xl", JSON.stringify({ cols, summary: sheets.includes("summary"), history: sheets.includes("history") }));
  const btn = $('[data-act="xlgo"]'); btn.disabled = true; btn.textContent = "Preparing...";
  try {
    const X = await loadExcel(), wb = new X.Workbook(); wb.creator = me.full_name || "Dynolt Task Tracker";
    tasksSheet(wb, list, cols);
    if (sheets.includes("summary")) summarySheet(wb, list);
    if (sheets.includes("history")) await historySheet(wb, list);
    const desc = $("#x-sel") ? [["Tasks", `${list.length} selected tasks`]] : [["Tasks", ($("#mb [name=x-view]:checked") || {}).value || "open"], ["People", $$('#mb [name="x-person"]:checked').map(i => i.parentElement.textContent.trim()).join(", ")], ["Status", $$('#mb [name="x-status"]:checked').map(i => i.value).join(", ")], ["Categories", $$('#mb [name="x-cat"]:checked').map(i => i.value).join(", ")], ["Flag", $("#x-flag").selectedOptions[0].textContent + ($("#x-urgent").checked ? ", urgent only" : "")]];
    aboutSheet(wb, [...desc, ["Rows", String(list.length)]]);
    await download(wb, $("#x-name").value || "Dynolt_Tasks");
    closeModal(); toast(`Excel downloaded with ${list.length} tasks`);
  } catch (e) { toast(errMsg(e)); } finally { if (btn) { btn.disabled = false; btn.innerHTML = `${ic("xls")} Download Excel`; } }
}
async function exportReport() {
  try {
    const X = await loadExcel(), wb = new X.Workbook(), T = tasks.filter(mine), since = addDays(TODAY(), -repDays);
    const ws = wb.addWorksheet("By person");
    ws.columns = [["Person", 22], ["Open", 9], ["Overdue", 10], [`Completed (${repDays} days)`, 18], ["On time %", 11], ["Avg days to close", 17], ["Awaiting validation", 19], ["Created", 10]].map(([h, w]) => ({ header: h, width: w }));
    [...team().map(p => [p.name, T.filter(t => t.person_id === p.id)]), ["Unassigned", T.filter(t => !t.person_id)]].filter(r => r[1].length).forEach(([n, G]) => { const s = stats(G, since); ws.addRow([n, s.open, s.od, s.closed, s.onTime, s.avg, s.av, s.created]); });
    const a = stats(T, since), tr = ws.addRow(["All", a.open, a.od, a.closed, a.onTime, a.avg, a.av, a.created]);
    styleHeader(ws, 8); bodyFont(ws); tr.eachCell(c => c.font = { name: "Arial", size: 10, bold: true });
    tasksSheet(wb, T.filter(t => t.completed_on && t.completed_on >= since).sort((x, y) => x.completed_on < y.completed_on ? 1 : -1), ["no", "title", "person", "category", "due", "completed", "validated", "added"], "Completed in period");
    tasksSheet(wb, T.filter(isOpen).sort((x, y) => urgency(x) - urgency(y)), ["no", "title", "person", "category", "status", "flag", "due", "countdown", "update"], "Open now");
    aboutSheet(wb, [["Period", `Last ${repDays} days (from ${fmt(since)})`], ["On time", "Completed on or before the due date"], ["Avg days to close", "From creation to completion"]]);
    await download(wb, `Dynolt_Task_Report_${TODAY()}`); toast("Report downloaded");
  } catch (e) { toast(errMsg(e)); }
}
async function backup() {
  toast("Preparing backup...");
  try {
    const X = await loadExcel(), wb = new X.Workbook(), T = tasks.filter(mine).sort((a, b) => a.no - b.no);
    tasksSheet(wb, T, COLS.map(c => c[0]), "All tasks");
    const wp = wb.addWorksheet("Team"); wp.columns = [["Name", 22], ["Email", 30], ["Can see own tasks", 18]].map(([h, w]) => ({ header: h, width: w })); team().forEach(p => wp.addRow([p.name, p.email || "", p.shared ? "Yes" : "No"])); styleHeader(wp, 3); bodyFont(wp);
    const wc = wb.addWorksheet("Categories"); wc.columns = [{ header: "Category", width: 24 }]; cats.forEach(c => wc.addRow([c.name])); styleHeader(wc, 1);
    const wt = wb.addWorksheet("Templates"); wt.columns = [["Name", 24], ["Title", 40], ["Category", 14], ["Repeats", 14], ["Checklist", 50]].map(([h, w]) => ({ header: h, width: w })); templates.forEach(t => wt.addRow([t.name, t.title, t.category || "", t.recurrence || "", (t.checklist || []).map(x => x.text).join("\n")])); styleHeader(wt, 5); bodyFont(wt);
    await historySheet(wb, T);
    aboutSheet(wb, [["Contents", "Complete backup of your tracker"], ["Tasks", String(T.length)], ["To restore", 'Settings, then "Restore from backup", then pick this file. Only what is missing is added back.']]);
    restoreSheet(wb, T);
    await download(wb, `Dynolt_Tracker_Backup_${TODAY()}`); toast("Backup downloaded. Keep it somewhere safe");
  } catch (e) { toast(errMsg(e)); }
}

/* ---------- Delete my account ---------- */
function deleteAccountModal() {
  const T = tasks.filter(mine), sharedOut = T.filter(t => t.person_id && personOf(t) && personOf(t).shared).length;
  openModal("Delete my account", `<div class="note err" style="margin-top:0"><b>This cannot be undone.</b> Your login and your whole tracker are deleted: ${pl(T.length, "task")}, ${pl(team().length, "team member")}, your categories and templates, and their history.</div>
    <ul style="margin:10px 0;padding-left:18px;font-size:13.5px;line-height:1.6">
      ${sharedOut ? `<li>${pl(sharedOut, "task")} you shared with people will disappear for them too.</li>` : ""}
      <li>Tasks other people shared with you stay in their trackers. Updates you wrote there keep your name.</li>
      ${me.is_admin ? "<li>You are the admin. The longest-standing remaining account becomes admin.</li>" : ""}
      <li>You can sign up again later with the same email, starting from an empty tracker.</li></ul>
    <div class="row" style="margin-bottom:12px"><button class="btn" data-act="backup">${ic("xls")} Download a backup first</button></div>
    <label class="f"><span>Type <b>DELETE</b> to confirm</span><input id="del-confirm" autocomplete="off" placeholder="DELETE"></label>`,
    `<button class="btn danger" data-act="delacctgo" disabled>Delete my account for good</button><button class="btn ghost" data-act="mclose">Cancel</button>`);
}
async function deleteAccountGo() {
  const btn = $('[data-act="delacctgo"]'); btn.disabled = true; btn.textContent = "Deleting...";
  try {
    for (const t of tasks.filter(mine)) { try { const F = await api.files(me.id, t.id); for (const f of F) await api.removeFile(me.id, t.id, f.name); } catch (e) {} }
    await api.deleteAccount();
    closeModal(); closePanel(); me = null; tasks = []; people = []; selected.clear(); reload.scoped = false; scope = "mine";
    history.replaceState(null, "", location.pathname); render();
    $("#lerr").textContent = "Your account and tracker have been deleted.";
  } catch (e) { toast(errMsg(e)); btn.disabled = false; btn.textContent = "Delete my account for good"; }
}

/* ---------- Restore from a backup file (weekly email or "Download full backup") ---------- */
function restorePayloadSite(T) {
  const byId = new Map(T.map(t => [t.id, t]));
  return { v: 1, exported_on: TODAY(), owner: { email: me.email, name: me.full_name },
    people: team().map(p => ({ id: p.id, name: p.name, email: p.email, shared: !!p.shared })), categories: cats.map(c => c.name),
    templates: templates.map(t => ({ name: t.name, title: t.title, category: t.category, priority: t.priority, recurrence: t.recurrence, checklist: t.checklist || [] })),
    tasks: T.map(t => ({ no: t.no, title: t.title, category: t.category, priority: t.priority, status: t.status, due_date: t.due_date, due_time: t.due_time, start_date: t.start_date, completed_on: t.completed_on, validated: !!t.validated, waiting_on: t.waiting_on, person_id: t.person_id, checklist: cl(t), recurrence: t.recurrence, assignee_can_see: t.assignee_can_see !== false, assignee_can: t.assignee_can, created_at: t.created_at, blocked_by_no: t.blocked_by && byId.get(t.blocked_by) ? byId.get(t.blocked_by).no : null, parent_no: t.parent_id && byId.get(t.parent_id) ? byId.get(t.parent_id).no : null })),
    notes: T.flatMap(t => (notesBy.get(t.id) || []).slice().reverse().map(n => ({ task_no: t.no, author_name: n.author_name, body: n.body, created_at: n.created_at }))) };
}
function restoreSheet(wb, T) {
  const json = JSON.stringify(restorePayloadSite(T)), ws = wb.addWorksheet("Restore data"); ws.state = "hidden";
  ws.addRow(["DYNOLT_TRACKER_RESTORE_V1", String(Math.ceil(json.length / 30000))]);
  for (let i = 0; i < json.length; i += 30000) ws.addRow([json.slice(i, i + 30000)]);
}
let RST = null;
function restoreModal() {
  openModal("Restore from backup", `<p class="sub" style="margin-top:0">Pick a file made with "Download full backup". Nothing already in your tracker is changed or duplicated; only what is missing is added back.</p>
    <label class="f">Backup file<input type="file" id="rst-file" accept=".xlsx"></label><div id="rst-area" style="margin-top:12px"></div>`, `<button class="btn pri" data-act="rstgo" disabled>Restore</button>`);
}
async function rstFile(file) {
  const area = $("#rst-area"); area.innerHTML = `<span class="sub">Reading file...</span>`;
  try {
    const sheets = /\.xlsx$/i.test(file.name) ? await readXlsxValues(await file.arrayBuffer()) : [];
    const sh = sheets.find(s => s.rows[0] && s.rows[0][0] === "DYNOLT_TRACKER_RESTORE_V1");
    if (!sh) { area.innerHTML = `<div class="note err">This is not a tracker backup file. Use a file made with "Download full backup". To bring in tasks from another Excel, use Import instead.</div>`; return; }
    const P = JSON.parse(sh.rows.slice(1).map(r => String(r[0] ?? "")).join(""));
    const mineT = tasks.filter(mine), have = new Set(mineT.map(t => normT(t.title)));
    const missT = P.tasks.filter(t => !have.has(normT(t.title))), keptT = P.tasks.length - missT.length;
    const missP = P.people.filter(p => !team().some(q => q.name.toLowerCase() === String(p.name).toLowerCase()));
    const missC = P.categories.filter(c => !cats.some(x => x.name.toLowerCase() === String(c).toLowerCase()));
    const missTp = P.templates.filter(t => !templates.some(x => x.name.toLowerCase() === String(t.name).toLowerCase()));
    RST = { P, missT, missP, missC, missTp };
    const other = P.owner && P.owner.email && P.owner.email.toLowerCase() !== String(me.email).toLowerCase();
    area.innerHTML = `${other ? `<div class="note err">This backup belongs to ${esc(P.owner.email)}. Restoring it copies their tasks into your tracker.</div>` : ""}
      <div class="note">Backup of <b>${esc(fmt(P.exported_on))}</b>${P.owner && P.owner.name ? ` from ${esc(P.owner.name)}` : ""}: ${pl(P.tasks.length, "task")}, ${pl(P.people.length, "team member")}.</div>
      <table class="t" style="margin-top:10px"><tbody>
        <tr><td>Tasks missing from your tracker</td><td class="n"><b>${missT.length}</b></td></tr>
        <tr><td>Tasks already there (left as they are)</td><td class="n">${keptT}</td></tr>
        <tr><td>Team members to add back</td><td class="n">${missP.length}</td></tr>
        <tr><td>Categories to add back</td><td class="n">${missC.length}</td></tr>
        <tr><td>Templates to add back</td><td class="n">${missTp.length}</td></tr></tbody></table>
      ${missT.length ? `<div class="tlist" style="max-height:180px;overflow:auto;padding:6px 12px;margin-top:10px">${missT.slice(0, 50).map(t => `<div style="padding:3px 0">#${t.no} ${esc(t.title)} <span class="sub">· ${esc(t.status)}</span></div>`).join("")}${missT.length > 50 ? `<div class="sub">and ${missT.length - 50} more</div>` : ""}</div>
      ${missT.some(t => t.status === "Completed" || t.status === "Dropped") ? `<label class="chk" style="margin-top:8px"><input type="checkbox" id="rst-closed" checked> Also restore the ${missT.filter(t => t.status === "Completed" || t.status === "Dropped").length} closed ones</label>` : ""}` : ""}
      <p class="sub" style="margin:10px 0 0">Restored tasks get new numbers. Their updates come back with the original date and author written at the start.</p>`;
    $('[data-act="rstgo"]').disabled = !(missT.length || missP.length || missC.length || missTp.length);
  } catch (e) { area.innerHTML = `<div class="note err">Could not read the file: ${esc(errMsg(e))}</div>`; }
}
async function rstGo() {
  const { P, missP, missC, missTp } = RST; let { missT } = RST;
  if ($("#rst-closed") && !$("#rst-closed").checked) missT = missT.filter(t => t.status !== "Completed" && t.status !== "Dropped");
  const btn = $('[data-act="rstgo"]'); btn.disabled = true; btn.textContent = "Restoring...";
  const pmap = new Map(); let n = 0, failed = [];
  try {
    for (const c of missC) { try { await api.addCategory(c); } catch (e) {} }
    for (const p of missP) { const np = await api.addPerson({ name: p.name, email: p.email || null, shared: !!p.shared && !!p.email }); pmap.set(p.id, np.id); }
    for (const p of P.people) if (!pmap.has(p.id)) { const q = team().find(x => x.name.toLowerCase() === String(p.name).toLowerCase()); if (q) pmap.set(p.id, q.id); }
    for (const t of missTp) { try { await api.addTemplate({ name: t.name, title: t.title || t.name, category: t.category || null, priority: t.priority || null, recurrence: t.recurrence || null, checklist: (t.checklist || []).map(x => ({ text: x.text, done: false })) }); } catch (e) {} }
    const noMap = new Map(tasks.filter(mine).map(t => [normT(t.title), t.id])), made = [];
    const byNo = new Map(P.tasks.map(t => [t.no, t]));
    for (const t of missT.slice().sort((a, b) => a.no - b.no)) {
      const ck = (t.checklist || []).map(x => { const y = { text: x.text, done: !!x.done }; const pid = x.person_id ? pmap.get(x.person_id) : null; if (pid) { y.person_id = pid; if (x.share) y.share = true; } return y; });
      const row = { title: t.title, category: t.category || null, priority: t.priority || null, status: t.status, due_date: t.due_date || null, due_time: t.due_date ? t.due_time || null : null, waiting_on: t.waiting_on || null, person_id: t.person_id ? pmap.get(t.person_id) || null : null, owner_id: me.id, checklist: ck, recurrence: t.recurrence || null, assignee_can_see: t.assignee_can_see !== false, assignee_can: Array.isArray(t.assignee_can) ? t.assignee_can : DEF_CAN, validated: t.status === "Completed" && !!t.validated };
      try {
        const nt = await api.insertTask(row); noMap.set(normT(t.title), nt.id); made.push([t, nt]); n++;
        const N = P.notes.filter(x => x.task_no === t.no).sort((a, b) => a.created_at < b.created_at ? -1 : 1).map(x => `[${fmtTime(x.created_at)}${x.author_name ? " · " + x.author_name : ""}] ${x.body}`);
        await api.addNotes(nt.id, [...N, `Restored from the backup of ${fmt(P.exported_on)}`]);
        btn.textContent = `Restoring ${n} of ${missT.length}`;
      } catch (e) { failed.push(`#${t.no} ${t.title}: ${errMsg(e)}`); }
    }
    for (const [t, nt] of made) {
      const patch = {};
      if (t.parent_no && byNo.get(t.parent_no)) { const pid = noMap.get(normT(byNo.get(t.parent_no).title)); if (pid) patch.parent_id = pid; }
      if (t.blocked_by_no && byNo.get(t.blocked_by_no)) { const bid = noMap.get(normT(byNo.get(t.blocked_by_no).title)); if (bid) patch.blocked_by = bid; }
      if (Object.keys(patch).length) { try { await api.updateTask(nt.id, patch); } catch (e) {} }
    }
    closeModal(); await reload();
    toast(`Restored ${pl(n, "task")}${missP.length ? `, ${pl(missP.length, "team member")}` : ""}${failed.length ? `. ${failed.length} could not be restored` : ""}`);
    if (failed.length) console.warn("Not restored:", failed);
  } catch (e) { toast(errMsg(e)); await reload(); } finally { btn.disabled = false; btn.textContent = "Restore"; }
}

/* ---------- Import ---------- */
let IMP = null, ZP = null;
function loadZip() {
  if (window.JSZip) return Promise.resolve(window.JSZip);
  if (ZP) return ZP;
  ZP = new Promise((res, rej) => { const s = document.createElement("script"); s.src = "vendor/jszip.min.js"; s.onload = () => res(window.JSZip); s.onerror = () => { ZP = null; rej(new Error("Could not load the file reader. Check your connection.")); }; document.head.appendChild(s); });
  return ZP;
}
/* Reads cell values only, so large formatting or validation ranges in real-world files do not matter. */
async function readXlsxValues(buf) {
  const Z = await loadZip(), zip = await Z.loadAsync(buf), P = new DOMParser();
  const xml = async p => { const f = zip.file(p); return f ? P.parseFromString(await f.async("string"), "application/xml") : null; };
  const byTag = (n, t) => [...n.getElementsByTagName(t)];
  const ss = await xml("xl/sharedStrings.xml");
  const strings = ss ? byTag(ss, "si").map(si => byTag(si, "t").map(t => t.textContent).join("")) : [];
  const wb = await xml("xl/workbook.xml"), rels = await xml("xl/_rels/workbook.xml.rels");
  const relMap = {}; if (rels) byTag(rels, "Relationship").forEach(r => relMap[r.getAttribute("Id")] = r.getAttribute("Target"));
  const out = [];
  for (const sh of byTag(wb, "sheet")) {
    const rid = sh.getAttribute("r:id") || sh.getAttributeNS("http://schemas.openxmlformats.org/officeDocument/2006/relationships", "id");
    let target = relMap[rid] || ""; target = target.replace(/^\//, ""); if (!target.startsWith("xl/")) target = "xl/" + target;
    const doc = await xml(target); if (!doc) continue;
    const rows = [];
    for (const r of byTag(doc, "row")) {
      const a = []; let has = false;
      for (const c of byTag(r, "c")) {
        const ref = c.getAttribute("r") || "", col = ref.replace(/\d+/g, "").split("").reduce((n, ch) => n * 26 + ch.charCodeAt(0) - 64, 0) - 1;
        const t = c.getAttribute("t"), vEl = byTag(c, "v")[0], v = vEl ? vEl.textContent : null;
        let val = null;
        if (t === "s" && v !== null) val = strings[+v] ?? ""; else if (t === "inlineStr") val = byTag(c, "t").map(x => x.textContent).join(""); else if (t === "b") val = v === "1"; else if (t === "str" || t === "e") val = v; else if (v !== null) val = Number(v);
        if (col >= 0 && val !== null && val !== "") { a[col] = val; has = true; }
      }
      if (has) rows.push(a);
    }
    if (rows.length) out.push({ name: sh.getAttribute("name"), rows });
  }
  return out;
}
const SYN = { title: ["task", "title", "task name", "description", "activity", "action point"], person: ["assigned to", "assigned", "assignee", "person"], person2: ["in charge", "incharge", "responsible", "owner"], category: ["category", "categories", "dept", "department", "type"], priority: ["priority", "urgent"], status: ["status", "state"], due: ["due date", "due", "target date", "deadline", "target"], time: ["due time", "time", "deadline time", "target time"], waiting: ["waiting on", "dependency", "blocker", "waiting"], update: ["latest update", "remarks", "remark", "update", "comments", "comment", "notes"] };
function importModal() {
  openModal("Import tasks from Excel", `<p class="sub" style="margin-top:0">Upload an .xlsx or .csv file with a header row. Every sheet in the workbook is read. Columns are matched by name: Task, Assigned To (or In Charge), Category, Priority, Status, Due Date, Due Time, Waiting On (or Dependency), Remarks.</p>
    <label class="f">File<input type="file" id="imp-file" accept=".xlsx,.csv"></label><div id="imp-area" style="margin-top:12px"></div>`, `<button class="btn pri" data-act="impgo" disabled>Import</button>`);
}
const normStatus = s => { s = String(s || "").toLowerCase().replace(/\s+/g, ""); if (!s) return "Not Started"; if (/complet|done|closed/.test(s)) return "Completed"; if (/hold/.test(s)) return "On Hold"; if (/drop|cancel/.test(s)) return "Dropped"; if (/notst|notsar|open|new|pending/.test(s)) return "Not Started"; return "In Progress"; };
const toISO = v => { if (!v) return null; if (typeof v === "number") return v > 20000 && v < 80000 ? iso(new Date(Date.UTC(1899, 11, 30) + Math.floor(v) * 864e5)) : null; if (v instanceof Date && !isNaN(v)) return iso(v); if (typeof v === "object" && v.result) return toISO(v.result); const s = String(v).trim(); let m; if ((m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/))) return `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`; if ((m = s.match(/^(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{2,4})$/))) { const y = m[3].length === 2 ? "20" + m[3] : m[3]; return `${y}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`; } if (/^\d{5}$/.test(s)) return iso(new Date(Date.UTC(1899, 11, 30) + (+s) * 864e5)); return null; };
const toTime = v => { if (v == null || v === "") return null; if (typeof v === "number") { const m = Math.round((v % 1) * 1440); return `${String(Math.floor(m / 60) % 24).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}:00`; } const s = String(v).trim().toLowerCase(), m = s.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/); if (!m) return null; let h = +m[1]; if (m[3] === "pm" && h < 12) h += 12; if (m[3] === "am" && h === 12) h = 0; if (h > 23) return null; return `${String(h).padStart(2, "0")}:${m[2] || "00"}:00`; };
const tidy = s => String(s || "").replace(/[ \t\u00a0]{2,}/g, " ").replace(/ *\n */g, "\n").replace(/\n{2,}/g, "\n").trim();
const cellText = v => v == null ? "" : typeof v === "object" ? (v.text || v.result || (v.richText ? v.richText.map(r => r.text).join("") : v instanceof Date ? iso(v) : "")) : String(v);
async function readImport(file) {
  let sheets = [];
  if (/\.csv$/i.test(file.name)) {
    const txt = await file.text(), rows = []; let row = [], cur = "", q = false;
    for (let i = 0; i < txt.length; i++) { const ch = txt[i]; if (q) { if (ch === '"' && txt[i + 1] === '"') { cur += '"'; i++; } else if (ch === '"') q = false; else cur += ch; } else if (ch === '"') q = true; else if (ch === ",") { row.push(cur); cur = ""; } else if (ch === "\n" || ch === "\r") { if (ch === "\r" && txt[i + 1] === "\n") i++; row.push(cur); rows.push(row); row = []; cur = ""; } else cur += ch; }
    if (cur || row.length) { row.push(cur); rows.push(row); }
    sheets = [{ name: file.name, rows }];
  } else {
    sheets = await readXlsxValues(await file.arrayBuffer());
  }
  return sheets;
}
function mapSheet(sh) {
  const hi = sh.rows.findIndex(r => r.some(c => SYN.title.includes(cellText(c).trim().toLowerCase())));
  if (hi < 0) return null;
  const head = sh.rows[hi].map(c => cellText(c).trim().toLowerCase()), idx = {};
  for (const [k, names] of Object.entries(SYN)) { for (const n of names) { const i = head.indexOf(n); if (i >= 0) { idx[k] = i; break; } } }
  if (idx.person === undefined && idx.person2 === undefined) { const i = head.findIndex(h => /assign|charge|owner/.test(h)); if (i >= 0) idx.person = i; }
  /* Day-by-day columns whose header is a date hold dated updates. */
  const dayCols = sh.rows[hi].map((c, i) => { const s = cellText(c).trim(); const d = typeof c === "number" ? toISO(c) : /^\d{1,4}[-\/.]\d{1,2}[-\/.]\d{1,4}$/.test(s) ? toISO(s) : null; return d && !Object.values(idx).includes(i) ? { i, d } : null; }).filter(Boolean).sort((x, y) => x.d < y.d ? -1 : 1);
  const who = r => (idx.person !== undefined ? cellText(r[idx.person]).trim() : "") || (idx.person2 !== undefined ? cellText(r[idx.person2]).trim() : "");
  const rows = sh.rows.slice(hi + 1).map(r => ({ title: cellText(r[idx.title]).trim(), person: who(r), days: dayCols.map(c => ({ d: c.d, text: tidy(cellText(r[c.i])) })).filter(x => x.text), category: idx.category !== undefined ? cellText(r[idx.category]).trim().replace(/^CQC$/i, "CQA") : "", urgent: idx.priority !== undefined && /high|urgent|yes|^1$/i.test(cellText(r[idx.priority])), status: normStatus(idx.status !== undefined ? cellText(r[idx.status]) : ""), due: idx.due !== undefined ? toISO(r[idx.due]) : null, time: idx.time !== undefined ? toTime(r[idx.time]) : null, waiting: idx.waiting !== undefined ? cellText(r[idx.waiting]).trim() : "", update: idx.update !== undefined ? tidy(cellText(r[idx.update])) : "" })).filter(r => r.title);
  return { idx, rows, start: dayCols.length ? dayCols[0].d : null };
}
async function impFile(file) {
  const area = $("#imp-area"); area.innerHTML = `<span class="sub">Reading file...</span>`;
  try {
    const sheets = await readImport(file);
    const mapped = sheets.map(sh => { const m = mapSheet(sh); return m && m.rows.length ? { name: sh.name, ...m } : null; }).filter(Boolean);
    if (!mapped.length) { area.innerHTML = `<div class="note err">No sheet in this file has a header row with a "Task" column.</div>`; return; }
    const nums = mapped.map(s => { const m = s.name.match(/(\d+)(?!.*\d)/); return m ? +m[1] : null; });
    const numbered = mapped.length > 1 && nums.every(n => n !== null) && new Set(nums).size === nums.length;
    const dated = mapped.length > 1 && mapped.every(s => s.start), future = dated ? mapped.filter(s => s.start > TODAY()) : [];
    IMP = { file: file.name, mapped, numbered, nums, dated, skipped: sheets.length - mapped.length };
    area.innerHTML = `${mapped.length > 1 ? `<label class="f" style="margin-bottom:10px">Sheets<select id="imp-sheet"><option value="all">All ${mapped.length} sheets, combined</option>${mapped.map((s, i) => `<option value="${i}">${esc(s.name)} only</option>`).join("")}</select></label>
      ${future.length ? `<label class="chk" style="margin-bottom:10px"><input type="checkbox" id="imp-future"> Include ${pl(future.length, "future week")} (${esc(future.map(s => s.name).join(", "))}). Left out by default: they start after today, so they are usually copies made in advance.</label>` : ""}
      ${numbered || dated ? "" : `<label class="chk" style="margin-bottom:10px"><input type="checkbox" id="imp-firstnew"> The newest sheet is the first one in the workbook</label>`}` : ""}<div id="imp-prev"></div>`;
    impPreview();
  } catch (e) { area.innerHTML = `<div class="note err">Could not read the file: ${esc(errMsg(e))}</div>`; }
}
/* Combine the chosen sheets, oldest first, into one entry per task. Newer values win; every distinct remark becomes an update. */
function impCombine() {
  const sel = $("#imp-sheet") ? $("#imp-sheet").value : "all";
  let list = IMP.mapped.map((s, i) => ({ ...s, n: IMP.nums[i], i }));
  if (sel !== "all") list = [list[+sel]];
  else if (IMP.dated) { list.sort((x, y) => x.start < y.start ? -1 : x.start > y.start ? 1 : 0); if (!($("#imp-future") && $("#imp-future").checked)) list = list.filter(s => s.start <= TODAY()); if (!list.length) list = IMP.mapped.map((s, i) => ({ ...s, i })); }
  else if (IMP.numbered) list.sort((x, y) => x.n - y.n);
  else if ($("#imp-firstnew") && $("#imp-firstnew").checked) list.reverse();
  const multi = list.length > 1, groups = [], exact = new Map(); let rowsN = 0;
  for (const sh of list) for (const r of sh.rows) {
    rowsN++;
    const k = normT(r.title); let g = exact.get(k);
    if (!g) { g = groups.find(x => simil(k, x.key) >= SIM); if (g) exact.set(k, g); }
    if (!g) { g = { key: k, title: r.title, person: "", category: "", urgent: false, status: "Not Started", due: null, time: null, waiting: "", notes: [], sheets: 0, last: "" }; groups.push(g); exact.set(k, g); }
    g.title = r.title; g.sheets++; g.last = sh.name; g.status = r.status;
    if (r.person) g.person = r.person; if (r.category) g.category = r.category; if (r.due) { g.due = r.due; g.time = r.time; } if (r.waiting) g.waiting = r.waiting; g.urgent = r.urgent;
    g.seen = g.seen || new Set();
    for (const x of r.days || []) { const k = normT(x.text); if (k && !g.seen.has(k)) { g.seen.add(k); g.notes.push(`[${fmt(x.d)}] ${x.text}`); } }
    if (r.update) { const k = normT(r.update); if (!g.seen.has(k)) { g.seen.add(k); g.notes.push(multi ? `[${sh.name}] ${r.update}` : r.update); } }
  }
  return { list, groups, rowsN, multi };
}
function impPreview() {
  const el = $("#imp-prev"), go = $('[data-act="impgo"]'), C = impCombine(), mineT = tasks.filter(mine);
  const byName = new Map(team().map(p => [p.name.toLowerCase(), p.id]));
  const incOf = g => ({ person_id: g.person ? byName.get(g.person.toLowerCase()) || null : null, personName: g.person, category: g.category, due_date: g.due, due_time: g.due ? g.time : null, waiting_on: g.waiting, priority: g.urgent ? "HIGH" : null, status: g.status, notes: g.notes });
  const fresh = [], dups = [];
  for (const g of C.groups) { const m = findMatch(g.title, mineT); if (!m) { fresh.push(g); continue; } const items = diffInto(m, incOf(g)); dups.push({ g, e: m, items, act: items.length ? "merge" : "skip" }); }
  /* two rows in the file that match the same existing task: merge into the first, create none */
  IMP.C = C; IMP.fresh = fresh; IMP.dups = dups; IMP.incOf = incOf;
  const done = fresh.filter(g => g.status === "Completed" || g.status === "Dropped").length;
  const names = [...new Set(C.groups.map(g => g.person).filter(Boolean))], newNames = names.filter(n => !byName.has(n.toLowerCase()));
  const span = C.multi ? `${C.list.length} sheets (${esc(C.list[0].name)} to ${esc(C.list[C.list.length - 1].name)}), newest values taken from ${esc(C.list[C.list.length - 1].name)}. ` : "";
  const summary = it => it.length ? it.map(x => x.label + (x.kind === "change" ? " (differs)" : "")).join(", ") : "Nothing new";
  el.innerHTML = `<div class="note">${span}${C.rowsN} rows combined into <b>${pl(C.groups.length, "task")}</b>: <b>${fresh.length} new</b>, <b>${dups.length} already in your tracker</b>.${IMP.skipped ? ` ${pl(IMP.skipped, "sheet")} without a Task column ignored.` : ""}</div>
    <h4 style="margin:14px 0 6px">New tasks <span class="sub">${fresh.length}</span></h4>
    ${fresh.length ? `<div class="tlist" style="max-height:220px;overflow:auto"><div class="tw"><table class="t"><thead><tr><th>Task</th><th>Person</th><th>Status</th><th>Due</th><th class="n">Updates</th></tr></thead><tbody>${fresh.slice(0, 40).map(g => `<tr><td>${esc(g.title)}</td><td>${esc(g.person)}</td><td>${esc(g.status)}</td><td>${esc(fmt(g.due || ""))}</td><td class="n">${g.notes.length}</td></tr>`).join("")}</tbody></table></div></div>${fresh.length > 40 ? `<p class="tiny">and ${fresh.length - 40} more</p>` : ""}
    ${done ? `<label class="chk" style="margin-top:8px"><input type="checkbox" id="imp-skipdone" checked> Skip the ${done} new ones that are already Completed or Dropped</label>` : ""}` : `<p class="sub" style="margin:0">None.</p>`}
    <h4 style="margin:16px 0 6px">Already in your tracker <span class="sub">${dups.length}</span></h4>
    ${dups.length ? `<p class="sub" style="margin:0 0 6px">For each one, choose what to do. "Add new info" only fills empty fields and adds remarks that are not there yet.</p>
    <div class="tlist" style="max-height:300px;overflow:auto"><div class="tw"><table class="t"><thead><tr><th>In the file</th><th>In your tracker</th><th>New information</th><th>Action</th></tr></thead><tbody>${dups.map((d, i) => `<tr><td>${esc(d.g.title)}</td><td>#${d.e.no} ${esc(d.e.title.slice(0, 40))}</td><td class="sub">${esc(summary(d.items))}</td><td><select data-dupact="${i}" style="min-height:32px;font-size:13px">${d.items.some(x => x.kind === "add") ? `<option value="merge"${d.act === "merge" ? " selected" : ""}>Add new info to #${d.e.no}</option>` : d.items.length ? `<option value="merge"${d.act === "merge" ? " selected" : ""}>Update #${d.e.no}</option>` : ""}<option value="new">Create as a new task</option><option value="skip"${d.act === "skip" ? " selected" : ""}>Skip</option></select></td></tr>`).join("")}</tbody></table></div></div>
    <label class="chk" style="margin-top:8px"><input type="checkbox" id="imp-replace"> Also replace values that differ (status, due date, assignee and so on) with the ones from the file</label>` : `<p class="sub" style="margin:0">None.</p>`}
    ${newNames.length ? `<label class="chk" style="margin-top:12px"><input type="checkbox" id="imp-newp" checked> Add ${pl(newNames.length, "new team member")}: ${esc(newNames.join(", "))}</label>` : ""}`;
  go.disabled = !fresh.length && !dups.length;
}
async function impGo() {
  if (!IMP || !IMP.C) return;
  const btn = $('[data-act="impgo"]'); btn.disabled = true;
  const addNewP = $("#imp-newp") ? $("#imp-newp").checked : false, replace = $("#imp-replace") ? $("#imp-replace").checked : false;
  const cache = new Map(team().map(p => [p.name.toLowerCase(), p.id]));
  let fresh = IMP.fresh; if ($("#imp-skipdone") && $("#imp-skipdone").checked) fresh = fresh.filter(g => g.status !== "Completed" && g.status !== "Dropped");
  const dups = IMP.dups.map((d, i) => ({ ...d, act: ($(`[data-dupact="${i}"]`) || {}).value || d.act }));
  const toNew = [...fresh, ...dups.filter(d => d.act === "new").map(d => d.g)], toMerge = dups.filter(d => d.act === "merge");
  const total = toNew.length + toMerge.length; if (!total) { btn.disabled = false; return toast("Nothing to import with these choices"); }
  const ensureCat = async c => { if (c && !cats.some(x => x.name.toLowerCase() === c.toLowerCase())) { try { await api.addCategory(c); } catch (e) {} cats.push({ name: c }); } };
  const pid = async name => { if (!name) return null; const k = name.toLowerCase(); if (cache.has(k)) return cache.get(k); if (!addNewP) return null; const p = await api.addPerson({ name }); cache.set(k, p.id); return p.id; };
  let n = 0, created = 0, updated = 0;
  try {
    for (const g of toNew) {
      await ensureCat(g.category);
      const t = await api.insertTask({ title: g.title, person_id: await pid(g.person), category: g.category || null, priority: g.urgent ? "HIGH" : null, status: g.status, due_date: g.due, due_time: g.due ? g.time : null, waiting_on: g.waiting || null, owner_id: me.id, checklist: [] });
      await api.addNotes(t.id, g.notes); created++; n++; btn.textContent = `Working ${n} of ${total}`;
    }
    for (const d of toMerge) {
      const items = d.items.map(x => ({ ...x, on: x.kind === "add" || replace }));
      if (items.some(x => x.on && x.key === "person_id" && String(x.val).startsWith("__new:") && !addNewP)) items.forEach(x => { if (x.key === "person_id" && String(x.val).startsWith("__new:")) x.on = false; });
      const cItem = items.find(x => x.on && x.key === "category"); if (cItem) await ensureCat(cItem.val);
      if (await applyMerge(d.e, items, cache, `Updated from Excel import (${IMP.file})`)) updated++; n++; btn.textContent = `Working ${n} of ${total}`;
    }
    closeModal(); await reload(); toast(`${pl(created, "task")} created, ${updated} existing ${updated === 1 ? "task" : "tasks"} updated`);
  } catch (e) { toast(`Stopped after ${n}: ${errMsg(e)}`); await reload(); } finally { btn.disabled = false; btn.textContent = "Import"; }
}

/* =========================================================== load */
async function reload() {
  if (!me || loading) return; loading = true;
  try {
    const [d, A, N, FW, SG] = await Promise.all([api.loadAll(), api.activity().catch(() => []), api.notes().catch(() => []), (api.forwarded ? api.forwarded() : Promise.resolve([])).catch(() => []), (api.suggestions ? api.suggestions() : Promise.resolve([])).catch(() => [])]);
    fwd = new Map((FW || []).map(r => [r.parent_id, r])); sugg = SG || [];
    notesBy = new Map(); for (const n of N || []) { if (!notesBy.has(n.task_id)) notesBy.set(n.task_id, []); notesBy.get(n.task_id).push(n); }
    tasks = d.tasks; people = d.people; cats = d.categories; profiles = d.profiles; templates = d.templates || []; activity = A || [];
    const p = profiles.find(x => x.id === me.id); if (p) me = { ...me, full_name: p.full_name, email: p.email || me.email, is_admin: !!p.is_admin, weekly_email: p.weekly_email !== false, has_weekly: "weekly_email" in p };
    const ids = new Set(tasks.map(t => t.id)); [...selected].forEach(id => { if (!ids.has(id)) selected.delete(id); });
    if (!sharedTasks().length) scope = "mine";
    else if (!reload.scoped && !tasks.some(mine)) scope = "shared";
    reload.scoped = true;
  } catch (e) { toast(errMsg(e)); }
  finally { loading = false; }
  const ae = document.activeElement, typing = ae && ae.matches && ae.matches("#page input:not(#q2):not([type=checkbox]), #page textarea");
  if (!typing) render(); else renderShell();
}
async function start() {
  if (!api) { render(); return; }
  if (lmode === "recover") { me = null; render(); return; }
  const u = await api.user().catch(() => null);
  if (u) { me = { id: u.id, email: u.email, full_name: "", is_admin: false }; await reload(); api.subscribe(() => { clearTimeout(start.t); start.t = setTimeout(reload, 500); }); }
  else render();
}

/* =========================================================== events */
$("#lform").addEventListener("submit", async e => {
  e.preventDefault(); $("#lerr").textContent = ""; $("#lok").textContent = ""; const b = $("#lbtn"), label = b.textContent; b.disabled = true; b.textContent = "Please wait...";
  const email = $("#lemail").value.trim().toLowerCase(), pw = $("#lpass").value;
  try {
    if (lmode === "forgot") {
      await api.resetPassword(email);
      $("#lok").textContent = `If an account exists for ${email}, a reset link is on its way. Open it on any device. Check Junk if it is not in your inbox within a few minutes.`;
      return;
    }
    if (lmode === "recover") {
      if (pw.length < 8) throw new Error("Use a password of at least 8 characters.");
      if (pw !== $("#lpass2").value) throw new Error("The two passwords differ.");
      await api.changePassword(pw);
      lmode = ""; $("#lpass").value = $("#lpass2").value = ""; await start(); toast("Password changed. You are signed in.");
      return;
    }
    if (signup) { if (pw.length < 8) throw new Error("Use a password of at least 8 characters."); const live = await api.signUp($("#lname").value.trim(), email, pw); if (!live) { $("#lerr").textContent = "Account created, but it needs confirming before you can sign in. Ask the person who runs this site."; return; } }
    else await api.signIn(email, pw);
    signup = false; await start();
  } catch (err) {
    const m = err.message || "";
    $("#lerr").textContent = /invalid login/i.test(m) ? "Wrong email or password." : /not authori[sz]ed/i.test(m) ? "This site cannot send reset emails to this address yet. Ask the person who runs it." : /rate limit|too many|security purposes/i.test(m) ? "Too many attempts. Wait a minute and try again." : /different from the old|same password/i.test(m) ? "Choose a password different from your current one." : /session|jwt|expired/i.test(m) && lmode === "recover" ? "This reset link has expired. Go back to sign in and request a new one." : /signups? not allowed|disabled/i.test(m) ? "New accounts are switched off on this site. Ask the person who runs it." : /already registered/i.test(m) ? "An account with this email already exists. Sign in instead." : errMsg(err);
  } finally { b.disabled = false; b.textContent = label; }
});
$("#lswitch").addEventListener("click", async () => {
  $("#lerr").textContent = ""; $("#lok").textContent = "";
  if (lmode === "recover") { try { await api.signOut(); } catch (e) {} }
  if (lmode) { lmode = ""; signup = false; } else signup = !signup;
  showLogin();
});
if (LINK_ERROR) setTimeout(() => { if ($("#lerr")) $("#lerr").textContent = LINK_ERROR; }, 0);
$("#lforgot").addEventListener("click", () => { lmode = "forgot"; signup = false; $("#lerr").textContent = ""; $("#lok").textContent = ""; showLogin(); $("#lemail").focus(); });
if (api && api.onRecovery) api.onRecovery(() => { if (lmode !== "recover") { lmode = "recover"; me = null; render(); } });

document.addEventListener("click", async e => {
  const T = e.target, cl0 = s => T.closest(s);
  if (!cl0("#pop") && !cl0('[data-act="bell"]') && $("#pop").innerHTML) $("#pop").innerHTML = "";
  if (!cl0("#pmenu") && $("#pmenu")) $("#pmenu").classList.remove("open");
  const pf = cl0("[data-pf]"); if (pf) { e.preventDefault(); $("#pop").innerHTML = ""; const v = pf.dataset.pf; F = { ...blankF(), flag: v, view: "open" }; location.hash = "tasks"; render(); return; }
  const pp = cl0("[data-pf-person]"); if (pp) { const p = +pp.dataset.pfPerson; scope = p === -1 ? "shared" : "mine"; F = { ...blankF(), person: p === -1 ? "" : String(p) }; location.hash = "tasks"; render(); return; }
  const o = cl0("[data-open]"); if (o) { e.preventDefault(); $("#pop").innerHTML = ""; openTask(o.dataset.open); return; }
  const sc = cl0("[data-scope]"); if (sc) { reload.scoped = true; scope = sc.dataset.scope; render(); return; }
  const vw = cl0("[data-view]"); if (vw) { F.view = vw.dataset.view; if (["closed7", "Done", "Dropped"].includes(F.flag) && F.view === "open") F.flag = ""; render(); return; }
  const vb = cl0("[data-val]"); if (vb) { quickValidate(vb.dataset.val); return; }
  const rs = cl0("[data-rset]"); if (rs) { const v = rs.dataset.rset, set = v === "none" ? [] : v === "all" ? RIGHTS.map(r => r[0]) : DEF_CAN; $$("[data-right]").forEach(x => x.checked = set.includes(x.dataset.right)); return; }
  const fr = cl0("[data-fxrm]"); if (fr) { fxSync(); FX.files.splice(+fr.dataset.fxrm, 1); if (SPL) { syncSplit(); drawSplit(); } else redrawFx(); return; }
  const sr = cl0("[data-sprm]"); if (sr && SPL) { syncSplit(); SPL.rows.splice(+sr.dataset.sprm, 1); drawSplit(); return; }
  const ly = cl0("[data-lay]"); if (ly) { const [k, v] = ly.dataset.lay.split(":"); LAY[k] = v; ls.set("tt-lay-" + k, v); render(); return; }
  const crow = cl0("[data-clrow]"); if (crow) { const id = +crow.dataset.clrow; openCl.has(id) ? openCl.delete(id) : openCl.add(id); render(); return; }
  const rca = cl0("[data-rclall]"); if (rca) { const t = tById(+rca.dataset.rclall); try { await api.updateTask(t.id, { checklist: allTicked(t) }); await reload(); toast(`All checklist items on #${t.no} ticked`); } catch (err) { toast(errMsg(err)); } return; }
  const ub = cl0("[data-upd]"); if (ub) { const id = +ub.dataset.upd; openUpd.has(id) ? openUpd.delete(id) : openUpd.add(id); render(); return; }
  const ep = cl0("[data-editp]"); if (ep) { fillPersonForm(people.find(p => String(p.id) === ep.dataset.editp)); return; }
  const ts = cl0("[data-teamsel]"); if (ts) { teamSel = ts.dataset.teamsel; render(); return; }
  const sa = cl0("[data-sgadd]"); if (sa) { const a = sugg.find(x => x.id === sa.dataset.sgadd); if (!a) return; sa.disabled = true; const row = { name: (a.full_name || a.email.split("@")[0]).trim(), email: a.email.toLowerCase(), shared: false }; if (teamSel) row.teams = [teamSel];
    api.addPerson(row).then(async () => { toast(`${row.name} added`); await reload(); if ($("#pop").innerHTML) $("#pop").innerHTML = bellPop(); }).catch(err => { sa.disabled = false; toast(/duplicate/i.test(err.message || "") ? "That name is already on your team" : errMsg(err)); }); return; }
  const sh2 = cl0("[data-sghide]"); if (sh2) { const h = dismissed(); h.add(sh2.dataset.sghide); try { localStorage.setItem(dismissKey(), JSON.stringify([...h])); } catch (e) {} renderShell(); if ($("#pop").innerHTML) $("#pop").innerHTML = bellPop(); toast("Moved to Colleagues on the Team page"); return; }
  const gc = cl0("[data-gocol]"); if (gc) { e.preventDefault(); $("#pop").innerHTML = ""; location.hash = "team"; render(); setTimeout(() => { const c = $("#colleagues"); if (c) c.scrollIntoView({ behavior: "smooth" }); }, 50); return; }
  const mp = cl0("[data-mailp]"); if (mp) { const pid = +mp.dataset.mailp; openMail(tasks.filter(t => mine(t) && t.person_id === pid && needsAction(t))); return; }
  const dc = cl0("[data-delcat]"); if (dc) { try { await api.deleteCategory(+dc.dataset.delcat); await reload(); } catch (err) { toast(errMsg(err)); } return; }
  const ut = cl0("[data-usetpl]"); if (ut) { const t = templates.find(x => String(x.id) === ut.dataset.usetpl); openTask(null, { title: t.title, category: t.category, priority: t.priority, recurrence: t.recurrence, checklist: t.checklist || [] }); return; }
  const dt = cl0("[data-deltpl]"); if (dt) { try { await api.deleteTemplate(+dt.dataset.deltpl); await reload(); toast("Template deleted"); } catch (err) { toast(errMsg(err)); } return; }
  const cm = cl0("[data-cal]"); if (cm) { const k = +cm.dataset.cal, b = calMonth || TODAY().slice(0, 7); if (!k) calMonth = null; else { const d = new Date(b + "-15T12:00:00"); d.setMonth(d.getMonth() + k); calMonth = iso(d).slice(0, 7); } render(); return; }
  const rp = cl0("[data-rep]"); if (rp) { repDays = +rp.dataset.rep; render(); return; }
  const srt = cl0(".thead [data-sort]"); if (srt) { const k = srt.dataset.sort; sort = sort.k === k ? { k, d: -sort.d } : { k, d: 1 }; render(); return; }
  const st = cl0(".pills [data-st]"); if (st && draft) { syncDraft(); const s = st.dataset.st; if (s === "Dropped" && editing.status !== "Dropped") { draft.status = s; drawPanel({ status: "Dropped" }); if (editing.id) { loadHistory(editing); if (mine(editing)) loadFiles(editing); } $("#e-new").focus(); return; } draft.status = s; $$(".pills [data-st]").forEach(b => b.classList.toggle("on", b.dataset.st === s)); return; }
  const dq = cl0("[data-due]"); if (dq) { const el = $("#e-due_date"); el.value = addDays(TODAY(), +dq.dataset.due); return; }
  const clx = cl0("[data-clx]"); if (clx) { e.preventDefault(); syncDraft(); draft.checklist.splice(+clx.dataset.clx, 1); redrawKeep(); return; }
  const fo = cl0("[data-fopen]"); if (fo) { const w = window.open("", "_blank"); try { const url = await api.fileUrl(editing.owner_id, editing.id, fo.dataset.fopen); if (w) w.location = url; else location.href = url; } catch (err) { if (w) w.close(); toast(errMsg(err)); } return; }
  const fd = cl0("[data-fdel]"); if (fd) { try { await api.removeFile(editing.owner_id, editing.id, fd.dataset.fdel); loadFiles(editing); toast("File deleted"); } catch (err) { toast(errMsg(err)); } return; }
  const a = cl0("[data-act]");
  if (a) {
    const act = a.dataset.act;
    const acts = {
      bell: () => toggleBell(a), sidemini: () => setMini(!$(".shell").classList.contains("mini")), new: () => openTask(null), kpi: () => { F = { ...blankF(), ...viewToday.k[+a.dataset.i][3] }; location.hash = "tasks"; render(); },
      ftog: () => { showF = !showF; render(); }, clear: () => { F = { ...blankF(), view: F.view }; sort = { k: "urgency", d: 1 }; showF = false; render(); },
      save: () => save(), validate: () => save({ validated: true }), done: () => { syncDraft(); draft.status = "Completed"; save(); },
      tickall: () => { syncDraft(); draft.checklist = draft.checklist.map(x => ({ ...x, done: true })); redrawKeep(); },
      cnfok: () => endReason(true),
      restore: () => restoreModal(), rstgo: () => rstGo(),
      mclose: () => closeModal(), delacct: () => deleteAccountModal(), delacctgo: () => { if (($("#del-confirm").value || "").trim() !== "DELETE") return toast("Type DELETE to confirm"); deleteAccountGo(); },
      bulkdel: () => bulkDelete(), bulkfwd: () => bulkForward(), bfgo: () => bulkForwardGo(),
      bulkdone: () => completeTasks(tasks.filter(t => selected.has(t.id))).then(r => { if (r) selected.clear(); render(); }),
      del: () => { $("#pmenu").classList.remove("open"); $("#cf").style.display = "flex"; }, delno: () => { $("#cf").style.display = "none"; },
      delyes: async () => { try { await api.deleteTask(editing.id); closePanel(); await reload(); toast("Deleted"); } catch (err) { toast(errMsg(err)); } },
      pmenu: () => $("#pmenu").classList.toggle("open"),
      mailone: () => openMail([editing]), mailsel: () => openMail(tasks.filter(t => selected.has(t.id))), mailgo: mailGo, mailcopy: mailCopy,
      selnone: () => { selected.clear(); render(); },
      bulkurgent: async () => { const L = tasks.filter(t => selected.has(t.id) && can(t, "priority")), on = !L.every(urgentT); if (!L.length) return toast("You may not change urgency on the selected tasks"); try { await api.updateMany(L.map(t => t.id), { priority: on ? "HIGH" : null }); await reload(); toast(`${L.length} tasks ${on ? "marked urgent" : "no longer urgent"}`); } catch (err) { toast(errMsg(err)); } },
      export: () => exportModal(false), exportsel: () => exportModal(true), xlgo: exportGo, xlreset: () => { ls.set("tt-xl", "null"); exportModal(!!$("#x-sel")); },
      exportrep: exportReport, backup, import: importModal, impgo: impGo,
      cladd: () => addChecklist(),
      dropask: async () => { const t = editing, r = await askReason(["status"], `#${t.no}`, "Why should this task be dropped? The owner sees this and decides."); if (!r) return; try { await api.updateTask(t.id, withReason({ drop_requested: true }, r)); closePanel(); await reload(); toast(`Drop requested for #${t.no}. The owner will confirm`); } catch (e) { toast(errMsg(e)); } },
      dropcancel: async () => { const t = editing; try { await api.updateTask(t.id, { drop_requested: false }); closePanel(); await reload(); toast("Drop request withdrawn"); } catch (e) { toast(errMsg(e)); } },
      dropok: async () => { const t = editing; try { await api.updateTask(t.id, { status: "Dropped", drop_requested: false }); closePanel(); await reload(); toast(`#${t.no} dropped. It is under the Closed tab`, () => api.updateTask(t.id, { status: t.status })); } catch (e) { toast(errMsg(e)); } },
      dropno: async () => { const t = editing, note = ($("#e-new")?.value || "").trim(); try { await api.updateTask(t.id, { drop_requested: false }); if (note) await api.addNote(t.id, note); closePanel(); await reload(); toast(`#${t.no} kept. The request is closed`); } catch (e) { toast(errMsg(e)); } },
      rsnok: () => { const v = ($("#rsn").value || "").trim(); if (!v) { toast("Write a reason first"); $("#rsn").focus(); return; } endReason(v); },
      rsnno: () => endReason(null),
      histall: () => { histAll = true; loadHistory(editing); },
      close: () => closePanel(),
      addsub: () => { const p = editing; syncDraft(); openTask(null, { parent_id: p.id, category: p.category, due_date: p.due_date, due_time: p.due_time, priority: p.priority }); },
      splitsub: () => splitModal(editing, "sub"),
      forward: () => { $("#pmenu") && $("#pmenu").classList.remove("open"); splitModal(editing, "fwd"); },
      spadd: () => { syncSplit(); const p = SPL.parent; SPL.rows.push({ title: "", person_id: "", due: p.due_date || "" }); if (SPL.mode === "fwd" && SPL.rows.length === 2 && SPL.rows[0].title === p.title) SPL.rows[0].title = ""; drawSplit(); },
      spgo: () => { syncSplit(); splitGo(); },
      dupcancel: () => { closeModal(); DUP = null; },
      dupnew: () => { closeModal(); DUP = null; draft._force = true; save(); },
      dupopen: () => { const e = DUP.e; closeModal(); DUP = null; closePanel(); openTask(e.id); },
      dupmerge: async () => { const { e, items } = DUP; try { const n = await applyMerge(e, items); closeModal(); DUP = null; closePanel(); await reload(); toast(n ? `#${e.no} updated with the new details` : `Nothing changed on #${e.no}`); } catch (err) { toast(errMsg(err)); } },
      savetplfrom: async () => { syncDraft(); const name = (draft.title || "Template").slice(0, 60); try { await api.addTemplate({ name: name + (templates.some(t => t.name === name) ? " " + Date.now() % 1000 : ""), title: draft.title, category: draft.category || null, priority: draft.priority || null, recurrence: draft.recurrence || null, checklist: draft.checklist.map(x => ({ text: x.text, done: false })) }); await reload(); toast("Saved as template"); } catch (err) { toast(errMsg(err)); } },
      dup: () => { syncDraft(); const d = { ...draft }; openTask(null, { title: d.title + " (copy)", category: d.category, priority: d.priority, person_id: d.person_id, due_date: d.due_date, due_time: d.due_time, recurrence: d.recurrence, checklist: d.checklist }); },
      savep: savePerson,
      ntopen: () => { newTeamOpen = true; render(); setTimeout(() => $("#nt-name") && $("#nt-name").focus(), 0); }, ntcancel: () => { newTeamOpen = false; render(); },
      ntsave: () => { const n = ($("#nt-name").value || "").trim().replace(/\s+/g, " "); if (!n) return toast("Type a team name"); if (allTeams().some(x => x.toLowerCase() === n.toLowerCase())) return toast("That team already exists"); setExtraTeams([...extraTeams(), n]); newTeamOpen = false; teamSel = n; render(); toast(`Team ${n} created. Add people to it.`); },
      ntdel: () => { $("#ntcf").style.display = "flex"; }, ntdelno: () => { $("#ntcf").style.display = "none"; },
      ntdelyes: async () => { const n = teamSel; try { for (const p of team().filter(p => pTeams(p).includes(n))) await api.updatePerson(p.id, { teams: pTeams(p).filter(x => x !== n) }); setExtraTeams(extraTeams().filter(x => x !== n)); teamSel = ""; await reload(); toast(`Team ${n} deleted`); } catch (err) { toast(errMsg(err)); } }, cancelp: () => fillPersonForm(null), delp: () => { $("#pcf").style.display = "flex"; }, delpno: () => { $("#pcf").style.display = "none"; },
      delpyes: async () => { try { await api.deletePerson(editP.id); editP = null; await reload(); toast("Removed"); } catch (err) { toast(errMsg(err)); } },
      savetpl: async () => { const name = $("#tp-name").value.trim(); if (!name) return toast("Give the template a name"); try { await api.addTemplate({ name, title: $("#tp-title").value.trim() || name, category: $("#tp-cat").value || null, priority: $("#tp-urg").checked ? "HIGH" : null, recurrence: $("#tp-rep").value || null, checklist: $("#tp-cl").value.split("\n").map(s => s.trim()).filter(Boolean).map(text => ({ text, done: false })) }); await reload(); toast("Template saved"); } catch (err) { toast(/duplicate/i.test(err.message || "") ? "A template with that name exists" : errMsg(err)); } },
      signout: async () => { await api.signOut(); reload.scoped = false; scope = "mine"; me = null; tasks = []; people = []; selected.clear(); history.replaceState(null, "", location.pathname); closePanel(); render(); },
      savename: async () => { const n = $("#a-name").value.trim(); if (!n) return toast("Name cannot be empty"); try { await api.updateName(me.id, n); await reload(); toast("Name saved"); } catch (err) { toast(errMsg(err)); } },
      savepw: async () => {
        const p0 = $("#a-p0").value, p1 = $("#a-p1").value, p2 = $("#a-p2").value, b = $('[data-act="savepw"]');
        if (!p0) { $("#a-p0").focus(); return toast("Enter your current password"); }
        if (p1.length < 8) return toast("Use at least 8 characters for the new password");
        if (p1 !== p2) return toast("The two new passwords differ");
        if (p1 === p0) return toast("The new password is the same as the current one");
        b.disabled = true;
        try {
          try { await api.verifyPassword(me.email, p0); }
          catch (err) { if (/invalid login|credentials/i.test(err.message || "")) { $("#a-p0").value = ""; $("#a-p0").focus(); return toast("Current password is wrong. Password not changed"); } throw err; }
          await api.changePassword(p1); $("#a-p0").value = $("#a-p1").value = $("#a-p2").value = ""; toast("Password changed");
        } catch (err) { toast(/rate limit|too many|security purposes/i.test(err.message || "") ? "Too many attempts. Wait a minute and try again" : errMsg(err)); }
        finally { b.disabled = false; }
      },
      addcat: async () => { const n = $("#a-cat").value.trim(); if (!n) return; try { await api.addCategory(n); await reload(); } catch (err) { toast(/duplicate/i.test(err.message || "") ? "Already in your list" : errMsg(err)); } }
    };
    if (acts[act]) { e.preventDefault(); return acts[act](); }
  }
  if (cl0("select,input,label,button,a,textarea")) return;
  const r = cl0(".trow[data-id]"); if (r) openTask(r.dataset.id);
});
function redrawFx() { const box = $("#mb .fx"); if (box) box.outerHTML = fxHtml(); }
function syncSplit() { fxSync(); if (!SPL) return; $$("#mb [data-sp]").forEach(el => { SPL.rows[+el.dataset.i][el.dataset.sp] = el.value; }); }
function redrawKeep() { const note = $("#e-new")?.value || ""; drawPanel(); $("#e-new").value = note; if (editing.id) { loadHistory(editing); if (mine(editing)) loadFiles(editing); } }
function addChecklist() { const i = $("#e-clnew"), v = i.value.trim(); if (!v) return; syncDraft(); draft.checklist.push({ text: v, done: false }); redrawKeep(); $("#e-clnew").focus(); }
document.addEventListener("change", async e => {
  const t = e.target;
  if (t.dataset.sel) { const id = +t.dataset.sel; t.checked ? selected.add(id) : selected.delete(id); render(); return; }
  if (t.dataset.selall) { const ids = filtered().map(x => x.id); ids.forEach(id => t.checked ? selected.add(id) : selected.delete(id)); render(); return; }
  if (t.dataset.qs) { const x = tById(+t.dataset.qs); if (!x) return; if (t.value === "Dropped" && x.status !== "Dropped") { t.value = x.status; openTask(x.id, { status: "Dropped" }); return; } quickStatus(x, t.value); return; }
  if (t.dataset.f !== undefined) { F[t.dataset.f] = t.value; if (["closed7", "Done", "Dropped"].includes(F.flag)) F.view = "closed"; else if (F.flag) F.view = "open"; render(); return; }
  if (t.dataset.t) { F[t.dataset.t] = t.checked; render(); return; }
  if (t.dataset.boardby !== undefined) { LAY.board = t.value; ls.set("tt-board", t.value); render(); return; }
  if (t.dataset.group !== undefined) { F.group = t.value; ls.set("tt-group", t.value); render(); return; }
  if (t.dataset.bulk) {
    const k = t.dataset.bulk, L = [...selected]; if (!L.length || t.value === "") return;
    if (k === "access" && !tasks.some(x => selected.has(x.id) && mine(x))) { t.value = ""; return toast("Access can be set only on tasks in your own tracker"); }
    if (k === "access") { L.splice(0, L.length, ...L.filter(id => mine(tById(id)))); const v = t.value, patch = v === "hide" ? { assignee_can_see: false } : v === "show" ? { assignee_can_see: true } : { assignee_can: v === "view" ? [] : v === "edit" ? RIGHTS.map(r => r[0]) : DEF_CAN }; const before = tasks.filter(x => selected.has(x.id)).map(x => ({ id: x.id, assignee_can_see: x.assignee_can_see, assignee_can: canArr(x) })); try { await api.updateMany(L, patch); await reload(); toast(`${L.length} tasks: ${t.selectedOptions[0].textContent.toLowerCase()}`, async () => { for (const b of before) await api.updateTask(b.id, { assignee_can_see: b.assignee_can_see, assignee_can: b.assignee_can }); }); } catch (err) { toast(errMsg(err)); render(); } return; }
    const v = k === "person_id" ? (+t.value || null) : t.value;
    if (k === "status" && v === "Completed") { t.value = ""; const r = await completeTasks(tasks.filter(x => selected.has(x.id))); if (r) selected.clear(); render(); return; }
    const right = { status: "status", due_date: "due", category: "category" }[k];
    const SELT = tasks.filter(x => selected.has(x.id)), T2 = SELT.filter(x => right ? can(x, right) : mine(x)), skip = SELT.length - T2.length;
    if (!T2.length) { t.value = ""; return toast(right ? "You may not make this change on the selected tasks" : "Only tasks in your own tracker can be changed this way"); }
    const before = T2.map(x => ({ id: x.id, [k]: x[k] }));
    let patch = { [k]: v }; const imp = T2.some(x => importantChanges(x, patch).length);
    if (imp) { const r = await askReason([k === "person_id" ? "assignee" : k === "due_date" ? "due date" : k], pl(T2.length, "task")); if (!r) { t.value = ""; return; } patch = withReason(patch, r); }
    try { await api.updateMany(T2.map(x => x.id), patch); await reload(); toast(`${pl(T2.length, "task")} updated${skip ? `, ${skip} skipped (not allowed)` : ""}`, async () => { for (const b of before) await api.updateTask(b.id, k === "status" ? { status: b.status } : withReason({ [k]: b[k] }, "Undo of a bulk change")); }); } catch (err) { toast(errMsg(err)); render(); }
    return;
  }
  if (t.dataset.rcl) { const [id, i] = t.dataset.rcl.split(":").map(Number), x = tById(id); if (!x) return; const ck = cl(x).map((y, j) => j === i ? { ...y, done: t.checked } : y); try { await api.updateTask(id, { checklist: ck }); await reload(); } catch (err) { toast(errMsg(err)); render(); } return; }
  if (t.dataset.clp !== undefined && draft) { syncDraft(); const it = draft.checklist[+t.dataset.clp]; it.person_id = t.value ? +t.value : null; if (it.person_id) it.person_name = pName(it.person_id); else { delete it.share; delete it.person_name; } redrawKeep(); return; }
  if (t.dataset.clsh !== undefined && draft) { const it = draft.checklist[+t.dataset.clsh]; if (t.checked) it.share = true; else delete it.share; return; }
  if (t.id === "e-person_id" && draft) { syncDraft(); redrawKeep(); return; }
  if (t.id === "e-can_see") { $$("[data-right]").forEach(x => x.disabled = !t.checked); const r = $(".rights"); if (r) r.style.opacity = t.checked ? "" : ".5"; return; }
  if (t.dataset.cli !== undefined && draft) { syncDraft(); draft.checklist[+t.dataset.cli].done = t.checked; t.closest(".cli").classList.toggle("done", t.checked); const c = draft.checklist, d = c.filter(x => x.done).length; const pr = $(".prog i"); if (pr) pr.style.width = d / c.length * 100 + "%"; const s = t.closest(".sec").querySelector("h3 .sub"); if (s) s.textContent = `${d} of ${c.length} done`; return; }
  if (t.id === "e-tpl") { const tp = templates.find(x => String(x.id) === t.value); if (tp) { syncDraft(); Object.assign(draft, { title: draft.title || tp.title, category: tp.category, priority: tp.priority, recurrence: tp.recurrence, checklist: (tp.checklist || []).map(x => ({ text: x.text, done: false })) }); drawPanel(); $("#e-tpl").value = t.value; } return; }
  if (t.id === "fx-files") { const add = [...t.files]; const big = add.find(f => f.size > 10485760); if (big) { t.value = ""; return toast(`${big.name} is over 10 MB`); } fxSync(); FX.files.push(...add); t.value = ""; if (SPL) { syncSplit(); drawSplit(); } else redrawFx(); return; }
  if (t.id === "e-files") { const files = [...t.files]; if (!files.length) return; const big = files.find(f => f.size > 10485760); if (big) return toast(`${big.name} is over 10 MB`); toast(`Uploading ${pl(files.length, "file")}...`); try { for (const f of files) await api.upload(editing.owner_id, editing.id, f); await loadFiles(editing); toast("Uploaded"); } catch (err) { toast(errMsg(err)); } return; }
  if (t.id === "imp-file" && t.files[0]) return impFile(t.files[0]);
  if (t.id === "rst-file" && t.files[0]) return rstFile(t.files[0]);
  if (t.id === "imp-sheet" || t.id === "imp-firstnew" || t.id === "imp-future") return impPreview();
  if (t.dataset.dif !== undefined && DUP) { DUP.items[+t.dataset.dif].on = t.checked; return; }
  if (t.closest && t.closest("#mb") && $("#x-count")) updateXCount();
});
document.addEventListener("input", e => {
  if (e.target.id === "del-confirm") { const b = $('[data-act="delacctgo"]'); if (b) b.disabled = e.target.value.trim() !== "DELETE"; return; }
  if (e.target.id === "q" || e.target.id === "q2") { F.q = e.target.value; if (e.target.id === "q") { if (view() !== "tasks") location.hash = "tasks"; } clearTimeout(document.qt); document.qt = setTimeout(render, 200); }
  if (e.target.closest && e.target.closest("#mb") && $("#x-count")) updateXCount();
});
document.addEventListener("keydown", e => {
  if (e.key === "Escape") { if (RSN) endReason(null); else if ($("#modal").classList.contains("open")) closeModal(); else closePanel(); $("#pop").innerHTML = ""; return; }
  if (e.target.id === "e-clnew" && e.key === "Enter") { e.preventDefault(); addChecklist(); return; }
  if (e.target.closest("input,textarea,select") || !me) return;
  if (e.key === "/") { e.preventDefault(); const q = window.innerWidth > 860 ? $("#q") : $("#q2"); if (q) q.focus(); }
  if (e.key.toLowerCase() === "n" && !e.ctrlKey && !e.metaKey) { e.preventDefault(); openTask(null); }
});
/* Board drag and drop (computer). On phones, open the card and change it there. */
let dragId = null;
document.addEventListener("dragstart", e => { const c = e.target.closest && e.target.closest(".bcard"); if (!c) return; dragId = +c.dataset.bid; e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", String(dragId)); c.classList.add("dragging"); });
document.addEventListener("dragend", e => { $$(".bcard.dragging").forEach(x => x.classList.remove("dragging")); $$(".bcol.over").forEach(x => x.classList.remove("over")); });
document.addEventListener("dragover", e => { const col = e.target.closest && e.target.closest(".bcol"); if (!col || dragId === null) return; e.preventDefault(); $$(".bcol.over").forEach(x => x !== col && x.classList.remove("over")); col.classList.add("over"); });
document.addEventListener("drop", e => { const col = e.target.closest && e.target.closest(".bcol"); if (!col || dragId === null) return; e.preventDefault(); const id = dragId; dragId = null; col.classList.remove("over"); boardDrop(id, col.dataset.col); });
/* Show or hide any password field. */
function addEyes() { $$('input[type="password"]:not([data-eye]), input[data-pw]:not([data-eye])').forEach(i => { i.dataset.eye = "1"; i.dataset.pw = "1"; const w = document.createElement("span"); w.className = "pw"; i.parentNode.insertBefore(w, i); w.appendChild(i); const b = document.createElement("button"); b.type = "button"; b.className = "pweye"; b.setAttribute("aria-label", "Show password"); b.title = "Show password"; b.innerHTML = ic("eye"); w.appendChild(b); b.onclick = () => { const show = i.type === "password"; i.type = show ? "text" : "password"; b.innerHTML = ic(show ? "eyeoff" : "eye"); b.title = show ? "Hide password" : "Show password"; b.setAttribute("aria-label", b.title); i.focus(); }; }); }
new MutationObserver(() => addEyes()).observe(document.body, { childList: true, subtree: true }); addEyes();
$("#px").onclick = closePanel;
$("#mx").addEventListener("click", e => { if (RSN) { e.stopImmediatePropagation(); endReason(null); } }, true); $("#shade").onclick = closePanel; $("#mx").onclick = closeModal;
$("#modal").addEventListener("click", e => { if (e.target.id === "modal") { if (RSN) endReason(null); else closeModal(); } });
$("#add").onclick = () => openTask(null); $("#fab").onclick = () => openTask(null);
document.addEventListener("visibilitychange", () => { if (!document.hidden) reload(); });
setInterval(() => { if (!document.hidden && !document.body.classList.contains("p-open") && !$("#modal").classList.contains("open")) reload(); }, 60000);
function paintMode() { const d = document.documentElement.dataset.mode === "dark"; $$(".mode").forEach(b => { b.innerHTML = ic(d ? "sun" : "moon"); b.setAttribute("aria-label", d ? "Switch to light mode" : "Switch to dark mode"); b.title = d ? "Light mode" : "Dark mode"; }); }
document.addEventListener("click", e => { const b = e.target.closest(".mode"); if (!b) return; const r = document.documentElement; if (r.dataset.mode === "dark") delete r.dataset.mode; else r.dataset.mode = "dark"; ls.set("tt-mode", r.dataset.mode || "light"); paintMode(); });
/* Sidebar width: drag the right edge (180 to 380 px), double-click it to reset, or collapse to icons. Remembered on this computer. */
const SW_MIN = 180, SW_MAX = 380, SW_DEF = 236;
function setSw(w) { w = Math.round(Math.min(SW_MAX, Math.max(SW_MIN, w))); document.documentElement.style.setProperty("--sw", w + "px"); return w; }
function setMini(on) { $(".shell").classList.toggle("mini", on); document.documentElement.style.setProperty("--sw", on ? "68px" : (+ls.get("tt-sw") || SW_DEF) + "px"); ls.set("tt-mini", on ? "1" : "0"); if (me) renderShell(); }
setSw(+ls.get("tt-sw") || SW_DEF); if (ls.get("tt-mini") === "1") setMini(true);
(() => {
  const g = $(".sgrip"); if (!g) return;
  g.addEventListener("pointerdown", e => {
    if ($(".shell").classList.contains("mini")) return;
    e.preventDefault(); g.setPointerCapture(e.pointerId); g.classList.add("drag"); document.body.classList.add("sdrag");
    const move = ev => setSw(ev.clientX), up = ev => { g.releasePointerCapture(e.pointerId); g.classList.remove("drag"); document.body.classList.remove("sdrag"); ls.set("tt-sw", String(setSw(ev.clientX))); g.removeEventListener("pointermove", move); g.removeEventListener("pointerup", up); };
    g.addEventListener("pointermove", move); g.addEventListener("pointerup", up);
  });
  g.addEventListener("dblclick", () => { ls.set("tt-sw", String(setSw(SW_DEF))); });
})();
/* If the host puts a badge over the bottom-right corner, make room so it never covers buttons. */
function badgeCheck() {
  const root = document.documentElement, x = window.innerWidth - 36, y = window.innerHeight - 30;
  const el = document.elementFromPoint(x, y);
  const foreign = !!el && el !== document.body && el !== root && !el.closest("#app,#login,#shade,#panel,#modal,#toast,#pop");
  if (foreign !== root.classList.contains("has-badge")) root.classList.toggle("has-badge", foreign);
}
[300, 1200, 2500, 5000, 9000, 15000].forEach(t => setTimeout(badgeCheck, t));
setInterval(badgeCheck, 8000); window.addEventListener("resize", () => setTimeout(badgeCheck, 200));
document.addEventListener("click", () => setTimeout(badgeCheck, 400));
window.addEventListener("hashchange", () => { closePanel(); $("#pop").innerHTML = ""; if (me) render(); window.scrollTo(0, 0); });
start();
}
