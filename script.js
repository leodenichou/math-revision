/* ==========================================================================
   Révisions Maths BTS SIO — logique du site
   Les exercices sont dans exercices.js (BANQUE et CHAPITRES).
   ========================================================================== */
{
const CH = CHAPITRES.map(c => c.nom);
const store = {
  get(k, d) { try { const v = localStorage.getItem("sio-" + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem("sio-" + k, JSON.stringify(v)); } catch (e) {} }
};
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const R = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = R(0, i); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const NIV = { 1: "Facile", 2: "Moyen", 3: "Type examen" };

/* ------------------------------------------------------------ navigation */
const VIEWS = ["accueil", "fiches", "exercices", "entrainement", "quiz", "annales"];
function route() {
  const h = location.hash.slice(1), v = VIEWS.includes(h) ? h : "accueil";
  VIEWS.forEach(x => document.getElementById("v-" + x).classList.toggle("on", x === v));
  document.querySelectorAll("nav.tabs .navlinks a").forEach(a => {
    if (a.getAttribute("href") === "#" + v) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
  });
  if (v === "entrainement" && !cur) gen();
  if (v === "exercices" && !exList.children.length) draw();
}
window.addEventListener("hashchange", () => { route(); window.scrollTo(0, 0); });

/* ------------------------------------------------------------ progression */
let prog = store.get("prog5", {});
const STEPS = [["f", "Fiche lue"], ["e", "Une série d'exos faite"], ["q", "Quiz réussi (≥ 6/8)"]];
function drawCards() {
  document.getElementById("chapCards").innerHTML = CHAPITRES.map((c, i) => {
    const b = BANQUE[c.cle];
    return `<div class="card ch-card"><h3>${i + 1}. ${c.nom}</h3><p>${c.desc}</p>
      <p class="count">${b.ecrits.length} exercices rédigés · ${b.generes.length} modèles à nombres aléatoires</p>
      ${STEPS.map(([k, l]) => `<label><input type="checkbox" data-k="${k}${i}" ${prog[k + i] ? "checked" : ""}> ${l}</label>`).join("")}
      <div class="row" style="margin-top:12px;gap:8px"><button class="chip" type="button" data-go="f${i}">Fiche</button><button class="chip" type="button" data-go="e${i}">Exercices</button><button class="chip" type="button" data-go="q${i}">Quiz</button></div></div>`;
  }).join("");
  const n = Object.values(prog).filter(Boolean).length, tot = CH.length * 3;
  document.getElementById("progTxt").textContent = `${n} / ${tot} étapes`;
  document.getElementById("progBar").style.width = (100 * n / tot) + "%";
}
const setProg = (k, v) => { prog[k] = v; store.set("prog5", prog); drawCards(); };
document.getElementById("chapCards").addEventListener("change", e => { const k = e.target.dataset.k; if (k) setProg(k, e.target.checked); });
document.getElementById("chapCards").addEventListener("click", e => {
  const g = e.target.dataset.go; if (!g) return; const i = +g.slice(1);
  if (g[0] === "f") { showFiche(i); location.hash = "fiches"; }
  else if (g[0] === "e") { exCh = i; location.hash = "exercices"; draw(); }
  else { location.hash = "quiz"; startQuiz(i); }
});
document.getElementById("resetProg").addEventListener("click", () => { prog = {}; store.set("prog5", prog); drawCards(); });

/* ------------------------------------------------------------ fiches */
const fNav = document.getElementById("ficheNav");
fNav.innerHTML = CH.map((c, i) => `<button class="chip" type="button" data-i="${i}">${i + 1}. ${c}</button>`).join("");
function showFiche(i) {
  document.querySelectorAll(".fiche").forEach(f => f.classList.toggle("on", +f.dataset.ch === i));
  fNav.querySelectorAll(".chip").forEach(b => b.setAttribute("aria-pressed", +b.dataset.i === i));
  store.set("fiche", i);
}
fNav.addEventListener("click", e => { const b = e.target.closest(".chip"); if (b) { showFiche(+b.dataset.i); window.scrollTo({ top: 0 }); } });

/* ------------------------------------------------------------ exercices au hasard */
const exNav = document.getElementById("exNav"), lvlNav = document.getElementById("lvlNav"), exList = document.getElementById("exList"), exInfo = document.getElementById("exInfo");
let exCh = store.get("exCh", 0), exLvl = "all";
exNav.innerHTML = CH.map((c, i) => `<button class="chip" type="button" data-i="${i}">${c}</button>`).join("");
lvlNav.innerHTML = [["all", "Tous niveaux"], ["1", "Facile"], ["2", "Moyen"], ["3", "Type examen"]].map(([v, l]) => `<button class="chip small" type="button" data-l="${v}">${l}</button>`).join("");

function draw() {
  const c = CHAPITRES[exCh], b = BANQUE[c.cle], n = +document.getElementById("exCount").value;
  store.set("exCh", exCh);
  exNav.querySelectorAll(".chip").forEach(x => x.setAttribute("aria-pressed", +x.dataset.i === exCh));
  lvlNav.querySelectorAll(".chip").forEach(x => x.setAttribute("aria-pressed", x.dataset.l === exLvl));
  const okLvl = e => exLvl === "all" || e.niv === +exLvl;
  const ecrits = b.ecrits.filter(okLvl), generes = b.generes.filter(okLvl);
  let seen = store.get("seen-" + c.cle, []), reset = false;
  let unseen = ecrits.filter(e => !seen.includes(e.id));
  const wantE = generes.length ? Math.min(Math.ceil(n * 0.6), ecrits.length) : Math.min(n, ecrits.length);
  if (unseen.length < wantE) { seen = seen.filter(id => !ecrits.some(e => e.id === id)); unseen = ecrits.slice(); reset = true; }
  const chosenE = shuffle(unseen).slice(0, wantE);
  const series = chosenE.map(e => ({ ...e, alea: false }));
  let gens = shuffle(generes);
  while (series.length < n && gens.length) {
    const g = gens[(series.length - chosenE.length) % gens.length];
    const inst = g.gen();
    series.push({ id: g.id, niv: g.niv, titre: g.titre, q: inst.q, c: inst.c, alea: true });
    if (series.length - chosenE.length >= gens.length * 2) break;
  }
  while (series.length < n && ecrits.length > series.filter(s => !s.alea).length) {           // pas assez de modèles : on complète
    const rest = ecrits.filter(e => !series.some(s => s.id === e.id)); if (!rest.length) break;
    series.push({ ...rest[R(0, rest.length - 1)], alea: false });
  }
  series.sort((x, y) => x.niv - y.niv);
  store.set("seen-" + c.cle, [...new Set([...seen, ...chosenE.map(e => e.id)])]);
  const vus = store.get("seen-" + c.cle, []).length;
  exInfo.innerHTML = `${c.nom} : ${b.ecrits.length} exercices rédigés et ${b.generes.length} modèles à nombres aléatoires. Tu as déjà vu ${vus} exercice${vus > 1 ? "s" : ""} rédigé${vus > 1 ? "s" : ""} sur ${b.ecrits.length}.` + (reset ? " <b>Tu as fait le tour de ce niveau : on recommence le tirage.</b>" : "");
  exList.innerHTML = series.length ? series.map((s, k) => `
    <article class="card exo">
      <div class="exo-head"><h3>Exercice ${k + 1} · ${s.titre}</h3><div class="badges"><span class="lvl l${s.niv}">${NIV[s.niv]}</span>${s.alea ? `<span class="lvl alea">Nombres aléatoires</span>` : ""}</div></div>
      <div class="q">${s.q}</div>
      <details class="corr"><summary>Voir la correction</summary><div class="sol">${s.c}</div></details>
    </article>`).join("") + `<div class="row center" style="margin-top:24px"><button class="btn ghost" type="button" id="exDone">J'ai fini cette série ✔</button><button class="btn" type="button" id="exAgain">Nouvelle série</button></div>`
    : `<div class="card"><p>Aucun exercice de ce niveau dans ce chapitre pour l'instant.</p></div>`;
  const d = document.getElementById("exDone");
  if (d) { d.onclick = () => { setProg("e" + exCh, true); d.textContent = "Noté dans ta progression ✔"; }; document.getElementById("exAgain").onclick = () => { draw(); window.scrollTo({ top: 0, behavior: "smooth" }); }; }
}
exNav.addEventListener("click", e => { const b = e.target.closest(".chip"); if (b) { exCh = +b.dataset.i; draw(); } });
lvlNav.addEventListener("click", e => { const b = e.target.closest(".chip"); if (b) { exLvl = b.dataset.l; draw(); } });
document.getElementById("exDraw").addEventListener("click", draw);
document.getElementById("exCount").addEventListener("change", draw);

/* ------------------------------------------------------------ entraînement express */
const ov = x => `<span class="ov">${x}</span>`;
const BOOL = [
  [`a·b + ${ov("a")}·c`, (a, b, c) => (a && b) || (!a && c)],
  [`(a + ${ov("b")})·c`, (a, b, c) => (a || !b) && c],
  [`${ov("a·b")} + c`, (a, b, c) => !(a && b) || c],
  [`a·${ov("c")} + ${ov("b")}`, (a, b, c) => (a && !c) || !b],
  [`${ov("a + b")}·c + a·b`, (a, b, c) => (!(a || b) && c) || (a && b)],
  [`(a + b)·(${ov("a")} + c)`, (a, b, c) => (a || b) && (!a || c)],
  [`a ⊕ b + c`, (a, b, c) => (a !== b) || c],
];
const GEN = {
  d2b() { const n = R(5, 255); return { q: `${n} en binaire`, a: n.toString(2), norm: "bin", h: `${n} = ${n.toString(2)}₂ (divisions par 2 ou puissances de 2)` }; },
  b2d() { const n = R(5, 255); return { q: `${n.toString(2)}₂ en décimal`, a: String(n), h: `Somme des puissances de 2 = ${n}` }; },
  d2h() { const n = R(16, 4095); return { q: `${n} en hexadécimal`, a: n.toString(16).toUpperCase(), norm: "hex", h: `${n} = ${n.toString(16).toUpperCase()}₁₆ (divisions successives par 16)` }; },
  h2d() { const n = R(16, 4095); return { q: `0x${n.toString(16).toUpperCase()} en décimal`, a: String(n), h: `Chiffres × puissances de 16 = ${n}` }; },
  b2h() { const n = R(16, 255), b = n.toString(2).padStart(8, "0"); return { q: `${b.slice(0, 4)} ${b.slice(4)}₂ en hexadécimal`, a: n.toString(16).toUpperCase(), norm: "hex", h: `${b.slice(0, 4)} → ${parseInt(b.slice(0, 4), 2).toString(16).toUpperCase()}, ${b.slice(4)} → ${parseInt(b.slice(4), 2).toString(16).toUpperCase()}` }; },
  o2d() { const n = R(8, 511); return { q: `${n.toString(8)}₈ en décimal`, a: String(n), h: `Chiffres × puissances de 8 = ${n}` }; },
  c2() { const n = R(1, 127), c = (256 - n).toString(2); return { q: `−${n} en complément à 2 sur 8 bits`, a: c, h: `${n} = ${n.toString(2).padStart(8, "0")} → on inverse → ${(255 - n).toString(2).padStart(8, "0")} → +1 = ${c}` }; },
  bool() { const [e, f] = BOOL[R(0, BOOL.length - 1)], a = R(0, 1), b = R(0, 1), c = R(0, 1); return { q: `F = ${e} avec a = ${a}, b = ${b}, c = ${c}`, html: true, a: String(+f(a, b, c)), h: `Calcule d'abord les compléments, puis les produits, puis les sommes : F = ${+f(a, b, c)}` }; },
};
let cur = null, done = false, score = 0, tot = 0, streak = 0;
const gq = document.getElementById("genQ"), ga = document.getElementById("genA"), gf = document.getElementById("genFb");
function gen() {
  const t = document.getElementById("genType").value, keys = Object.keys(GEN), k = t === "mix" ? keys[R(0, keys.length - 1)] : t;
  cur = GEN[k](); done = false;
  if (cur.html) gq.innerHTML = cur.q; else gq.textContent = cur.q;
  ga.value = ""; gf.className = "fb"; gf.innerHTML = "";
}
function norm(s, m) {
  s = s.trim().toUpperCase().replace(/\s+/g, "");
  if (m === "hex") s = s.replace(/^0X/, "").replace(/^0+(?=.)/, "");
  if (m === "bin") s = s.replace(/^0B/, "").replace(/^0+(?=.)/, "");
  return s;
}
document.getElementById("genForm").addEventListener("submit", e => {
  e.preventDefault(); if (!cur || !ga.value.trim()) return;
  if (done) { gen(); ga.focus(); return; }
  const ok = norm(ga.value, cur.norm) === norm(cur.a, cur.norm); done = true; tot++;
  if (ok) { score++; streak++; } else streak = 0;
  gf.className = "fb " + (ok ? "ok" : "ko");
  gf.innerHTML = (ok ? "<b>Bravo !</b>" : "<b>Pas tout à fait.</b> La réponse était " + esc(cur.a) + ".") + "<span>" + esc(cur.h) + "</span>";
  document.getElementById("genScore").textContent = score + "/" + tot;
  document.getElementById("genStreak").textContent = streak;
});
document.getElementById("genNext").addEventListener("click", () => { gen(); ga.focus(); });
document.getElementById("genType").addEventListener("change", gen);

/* ------------------------------------------------------------ quiz */
// [question, [bonne réponse, mauvaises…], explication]
const QZ = [
[ ["1010₂ vaut en décimal :", ["10", "8", "12", "5"], "8 + 2 = 10."],
  ["255 en hexadécimal :", ["FF", "EF", "F0", "1FF"], "15 × 16 + 15 = 255."],
  ["Combien de valeurs différentes peut-on coder sur 8 bits ?", ["256", "255", "128", "512"], "2⁸ = 256 valeurs, de 0 à 255."],
  ["0x1F vaut :", ["31", "25", "15", "32"], "1 × 16 + 15 = 31."],
  ["192 en binaire :", ["11000000", "10100000", "11100000", "10000001"], "128 + 64 = 192."],
  ["157₈ vaut en décimal :", ["111", "157", "95", "127"], "1 × 64 + 5 × 8 + 7 = 111."],
  ["En complément à 2 sur 8 bits, −1 s'écrit :", ["11111111", "10000001", "00000001", "11111110"], "On inverse 00000001, ce qui donne 11111110, puis on ajoute 1."],
  ["Combien de bits compte une adresse IPv4 ?", ["32", "8", "48", "128"], "4 octets × 8 bits. Une adresse MAC en fait 48 et une IPv6 128."] ],
[ ["p ⇒ q est fausse quand :", ["p vraie et q fausse", "p fausse et q vraie", "p et q fausses", "p et q vraies"], "C'est le seul cas où l'implication est fausse."],
  ["¬(p ∨ q) est équivalent à :", ["¬p ∧ ¬q", "¬p ∨ ¬q", "p ∧ q", "¬p ∨ q"], "C'est une loi de De Morgan."],
  ["La contraposée de p ⇒ q est :", ["¬q ⇒ ¬p", "q ⇒ p", "¬p ⇒ ¬q", "p ∧ ¬q"], "La contraposée est équivalente à l'implication de départ."],
  ["La négation de ∀x, P(x) est :", ["∃x, ¬P(x)", "∀x, ¬P(x)", "∃x, P(x)", "¬∃x, P(x)"], "On remplace ∀ par ∃ et on nie la propriété."],
  ["« x > 3 » est :", ["un prédicat", "une proposition vraie", "une proposition fausse", "une implication"], "Sa valeur de vérité dépend de x."],
  ["card(A ∪ B) =", ["card A + card B − card(A ∩ B)", "card A + card B", "card A × card B", "card A − card B"], "Sinon, on compte deux fois les éléments communs."],
  ["Si card E = 4, combien E a-t-il de parties ?", ["16", "8", "4", "24"], "2⁴ = 16."],
  ["La négation de p ⇒ q est :", ["p ∧ ¬q", "¬p ⇒ ¬q", "¬p ∧ q", "q ⇒ p"], "p ⇒ q ≡ ¬p ∨ q, et sa négation vaut p ∧ ¬q (De Morgan)."] ],
[ ["a + a·b =", ["a", "b", "a·b", "1"], "C'est la loi d'absorption."],
  ["a · ā =", ["0", "1", "a", "ā"], "Une variable et son complément ne valent jamais 1 en même temps."],
  ["Le complément de a·b est :", ["ā + b̄", "ā · b̄", "a + b", "ā · b"], "Loi de De Morgan."],
  ["a + ā·b =", ["a + b", "a·b", "b", "a"], "a + ā·b = (a + ā)(a + b) = a + b."],
  ["Dans un tableau de Karnaugh, un regroupement contient :", ["1, 2, 4, 8 ou 16 cases", "un nombre quelconque de cases", "3 cases au minimum", "uniquement 2 cases"], "La taille d'un bloc est toujours une puissance de 2."],
  ["Un tableau de Karnaugh à 4 variables a :", ["16 cases", "8 cases", "4 cases", "32 cases"], "2⁴ = 16 combinaisons."],
  ["a ⊕ b vaut 1 quand :", ["a et b sont différents", "a et b valent 1", "a et b sont égaux", "a ou b vaut 1"], "C'est le OU exclusif."],
  ["a + 1 =", ["1", "a", "0", "ā"], "1 est absorbant pour le OU."] ],
[ ["(2 × 3) × (3 × 4) donne une matrice :", ["2 × 4", "3 × 3", "4 × 2", "impossible"], "On garde les dimensions extérieures."],
  ["Le produit matriciel est-il commutatif ?", ["Non, pas en général", "Oui, toujours", "Oui, pour les matrices carrées", "Seulement en booléen"], "En général, A × B ≠ B × A."],
  ["det (2 3 ; 1 4) =", ["5", "11", "−5", "8"], "2 × 4 − 3 × 1 = 5."],
  ["Une matrice 2 × 2 est inversible si et seulement si :", ["son déterminant est non nul", "ses coefficients sont positifs", "elle est symétrique", "elle contient un 1"], "A⁻¹ = (1/det A) × (d −b ; −c a)."],
  ["Le coefficient (i, j) de M² (M = matrice d'adjacence) donne :", ["le nombre de chemins de longueur 2 de i à j", "la distance de i à j", "le nombre d'arcs du graphe", "le niveau de j"], "Plus généralement, Mᵏ compte les chemins de longueur k."],
  ["En calcul booléen, 1 + 1 =", ["1", "2", "0", "10"], "Le + correspond au OU logique."],
  ["Peut-on additionner une matrice 2 × 2 et une matrice 2 × 3 ?", ["Non", "Oui", "Oui, si les coefficients sont entiers", "Seulement en booléen"], "On n'additionne que des matrices de même taille."],
  ["I × A =", ["A", "I", "0", "A²"], "I est l'élément neutre du produit."] ],
[ ["Le chemin critique est formé des tâches :", ["de marge totale nulle", "les plus longues", "sans prédécesseur", "de marge libre maximale"], "Le moindre retard sur l'une d'elles retarde tout le projet."],
  ["Le niveau 0 d'un graphe contient les sommets :", ["sans prédécesseur", "sans successeur", "qui ont une boucle", "du chemin critique"], "On les retire ensuite pour trouver le niveau 1."],
  ["La date au plus tôt d'une tâche est :", ["le max des (t prédécesseur + durée prédécesseur)", "le min des (t prédécesseur + durée)", "la somme de toutes les durées", "T − marge libre"], "Une tâche doit attendre la fin de toutes ses tâches antérieures."],
  ["L'algorithme de Roy-Warshall sert à calculer :", ["la fermeture transitive", "le chemin critique", "les niveaux", "le plus court chemin"], "Il ajoute un arc dès qu'il existe un chemin."],
  ["Un circuit est :", ["un chemin dont l'origine est aussi l'extrémité", "un arc d'un sommet vers lui-même", "un graphe sans arc", "un chemin de longueur 2"], "Un arc d'un sommet vers lui-même s'appelle une boucle."],
  ["On peut calculer les niveaux d'un graphe seulement s'il :", ["n'a pas de circuit", "a une boucle", "a moins de 10 sommets", "est symétrique"], "Avec un circuit, il manque toujours un sommet sans prédécesseur."],
  ["d⁺(x), le demi-degré extérieur, est :", ["le nombre de successeurs de x", "le nombre de prédécesseurs de x", "le niveau de x", "la longueur du plus long chemin"], "La somme des d⁺ est égale au nombre d'arcs."],
  ["Une tâche de marge totale 3 prend 2 jours de retard. Le projet :", ["n'est pas retardé", "est retardé de 2 jours", "est retardé de 1 jour", "est retardé de 5 jours"], "Le retard est absorbé par la marge."] ],
];
const qNav = document.getElementById("quizNav"), qBox = document.getElementById("quizBox");
let best = store.get("best5", {});
function drawQNav() { qNav.innerHTML = CH.map((c, i) => `<button class="chip" type="button" data-i="${i}">${c}${best[i] != null ? " · " + best[i] + "/8" : ""}</button>`).join("") + `<button class="chip" type="button" data-i="mix">Mélange 10 questions</button>`; }
let qs = [], qi = 0, qok = 0, qch = null;
function startQuiz(i) {
  qch = i; qs = i === "mix" ? shuffle(QZ.flat()).slice(0, 10) : shuffle(QZ[i]); qi = 0; qok = 0;
  qNav.querySelectorAll(".chip").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.i) === String(i))); showQ();
}
function showQ() {
  if (qi >= qs.length) return endQ();
  const [q, opts, ex] = qs[qi], o = shuffle(opts.map((t, k) => ({ t, good: k === 0 })));
  qBox.innerHTML = `<div class="qhead"><span>${qch === "mix" ? "Mélange" : esc(CH[qch])}</span><span>Question ${qi + 1} / ${qs.length} · ${qok} bonne(s)</span></div><div class="prog"><i style="width:${100 * qi / qs.length}%"></i></div><h3>${esc(q)}</h3><div class="opts">${o.map((x, k) => `<button class="opt" type="button" data-k="${k}">${esc(x.t)}</button>`).join("")}</div><div class="fb" id="qFb"></div>`;
  qBox.querySelectorAll(".opt").forEach(b => b.onclick = () => {
    const k = +b.dataset.k, good = o[k].good; if (good) qok++;
    qBox.querySelectorAll(".opt").forEach((bb, j) => { bb.disabled = true; if (o[j].good) bb.classList.add("good"); else if (j === k) bb.classList.add("bad"); });
    const fb = document.getElementById("qFb"); fb.className = "fb " + (good ? "ok" : "ko");
    fb.innerHTML = `<b>${good ? "Bonne réponse !" : "Raté."}</b><span>${esc(ex)}</span><button class="btn" type="button" id="qNext" style="margin-top:10px">${qi + 1 < qs.length ? "Question suivante" : "Voir mon score"}</button>`;
    const nx = document.getElementById("qNext"); nx.onclick = () => { qi++; showQ(); }; nx.focus();
  });
}
function endQ() {
  const pct = Math.round(100 * qok / qs.length);
  if (qch !== "mix") {
    best[qch] = Math.max(best[qch] || 0, qok); store.set("best5", best);
    if (qok >= 6) setProg("q" + qch, true);
    drawQNav(); qNav.querySelectorAll(".chip").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.i) === String(qch)));
  }
  qBox.innerHTML = `<div class="stat">${qok} / ${qs.length}</div><p>${pct >= 75 ? "Excellent, ce chapitre est maîtrisé." : pct >= 50 ? "Pas mal ! Relis la fiche pour combler les trous." : "Relis la fiche, puis refais le quiz."}</p><div class="row"><button class="btn" type="button" id="qAgain">Recommencer</button>${qch !== "mix" ? `<button class="btn ghost" type="button" id="qEx">S'entraîner sur ce chapitre</button>` : ""}</div>`;
  document.getElementById("qAgain").onclick = () => startQuiz(qch);
  const f = document.getElementById("qEx"); if (f) f.onclick = () => { exCh = qch; location.hash = "exercices"; draw(); };
}
qNav.addEventListener("click", e => { const b = e.target.closest(".chip"); if (b) startQuiz(b.dataset.i === "mix" ? "mix" : +b.dataset.i); });

/* ------------------------------------------------------------ démarrage */
drawCards(); drawQNav(); showFiche(Math.min(store.get("fiche", 0), CH.length - 1)); route();
}
