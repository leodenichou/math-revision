/* ==========================================================================
   BASE D'EXERCICES — Maths pour l'informatique, BTS SIO (épreuve E3)
   --------------------------------------------------------------------------
   Chaque chapitre contient :
     - "ecrits"     : des exercices fixes   { id, niv, titre, q, c }
     - "generes"    : des modèles aléatoires { id, niv, titre, gen() -> {q, c} }
   niv : 1 = facile, 2 = moyen, 3 = type examen
   q = énoncé (HTML), c = correction (HTML).
   Pour ajouter un exercice : copie un bloc { ... } et change l'id.
   ========================================================================== */

const BANQUE = (() => {

/* ---------------------------------------------------------------- outils */
const R = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = a => a[R(0, a.length - 1)];
const shuf = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = R(0, i); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const ov = x => `<span class="ov">${x}</span>`;
const sub = (x, b) => `${x}<sub>${b}</sub>`;
const M = m => `<table class="mat"><tbody>${m.map(r => `<tr>${r.map(v => `<td>${v}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
const T = (head, rows) => `<div class="scroll"><table><thead><tr>${head.map(h => `<th>${h}</th>`).join("")}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(v => `<td>${v}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
const mul = (A, B) => A.map(r => B[0].map((_, j) => r.reduce((s, v, k) => s + v * B[k][j], 0)));
const bmul = (A, B) => A.map(r => B[0].map((_, j) => r.some((v, k) => v && B[k][j]) ? 1 : 0));
const VF = b => b ? "V" : "F";
const bits = (n, w) => n.toString(2).padStart(w, "0");
const grp4 = s => s.replace(/\B(?=(\d{4})+(?!\d))/g, " ");
const LET = "ABCDEFGHIJ";

/* ---------------------------------------------------------- algèbre de Boole */
const GRAY2 = ["00", "01", "11", "10"];
function cover(c) { let r = [0]; for (const ch of c) r = ch === "-" ? r.flatMap(v => [v * 2, v * 2 + 1]) : r.map(v => v * 2 + +ch); return r; }
function minimise(n, ones) {
  const cubes = [];
  for (let i = 0; i < 3 ** n; i++) { let s = "", x = i; for (let k = 0; k < n; k++) { s = "01-"[x % 3] + s; x = Math.floor(x / 3); } cubes.push(s); }
  const imps = cubes.filter(c => cover(c).every(m => ones.has(m)));
  const inside = (a, b) => [...a].every((ch, i) => b[i] === "-" || b[i] === ch);
  const primes = imps.filter(c => !imps.some(d => d !== c && inside(c, d)));
  let best = null;
  for (let mask = 1; mask < (1 << primes.length); mask++) {
    const sel = primes.filter((_, i) => mask >> i & 1);
    const cov = new Set(sel.flatMap(cover));
    if (![...ones].every(m => cov.has(m))) continue;
    const cost = [sel.length, sel.join("").replace(/-/g, "").length];
    if (!best || cost[0] < best.cost[0] || (cost[0] === best.cost[0] && cost[1] < best.cost[1])) best = { sel, cost };
  }
  return best.sel;
}
const terme = (c, vars) => { const t = [...c].map((ch, i) => ch === "-" ? "" : ch === "1" ? vars[i] : ov(vars[i])).filter(Boolean); return t.length ? t.join("·") : "1"; };
function kmap(n, ones) {
  if (n === 3) {
    const rows = [0, 1].map(a => [`<b>${a}</b>`, ...GRAY2.map(bc => ones.has(a * 4 + parseInt(bc, 2)) ? "<b>1</b>" : "0")]);
    return T(["a \\ bc", ...GRAY2], rows);
  }
  const rows = GRAY2.map(ab => [`<b>${ab}</b>`, ...GRAY2.map(cd => ones.has(parseInt(ab + cd, 2)) ? "<b>1</b>" : "0")]);
  return T(["ab \\ cd", ...GRAY2], rows);
}
function kmapExo(n, ones) {
  const vars = "abcd".slice(0, n);
  const list = [...ones].sort((x, y) => x - y).map(m => bits(m, n)).join(", ");
  const sel = minimise(n, ones);
  const q = `Une fonction booléenne F(${[...vars].join(", ")}) vaut 1 uniquement pour les combinaisons ${[...vars].join("")} suivantes : <b>${list}</b>.<br>Remplir le tableau de Karnaugh de F et en déduire une expression simplifiée.`;
  const c = `${kmap(n, ones)}<p>Regroupements (les plus grands possibles, par 1, 2, 4 ou 8 cases) :</p><ul>${sel.map(s => `<li>cases ${cover(s).map(m => bits(m, n)).join(", ")} → <b>${terme(s, vars)}</b></li>`).join("")}</ul><p>Donc <b>F = ${sel.map(s => terme(s, vars)).join(" + ")}</b>.</p>`;
  return { q, c };
}

/* ------------------------------------------------------------------ graphes */
function randGraph(n, p, loops = false) {
  const A = Array.from({ length: n }, () => Array(n).fill(0));
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if ((i !== j || loops) && Math.random() < p) A[i][j] = 1;
  for (let i = 0; i < n; i++) if (!A[i].some(Boolean) && !A.some(r => r[i])) A[i][(i + 1) % n] = 1;
  return A;
}
const succ = (A, i) => A[i].map((v, j) => v ? j : -1).filter(j => j >= 0);
const pred = (A, j) => A.map((r, i) => r[j] ? i : -1).filter(i => i >= 0);
const setTxt = (arr, lab = LET) => arr.length ? arr.map(i => lab[i]).join(", ") : "—";
function warshall(A) { const n = A.length, C = A.map(r => r.slice()); for (let k = 0; k < n; k++) for (let i = 0; i < n; i++) if (C[i][k]) for (let j = 0; j < n; j++) if (C[k][j]) C[i][j] = 1; return C; }
function randDAG(n) {
  const A = Array.from({ length: n }, () => Array(n).fill(0));
  for (let j = 1; j < n; j++) { const k = R(1, Math.min(2, j)); shuf([...Array(j).keys()]).slice(0, k).forEach(i => A[i][j] = 1); }
  const perm = shuf([...Array(n).keys()]);           // on mélange les noms des sommets
  const B = Array.from({ length: n }, () => Array(n).fill(0));
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (A[i][j]) B[perm[i]][perm[j]] = 1;
  return B;
}
function niveaux(A) {
  const n = A.length, done = new Set(), lv = [];
  while (done.size < n) {
    const cur = [...Array(n).keys()].filter(j => !done.has(j) && pred(A, j).every(i => done.has(i)));
    if (!cur.length) return null;
    cur.forEach(j => done.add(j)); lv.push(cur);
  }
  return lv;
}
function mpm(d, P) { // d : durées, P : listes de prédécesseurs (indices)
  const n = d.length, t = Array(n).fill(0), order = niveaux(P.reduce((A, ps, j) => { ps.forEach(i => A[i][j] = 1); return A; }, Array.from({ length: n }, () => Array(n).fill(0)))).flat();
  order.forEach(j => t[j] = P[j].length ? Math.max(...P[j].map(i => t[i] + d[i])) : 0);
  const fin = Math.max(...t.map((v, i) => v + d[i]));
  const S = [...Array(n).keys()].map(i => [...Array(n).keys()].filter(j => P[j].includes(i)));
  const Tt = Array(n).fill(0);
  [...order].reverse().forEach(i => Tt[i] = S[i].length ? Math.min(...S[i].map(j => Tt[j])) - d[i] : fin - d[i]);
  const ML = [...Array(n).keys()].map(i => (S[i].length ? Math.min(...S[i].map(j => t[j])) : fin) - t[i] - d[i]);
  const paths = [];
  const crit = i => Tt[i] === t[i];
  const dfs = (i, path) => {
    const nx = S[i].filter(j => crit(j) && t[j] === t[i] + d[i]);
    if (!S[i].length || (!nx.length && t[i] + d[i] === fin)) { if (t[i] + d[i] === fin) paths.push(path); return; }
    nx.forEach(j => dfs(j, [...path, j]));
  };
  [...Array(n).keys()].filter(i => !P[i].length && crit(i)).forEach(i => dfs(i, [i]));
  return { t, T: Tt, fin, ML, S, paths };
}
function mpmTable(names, d, P, res, withML) {
  names = [...names];
  const head = ["Tâche", "Durée", "Antériorité", "t (au plus tôt)", "T (au plus tard)", "Marge totale"].concat(withML ? ["Marge libre"] : []);
  return T(head, names.map((nm, i) => [nm, d[i], P[i].length ? P[i].map(k => names[k]).join(", ") : "—", res.t[i], res.T[i], res.T[i] - res.t[i]].concat(withML ? [res.ML[i]] : [])));
}

/* ================================================================ CHAPITRES */
const CH = {};

/* ============================ 1. NUMÉRATION ============================ */
CH.numeration = {
  ecrits: [
    { id: "n1", niv: 1, titre: "Binaire vers décimal", q: `Convertir en décimal : a) 1101<sub>2</sub> b) 100110<sub>2</sub> c) 1111 1111<sub>2</sub>.`,
      c: `a) 8 + 4 + 1 = <b>13</b>. b) 32 + 4 + 2 = <b>38</b>. c) 128 + 64 + 32 + 16 + 8 + 4 + 2 + 1 = <b>255</b> (c'est aussi 2<sup>8</sup> − 1).` },
    { id: "n2", niv: 1, titre: "Décimal vers binaire", q: `Convertir en binaire : a) 25 b) 64 c) 100.`,
      c: `a) 25 = 16 + 8 + 1 = <b>11001<sub>2</sub></b>. b) 64 = 2<sup>6</sup> = <b>1000000<sub>2</sub></b>. c) 100 = 64 + 32 + 4 = <b>1100100<sub>2</sub></b>.` },
    { id: "n3", niv: 1, titre: "Hexadécimal vers décimal", q: `Convertir en décimal : a) 0xA b) 0x40 c) 0xFF d) 0x1A3.`,
      c: `a) <b>10</b>. b) 4 × 16 = <b>64</b>. c) 15 × 16 + 15 = <b>255</b>. d) 1 × 256 + 10 × 16 + 3 = <b>419</b>.` },
    { id: "n4", niv: 2, titre: "Hexadécimal, binaire et décimal", q: `Convertir 0x7E3 en binaire puis en décimal.`,
      c: `Chaque chiffre hexadécimal donne 4 bits : 7 = 0111, E = 1110, 3 = 0011. Donc 0x7E3 = <b>111 1110 0011<sub>2</sub></b>.<br>En décimal : 7 × 256 + 14 × 16 + 3 = 1792 + 224 + 3 = <b>2019</b>.` },
    { id: "n5", niv: 2, titre: "Base 8 (octal)", q: `Convertir 157<sub>8</sub> en décimal puis en binaire.`,
      c: `1 × 64 + 5 × 8 + 7 = <b>111</b>. Chaque chiffre octal donne 3 bits : 1 = 001, 5 = 101, 7 = 111, donc <b>1 101 111<sub>2</sub></b>. Vérification : 64 + 32 + 8 + 4 + 2 + 1 = 111.` },
    { id: "n6", niv: 2, titre: "Addition binaire", q: `Poser l'addition 1011 0110<sub>2</sub> + 0101 1011<sub>2</sub>. Vérifier en décimal. Le résultat tient-il sur 8 bits ?`,
      c: `1011 0110 + 0101 1011 = <b>1 0001 0001<sub>2</sub></b>. En décimal : 182 + 91 = 273 = 256 + 16 + 1 ✔.<br>Le résultat a 9 bits : sur 8 bits, il y a un <b>dépassement de capacité</b>, car le maximum est 255.` },
    { id: "n7", niv: 2, titre: "Nombre de bits nécessaires", q: `a) Quel est le plus grand entier naturel codable sur 16 bits ?<br>b) Combien de bits faut-il au minimum pour coder 1 000 valeurs différentes ?`,
      c: `a) 2<sup>16</sup> − 1 = <b>65 535</b>. b) 2<sup>9</sup> = 512 &lt; 1000 ≤ 2<sup>10</sup> = 1024, donc il faut <b>10 bits</b>.` },
    { id: "n8", niv: 3, titre: "SISR — Adresse réseau et broadcast", q: `Un poste a l'adresse 192.168.10.77/27.<br>1. Écrire le masque en décimal pointé.<br>2. Déterminer l'adresse du réseau et l'adresse de broadcast.<br>3. Combien d'hôtes peut-on adresser ? Donner la plage d'adresses utilisables.`,
      c: `1. /27 donne 27 bits à 1, donc le dernier octet vaut 1110 0000 = 224 : <b>255.255.255.224</b>.<br>2. 77 = 0100 1101. 0100 1101 ET 1110 0000 = 0100 0000 = 64, donc le réseau est <b>192.168.10.64</b>. Il reste 5 bits d'hôte, d'où le broadcast 64 + 31 = 95 : <b>192.168.10.95</b>.<br>3. 2<sup>5</sup> − 2 = <b>30 hôtes</b>, de 192.168.10.65 à 192.168.10.94.` },
    { id: "n9", niv: 2, titre: "Adresse MAC", q: `Une adresse MAC s'écrit avec 6 octets en hexadécimal, par exemple 00:1A:2B:3C:4D:5E.<br>a) Combien de bits comporte une adresse MAC ? Combien d'adresses différentes existe-t-il ?<br>b) Convertir l'octet 2B en binaire et en décimal.`,
      c: `a) 6 × 8 = <b>48 bits</b>, soit 2<sup>48</sup> ≈ 2,8 × 10<sup>14</sup> adresses.<br>b) 2 = 0010 et B = 1011, donc <b>0010 1011<sub>2</sub></b> = 32 + 8 + 2 + 1 = <b>43</b>.` },
    { id: "n10", niv: 3, titre: "Complément à 2", q: `On code les entiers signés sur 8 bits en complément à 2.<br>a) Coder −45.<br>b) Quel entier est codé par 1111 0110 ?<br>c) Quelles sont les valeurs extrêmes codables sur 8 bits ?`,
      c: `a) 45 = 0010 1101. On inverse les bits (1101 0010) puis on ajoute 1 : <b>1101 0011</b>. Vérification : 1101 0011 = 211 = 256 − 45.<br>b) Le premier bit vaut 1, donc le nombre est négatif : 1111 0110 = 246 et 246 − 256 = <b>−10</b>.<br>c) De <b>−128</b> (1000 0000) à <b>+127</b> (0111 1111).` },
    { id: "n11", niv: 2, titre: "Autres bases", q: `a) Convertir 243<sub>5</sub> en décimal.<br>b) Écrire le résultat en base 3.`,
      c: `a) 2 × 25 + 4 × 5 + 3 = <b>73</b>.<br>b) 73 = 3 × 24 + 1 ; 24 = 3 × 8 + 0 ; 8 = 3 × 2 + 2 ; 2 = 3 × 0 + 2. On lit les restes de bas en haut : <b>2201<sub>3</sub></b>. Vérification : 2 × 27 + 2 × 9 + 0 + 1 = 73.` },
    { id: "n12", niv: 2, titre: "Couleurs en hexadécimal", q: `En HTML, la couleur #FF8C00 code les composantes Rouge, Vert et Bleu sur un octet chacune.<br>a) Donner les trois composantes en décimal.<br>b) Combien de couleurs peut-on coder ainsi ?`,
      c: `a) R = FF = <b>255</b>, V = 8C = 8 × 16 + 12 = <b>140</b>, B = 00 = <b>0</b>.<br>b) 24 bits, donc 2<sup>24</sup> = <b>16 777 216 couleurs</b>.` },
    { id: "n13", niv: 3, titre: "IPv6", q: `Une adresse IPv6 comporte 8 groupes de 4 chiffres hexadécimaux, par exemple FE80:0000:0000:0000:0202:B3FF:FE1E:8329.<br>a) Combien de bits code un groupe ? Combien de bits fait une adresse IPv6 ?<br>b) Écrire le groupe FE80 en binaire.`,
      c: `a) 4 chiffres × 4 bits = <b>16 bits</b> par groupe, donc 8 × 16 = <b>128 bits</b>.<br>b) F = 1111, E = 1110, 8 = 1000, 0 = 0000 : <b>1111 1110 1000 0000</b>.` },
    { id: "n14", niv: 1, titre: "Puissances de 2", q: `Compléter : 2<sup>0</sup>, 2<sup>1</sup>, …, 2<sup>10</sup>. Combien de valeurs peut-on coder sur un octet ?`,
      c: `1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024. Sur un octet (8 bits) : 2<sup>8</sup> = <b>256 valeurs</b>, de 0 à 255.` },
  ],
  generes: [
    { id: "gn1", niv: 1, titre: "Décimal → binaire (divisions successives)", gen() {
        const n = R(20, 255); let x = n; const L = [];
        while (x > 0) { L.push(`${x} = 2 × ${Math.floor(x / 2)} + <b>${x % 2}</b>`); x = Math.floor(x / 2); }
        return { q: `Convertir <b>${n}</b> en binaire à l'aide de divisions successives par 2.`,
          c: `<pre>${L.join("\n").replace(/<\/?b>/g, "")}</pre>On lit les restes de bas en haut : <b>${n} = ${grp4(n.toString(2))}<sub>2</sub></b>.` };
    } },
    { id: "gn2", niv: 1, titre: "Binaire → décimal", gen() {
        const n = R(33, 255), b = n.toString(2), parts = [...b].map((ch, i) => ch === "1" ? 2 ** (b.length - 1 - i) : 0).filter(Boolean);
        return { q: `Convertir <b>${grp4(b)}<sub>2</sub></b> en décimal.`, c: `${parts.join(" + ")} = <b>${n}</b>.` };
    } },
    { id: "gn3", niv: 2, titre: "Décimal → hexadécimal", gen() {
        const n = R(256, 4095); let x = n; const L = [];
        while (x > 0) { const r = x % 16; L.push(`${x} = 16 × ${Math.floor(x / 16)} + ${r}${r > 9 ? " (" + r.toString(16).toUpperCase() + ")" : ""}`); x = Math.floor(x / 16); }
        return { q: `Convertir <b>${n}</b> en hexadécimal, puis en binaire.`,
          c: `<pre>${L.join("\n")}</pre>En lisant de bas en haut : <b>${n} = 0x${n.toString(16).toUpperCase()}</b>.<br>Chaque chiffre donne 4 bits : <b>${grp4(n.toString(2).padStart(Math.ceil(n.toString(2).length / 4) * 4, "0"))}<sub>2</sub></b>.` };
    } },
    { id: "gn4", niv: 2, titre: "Hexadécimal → binaire → décimal", gen() {
        const n = R(256, 4095), h = n.toString(16).toUpperCase();
        return { q: `Convertir <b>0x${h}</b> en binaire puis en décimal.`,
          c: `${[...h].map(ch => `${ch} → ${bits(parseInt(ch, 16), 4)}`).join(" ; ")}, donc 0x${h} = <b>${[...h].map(ch => bits(parseInt(ch, 16), 4)).join(" ")}<sub>2</sub></b>.<br>En décimal : ${[...h].map((ch, i) => `${parseInt(ch, 16)} × ${16 ** (h.length - 1 - i)}`).join(" + ")} = <b>${n}</b>.` };
    } },
    { id: "gn5", niv: 2, titre: "Addition binaire", gen() {
        const a = R(40, 200), b = R(30, 200), s = a + b;
        return { q: `Calculer en binaire ${grp4(bits(a, 8))}<sub>2</sub> + ${grp4(bits(b, 8))}<sub>2</sub>, puis vérifier en décimal. Le résultat tient-il sur 8 bits ?`,
          c: `Résultat : <b>${grp4(s.toString(2))}<sub>2</sub></b>. Vérification : ${a} + ${b} = ${s}.<br>${s > 255 ? `${s} &gt; 255 : le résultat a 9 bits, il y a un <b>dépassement de capacité</b> sur 8 bits.` : `${s} ≤ 255 : le résultat <b>tient sur 8 bits</b>.`}` };
    } },
    { id: "gn6", niv: 3, titre: "SISR — Masque, réseau et hôtes", gen() {
        const cidr = R(18, 29), ip = pick([[192, 168, R(0, 255), R(1, 254)], [10, R(0, 255), R(0, 255), R(1, 254)], [172, R(16, 31), R(0, 255), R(1, 254)]]);
        const mask = [0, 1, 2, 3].map(k => { const nb = Math.max(0, Math.min(8, cidr - 8 * k)); return nb ? (0xFF << (8 - nb)) & 0xFF : 0; });
        const k = mask.findIndex(m => m !== 255), net = ip.map((o, i) => o & mask[i]), bc = ip.map((o, i) => (o & mask[i]) | (~mask[i] & 255));
        const first = net.slice(), last = bc.slice(); first[3]++; last[3]--;
        return { q: `Un poste a l'adresse <b>${ip.join(".")}/${cidr}</b>.<br>1. Écrire le masque en décimal pointé.<br>2. Déterminer l'adresse réseau et l'adresse de broadcast.<br>3. Combien d'hôtes peut-on adresser ?`,
          c: `1. ${cidr} bits à 1 : <b>${mask.join(".")}</b> (l'octet n°${k + 1} vaut ${bits(mask[k], 8)} = ${mask[k]}).<br>2. Sur l'octet n°${k + 1} : ${bits(ip[k], 8)} ET ${bits(mask[k], 8)} = ${bits(net[k], 8)} = ${net[k]}. Réseau : <b>${net.join(".")}</b>. Broadcast (tous les bits d'hôte à 1) : <b>${bc.join(".")}</b>.<br>3. ${32 - cidr} bits d'hôte : 2<sup>${32 - cidr}</sup> − 2 = <b>${(2 ** (32 - cidr) - 2).toLocaleString("fr-FR")} hôtes</b>, de ${first.join(".")} à ${last.join(".")}.` };
    } },
    { id: "gn7", niv: 3, titre: "Complément à 2 sur 8 bits", gen() {
        const n = R(5, 120), c2 = 256 - n, inv = 255 - n;
        return { q: `Coder <b>−${n}</b> en complément à 2 sur 8 bits, puis vérifier.`,
          c: `${n} = ${grp4(bits(n, 8))}. On inverse les bits : ${grp4(bits(inv, 8))}. On ajoute 1 : <b>${grp4(bits(c2, 8))}</b>.<br>Vérification : ${grp4(bits(c2, 8))} = ${c2} et ${c2} − 256 = −${n} ✔.` };
    } },
    { id: "gn8", niv: 2, titre: "Octal ↔ binaire ↔ décimal", gen() {
        const n = R(64, 511), o = n.toString(8);
        return { q: `Convertir <b>${o}<sub>8</sub></b> en binaire puis en décimal.`,
          c: `Chaque chiffre octal donne 3 bits : ${[...o].map(ch => `${ch} → ${bits(+ch, 3)}`).join(" ; ")}, donc <b>${[...o].map(ch => bits(+ch, 3)).join(" ")}<sub>2</sub></b>.<br>En décimal : ${[...o].map((ch, i) => `${ch} × ${8 ** (o.length - 1 - i)}`).join(" + ")} = <b>${n}</b>.` };
    } },
  ]
};

/* ============================ 2. LOGIQUE ============================ */
const FORMULES = [
  { f: "(p ∧ q) ∨ ¬r", cols: [["p ∧ q", (p, q, r) => p && q], ["¬r", (p, q, r) => !r]], v: (p, q, r) => (p && q) || !r },
  { f: "p ⇒ (q ∨ r)", cols: [["q ∨ r", (p, q, r) => q || r]], v: (p, q, r) => !p || q || r },
  { f: "¬(p ∨ q) ∧ r", cols: [["p ∨ q", (p, q, r) => p || q], ["¬(p ∨ q)", (p, q, r) => !(p || q)]], v: (p, q, r) => !(p || q) && r },
  { f: "(p ⇒ q) ∧ (q ⇒ r)", cols: [["p ⇒ q", (p, q) => !p || q], ["q ⇒ r", (p, q, r) => !q || r]], v: (p, q, r) => (!p || q) && (!q || r) },
  { f: "(p ⇔ q) ∨ r", cols: [["p ⇔ q", (p, q) => p === q]], v: (p, q, r) => p === q || r },
  { f: "¬p ⇒ (q ∧ r)", cols: [["¬p", p => !p], ["q ∧ r", (p, q, r) => q && r]], v: (p, q, r) => p || (q && r) },
  { f: "(p ∨ q) ⇒ r", cols: [["p ∨ q", (p, q) => p || q]], v: (p, q, r) => !(p || q) || r },
  { f: "(p ∧ ¬q) ⇒ ¬r", cols: [["p ∧ ¬q", (p, q) => p && !q], ["¬r", (p, q, r) => !r]], v: (p, q, r) => !(p && !q) || !r },
];
const ROWS3 = [[1, 1, 1], [1, 1, 0], [1, 0, 1], [1, 0, 0], [0, 1, 1], [0, 1, 0], [0, 0, 1], [0, 0, 0]].map(r => r.map(Boolean));
const tableVerite = (F, hl) => T(["p", "q", "r", ...F.cols.map(c => c[0]), `<b>${F.f}</b>`],
  ROWS3.map((r, i) => [...r.map(VF), ...F.cols.map(c => VF(c[1](...r))), (i === hl ? "→ " : "") + `<b>${VF(F.v(...r))}</b>`]));

CH.logique = {
  ecrits: [
    { id: "l1", niv: 1, titre: "Reconnaître une proposition", q: `Parmi les phrases suivantes, lesquelles sont des propositions ? Donner leur valeur de vérité.<br>a) « 7 est un nombre pair. » b) « x &gt; 3 » c) « Redémarre le serveur. » d) « 2 + 2 = 4 »`,
      c: `a) Proposition <b>fausse</b>. b) Ce n'est pas une proposition mais un <b>prédicat</b> : sa vérité dépend de x. c) Ce n'est pas une proposition (c'est un ordre). d) Proposition <b>vraie</b>.` },
    { id: "l2", niv: 1, titre: "¬p ∨ q et l'implication", q: `Dresser la table de vérité de ¬p ∨ q et la comparer à celle de p ⇒ q.`,
      c: T(["p", "q", "¬p", "¬p ∨ q", "p ⇒ q"], [["V", "V", "F", "V", "V"], ["V", "F", "F", "F", "F"], ["F", "V", "V", "V", "V"], ["F", "F", "V", "V", "V"]]) + `Les deux colonnes sont identiques : <b>p ⇒ q ≡ ¬p ∨ q</b>.` },
    { id: "l3", niv: 2, titre: "Négation d'une implication", q: `Montrer à l'aide d'une table de vérité que ¬(p ⇒ q) ≡ p ∧ ¬q.`,
      c: T(["p", "q", "p ⇒ q", "¬(p ⇒ q)", "¬q", "p ∧ ¬q"], [["V", "V", "V", "F", "F", "F"], ["V", "F", "F", "V", "V", "V"], ["F", "V", "V", "F", "F", "F"], ["F", "F", "V", "F", "V", "F"]]) + `Les colonnes 4 et 6 sont identiques. Le contraire de « s'il pleut, je prends mon parapluie », c'est « il pleut <b>et</b> je ne prends pas mon parapluie ».` },
    { id: "l4", niv: 2, titre: "Réciproque et contraposée", q: `On considère : « Si le serveur DNS est en panne, alors le site est inaccessible. »<br>Écrire la réciproque et la contraposée. Laquelle est forcément vraie si la phrase de départ est vraie ?`,
      c: `Réciproque : « Si le site est inaccessible, alors le serveur DNS est en panne. » Elle n'est pas forcément vraie : la panne peut venir d'ailleurs (serveur web, pare-feu…).<br>Contraposée : « Si le site est accessible, alors le serveur DNS n'est pas en panne. » <b>La contraposée est équivalente à la phrase de départ</b>, donc elle est vraie.` },
    { id: "l5", niv: 2, titre: "Négation avec quantificateurs", q: `Écrire la négation des propositions suivantes et dire laquelle est vraie, entre la proposition et sa négation.<br>a) ∀x ∈ ℝ, x² ≥ 0 b) ∃n ∈ ℕ, n est pair et n est premier.`,
      c: `a) Négation : <b>∃x ∈ ℝ, x² &lt; 0</b>. Elle est fausse : c'est la proposition de départ qui est vraie.<br>b) Négation : <b>∀n ∈ ℕ, n est impair ou n n'est pas premier</b>. La proposition de départ est vraie (n = 2), donc la négation est fausse.` },
    { id: "l6", niv: 2, titre: "Traduire avec des quantificateurs", q: `On note U l'ensemble des utilisateurs, M(u) : « u a un mot de passe » et A(u) : « u est administrateur ». Traduire en symboles :<br>a) Tout utilisateur a un mot de passe.<br>b) Certains utilisateurs sont administrateurs.<br>c) Aucun administrateur n'est sans mot de passe.`,
      c: `a) <b>∀u ∈ U, M(u)</b>. b) <b>∃u ∈ U, A(u)</b>. c) <b>∀u ∈ U, A(u) ⇒ M(u)</b>.` },
    { id: "l7", niv: 2, titre: "Lois de De Morgan en français", q: `Une règle dit : « Le mot de passe contient au moins 12 caractères <b>et</b> au moins un chiffre. » Écrire en français la condition pour qu'un mot de passe soit refusé.`,
      c: `On nie un ET, donc on obtient un OU : « Le mot de passe contient <b>moins de 12 caractères ou aucun chiffre</b>. » C'est ¬(a ∧ b) ≡ ¬a ∨ ¬b.` },
    { id: "l8", niv: 2, titre: "Opérations sur les ensembles", q: `E = {1, 2, …, 12}. A est l'ensemble des diviseurs de 12, B celui des nombres premiers de E.<br>Déterminer A, B, A ∩ B, A ∪ B, A \\ B et card(A ∪ B).`,
      c: `A = {1, 2, 3, 4, 6, 12} et B = {2, 3, 5, 7, 11}.<br>A ∩ B = <b>{2, 3}</b> ; A ∪ B = <b>{1, 2, 3, 4, 5, 6, 7, 11, 12}</b> ; A \\ B = <b>{1, 4, 6, 12}</b>.<br>card(A ∪ B) = 6 + 5 − 2 = <b>9</b>.` },
    { id: "l9", niv: 1, titre: "Produit cartésien et parties", q: `A = {0, 1} et B = {a, b, c}.<br>a) Écrire A × B et donner son cardinal.<br>b) Combien B a-t-il de parties ? Les écrire.`,
      c: `a) A × B = {(0,a), (0,b), (0,c), (1,a), (1,b), (1,c)}, donc card = 2 × 3 = <b>6</b>.<br>b) 2<sup>3</sup> = <b>8 parties</b> : ∅, {a}, {b}, {c}, {a,b}, {a,c}, {b,c}, {a,b,c}.` },
    { id: "l10", niv: 3, titre: "SISR — Analyse d'incidents", q: `Sur 200 tickets d'incident, 120 concernent le réseau (R), 90 un logiciel (L) et 40 les deux.<br>1. Combien de tickets concernent le réseau ou un logiciel ?<br>2. Combien ne concernent ni l'un ni l'autre ?<br>3. Combien concernent uniquement le réseau ?`,
      c: `1. card(R ∪ L) = 120 + 90 − 40 = <b>170</b>.<br>2. 200 − 170 = <b>30</b>.<br>3. card(R \\ L) = 120 − 40 = <b>80</b>.` },
    { id: "l11", niv: 3, titre: "Prédicats sur les entiers", q: `P(n) : « n est divisible par 4 » et Q(n) : « n est pair ». Vrai ou faux ? Justifier.<br>a) ∀n ∈ ℕ, P(n) ⇒ Q(n)<br>b) ∀n ∈ ℕ, Q(n) ⇒ P(n)<br>c) ∃n ∈ ℕ, Q(n) ∧ ¬P(n)`,
      c: `a) <b>Vrai</b> : si n = 4k, alors n = 2 × (2k) est pair.<br>b) <b>Faux</b>, contre-exemple : n = 6 est pair mais n'est pas divisible par 4.<br>c) <b>Vrai</b> : n = 2 convient (c'est la négation de b).` },
    { id: "l12", niv: 3, titre: "Simplifier une proposition", q: `Montrer que ¬(¬p ∨ q) ∨ q ≡ p ∨ q.`,
      c: `¬(¬p ∨ q) ≡ p ∧ ¬q (De Morgan). Donc l'expression vaut (p ∧ ¬q) ∨ q ≡ (p ∨ q) ∧ (¬q ∨ q) par distributivité. Comme ¬q ∨ q est toujours vrai, on obtient <b>p ∨ q</b>.` },
    { id: "l13", niv: 1, titre: "Implication vraie ou fausse", q: `Dire si chaque implication est vraie ou fausse :<br>a) « Si 2 + 2 = 5, alors Paris est en Italie. »<br>b) « Si 3 &gt; 1, alors 10 est pair. »<br>c) « Si 10 est pair, alors 3 &lt; 1. »`,
      c: `a) Les deux parties sont fausses : l'implication est <b>vraie</b> (F ⇒ F = V).<br>b) V ⇒ V : <b>vraie</b>.<br>c) V ⇒ F : <b>fausse</b>. C'est le seul cas où une implication est fausse.` },
  ],
  generes: [
    { id: "gl1", niv: 2, titre: "Table de vérité", gen() { const F = pick(FORMULES); return { q: `Dresser la table de vérité de la proposition <b>${F.f}</b>.`, c: tableVerite(F, -1) }; } },
    { id: "gl2", niv: 1, titre: "Valeur de vérité d'une proposition", gen() {
        const F = pick(FORMULES), i = R(0, 7), r = ROWS3[i];
        return { q: `On suppose p ${VF(r[0]) === "V" ? "vraie" : "fausse"}, q ${VF(r[1]) === "V" ? "vraie" : "fausse"} et r ${VF(r[2]) === "V" ? "vraie" : "fausse"}. Quelle est la valeur de vérité de <b>${F.f}</b> ?`,
          c: `${F.cols.map(cc => `${cc[0]} : ${VF(cc[1](...r))}`).join(" ; ")}.<br>Donc <b>${F.f}</b> est <b>${F.v(...r) ? "vraie" : "fausse"}</b>.` };
    } },
    { id: "gl3", niv: 2, titre: "Cardinaux (union, intersection)", gen() {
        const ctx = pick([["employés", "utilisent le VPN", "ont un badge salle serveur"], ["postes", "sont sous Windows 11", "ont un antivirus à jour"], ["étudiants", "suivent l'option SISR", "font du Python"], ["tickets", "sont urgents", "concernent l'imprimante"]]);
        const a = R(30, 90), b = R(20, 80), c = R(5, Math.min(a, b) - 5), N = a + b - c + R(5, 40);
        return { q: `Sur ${N} ${ctx[0]}, ${a} ${ctx[1]} (ensemble A), ${b} ${ctx[2]} (ensemble B) et ${c} les deux.<br>1. Calculer card(A ∪ B).<br>2. Combien de ${ctx[0]} ne sont dans aucun des deux ?<br>3. Combien sont dans exactement un des deux ?`,
          c: `1. card(A ∪ B) = ${a} + ${b} − ${c} = <b>${a + b - c}</b>.<br>2. ${N} − ${a + b - c} = <b>${N - a - b + c}</b>.<br>3. ${a + b - c} − ${c} = <b>${a + b - 2 * c}</b>.` };
    } },
    { id: "gl4", niv: 1, titre: "Opérations sur des ensembles", gen() {
        const n = R(12, 20), k = R(2, 4), j = pick([3, 4, 5].filter(x => x !== k));
        const E = [...Array(n)].map((_, i) => i + 1), A = E.filter(x => x % k === 0), B = E.filter(x => x % j === 0);
        const S = s => s.length ? `{${s.join(", ")}}` : "∅";
        const I = A.filter(x => B.includes(x)), U = E.filter(x => A.includes(x) || B.includes(x));
        return { q: `E = {1, 2, …, ${n}}. A est l'ensemble des multiples de ${k} et B celui des multiples de ${j} dans E.<br>Déterminer A ∩ B, A ∪ B, A \\ B et le complémentaire de A dans E.`,
          c: `A = ${S(A)} et B = ${S(B)}.<br>A ∩ B = <b>${S(I)}</b><br>A ∪ B = <b>${S(U)}</b> (card = ${A.length} + ${B.length} − ${I.length} = ${U.length})<br>A \\ B = <b>${S(A.filter(x => !B.includes(x)))}</b><br>Complémentaire de A = <b>${S(E.filter(x => !A.includes(x)))}</b>` };
    } },
  ]
};

/* ============================ 3. ALGÈBRE DE BOOLE ============================ */
const EXPR = [
  { e: `a·b + ${ov("a")}·c`, f: (a, b, c) => (a && b) || (!a && c) },
  { e: `(a + ${ov("b")})·c`, f: (a, b, c) => (a || !b) && c },
  { e: `${ov("a·b")} + c`, f: (a, b, c) => !(a && b) || c },
  { e: `a·${ov("c")} + ${ov("b")}`, f: (a, b, c) => (a && !c) || !b },
  { e: `${ov("a + b")}·c + a·b`, f: (a, b, c) => (!(a || b) && c) || (a && b) },
  { e: `(a + b)·(${ov("a")} + c)`, f: (a, b, c) => (a || b) && (!a || c) },
];
CH.boole = {
  ecrits: [
    { id: "b1", niv: 1, titre: "Évaluer une expression", q: `Calculer F = a·b + ${ov("a")}·c + ${ov("b")} pour a = 1, b = 0, c = 1.`,
      c: `a·b = 0 ; ${ov("a")} = 0 donc ${ov("a")}·c = 0 ; ${ov("b")} = 1. Donc F = 0 + 0 + 1 = <b>1</b>.` },
    { id: "b2", niv: 1, titre: "Démontrer l'absorption", q: `Démontrer que a + a·b = a, puis que a·(a + b) = a.`,
      c: `a + a·b = a·1 + a·b = a·(1 + b) = a·1 = <b>a</b>.<br>a·(a + b) = a·a + a·b = a + a·b = <b>a</b> (d'après le premier résultat).` },
    { id: "b3", niv: 2, titre: "Trois simplifications classiques", q: `Simplifier : a) a·b + a·${ov("b")} b) (a + b)·(a + ${ov("b")}) c) a + ${ov("a")}·b`,
      c: `a) a·(b + ${ov("b")}) = a·1 = <b>a</b>.<br>b) a·a + a·${ov("b")} + b·a + b·${ov("b")} = a + a·${ov("b")} + a·b + 0 = <b>a</b> (absorption).<br>c) (a + ${ov("a")})·(a + b) = 1·(a + b) = <b>a + b</b> (distributivité de + sur ·).` },
    { id: "b4", niv: 2, titre: "Simplification algébrique", q: `Simplifier E = ${ov("a")}·${ov("b")}·c + ${ov("a")}·b·c + a·b·c.`,
      c: `${ov("a")}·${ov("b")}·c + ${ov("a")}·b·c = ${ov("a")}·c·(${ov("b")} + b) = ${ov("a")}·c.<br>Donc E = ${ov("a")}·c + a·b·c = c·(${ov("a")} + a·b) = c·(${ov("a")} + b) = <b>${ov("a")}·c + b·c</b>.` },
    { id: "b5", niv: 2, titre: "Complément avec De Morgan", q: `Écrire le complément de F = a·b + c sous forme d'un produit de sommes.`,
      c: `${ov("F")} = ${ov("a·b")} · ${ov("c")} = <b>(${ov("a")} + ${ov("b")})·${ov("c")}</b>.` },
    { id: "b6", niv: 2, titre: "Le OU exclusif", q: `a ⊕ b vaut 1 lorsque a et b sont différents.<br>a) Dresser sa table de vérité et donner une expression avec +, · et le complément.<br>b) Montrer que son complément vaut a·b + ${ov("a")}·${ov("b")}.`,
      c: `a) ${T(["a", "b", "a ⊕ b"], [[0, 0, 0], [0, 1, 1], [1, 0, 1], [1, 1, 0]])}a ⊕ b = <b>${ov("a")}·b + a·${ov("b")}</b>.<br>b) Par De Morgan : ${ov(`${ov("a")}·b`)} · ${ov(`a·${ov("b")}`)} = (a + ${ov("b")})·(${ov("a")} + b) = a·${ov("a")} + a·b + ${ov("b")}·${ov("a")} + ${ov("b")}·b = <b>a·b + ${ov("a")}·${ov("b")}</b>.` },
    { id: "b7", niv: 2, titre: "Karnaugh à 3 variables", q: `F(a, b, c) vaut 1 pour abc ∈ {001, 011, 101, 110, 111}. Simplifier F avec un tableau de Karnaugh.`,
      c: kmapExo(3, new Set([1, 3, 5, 6, 7])).c },
    { id: "b8", niv: 3, titre: "Karnaugh à 4 variables (les coins)", q: `F(a, b, c, d) vaut 1 pour les combinaisons abcd suivantes : 0000, 0010, 1000, 1010, 0101, 0111, 1101, 1111. Simplifier F.`,
      c: kmapExo(4, new Set([0, 2, 8, 10, 5, 7, 13, 15])).c + `<p>Remarque : les 4 coins du tableau sont adjacents. F vaut 1 quand b = d, c'est le complément de b ⊕ d.</p>` },
    { id: "b9", niv: 3, titre: "Problème — sauvegarde automatique", q: `Une sauvegarde se lance (S = 1) s'il est 2 h du matin (h) ou si un technicien la lance à la main (m), à condition que le disque ne soit pas plein (p).<br>1. Écrire S en fonction de h, m et p.<br>2. Dresser la table de vérité.<br>3. La sauvegarde se lance-t-elle à 2 h si le disque est plein ?`,
      c: `1. <b>S = (h + m)·${ov("p")}</b> = h·${ov("p")} + m·${ov("p")}.<br>2. ${T(["h", "m", "p", "S"], [[0, 0, 0, 0], [0, 0, 1, 0], [0, 1, 0, 1], [0, 1, 1, 0], [1, 0, 0, 1], [1, 0, 1, 0], [1, 1, 0, 1], [1, 1, 1, 0]])}3. h = 1 et p = 1, donc ${ov("p")} = 0 et S = 0 : <b>non</b>.` },
    { id: "b10", niv: 3, titre: "Détecteur de parité", q: `F(a, b, c) vaut 1 lorsque le nombre de bits à 1 est impair.<br>1. Donner la table de vérité.<br>2. Peut-on simplifier F avec un tableau de Karnaugh ? Conclure.`,
      c: `1. F = 1 pour 001, 010, 100 et 111.<br>2. ${kmap(3, new Set([1, 2, 4, 7]))}Les 1 sont en damier : aucune case à 1 n'est voisine d'une autre, donc <b>aucun regroupement</b> n'est possible. F = ${ov("a")}·${ov("b")}·c + ${ov("a")}·b·${ov("c")} + a·${ov("b")}·${ov("c")} + a·b·c = <b>a ⊕ b ⊕ c</b>.` },
    { id: "b11", niv: 2, titre: "Circuit logique", q: `Un circuit reçoit a et b dans une porte OU, et c dans une porte NON. Les deux sorties entrent dans une porte ET.<br>1. Écrire l'expression de la sortie F.<br>2. Pour quelles entrées a-t-on F = 1 ?`,
      c: `1. <b>F = (a + b)·${ov("c")}</b>.<br>2. Il faut c = 0 et (a = 1 ou b = 1) : abc ∈ <b>{010, 100, 110}</b>.` },
    { id: "b12", niv: 2, titre: "Démontrer une égalité", q: `Montrer que a·${ov("b")} + ${ov("a")}·b + a·b = a + b.`,
      c: `a·${ov("b")} + a·b = a·(${ov("b")} + b) = a. Il reste a + ${ov("a")}·b = <b>a + b</b>.` },
    { id: "b13", niv: 3, titre: "La porte NAND est universelle", q: `On note a ↑ b = ${ov("a·b")} (NAND). Exprimer ${ov("a")}, a·b et a + b en n'utilisant que des NAND.`,
      c: `${ov("a")} = ${ov("a·a")} = <b>a ↑ a</b>.<br>a·b = ${ov(ov("a·b"))} = <b>(a ↑ b) ↑ (a ↑ b)</b>.<br>a + b = ${ov(`${ov("a")}·${ov("b")}`)} = <b>(a ↑ a) ↑ (b ↑ b)</b> (De Morgan).` },
  ],
  generes: [
    { id: "gb1", niv: 2, titre: "Karnaugh à 3 variables", gen() {
        let ones; do { ones = new Set(shuf([...Array(8).keys()]).slice(0, R(3, 6))); } while (minimise(3, ones).length > 3);
        return kmapExo(3, ones);
    } },
    { id: "gb2", niv: 3, titre: "Karnaugh à 4 variables", gen() {
        let ones;
        do {
          ones = new Set();
          for (let k = 0; k < R(2, 3); k++) { let c = ""; const free = shuf([0, 1, 2, 3]).slice(0, R(1, 2)); for (let i = 0; i < 4; i++) c += free.includes(i) ? "-" : R(0, 1); cover(c).forEach(m => ones.add(m)); }
        } while (ones.size < 4 || ones.size > 12);
        return kmapExo(4, ones);
    } },
    { id: "gb3", niv: 1, titre: "Évaluer une expression booléenne", gen() {
        const E = pick(EXPR), a = R(0, 1), b = R(0, 1), c = R(0, 1);
        return { q: `Calculer F = ${E.e} pour a = ${a}, b = ${b}, c = ${c}.`, c: `En remplaçant : <b>F = ${+E.f(a, b, c)}</b>.<br>Pense à calculer d'abord les compléments, puis les produits, puis les sommes.` };
    } },
    { id: "gb4", niv: 2, titre: "Table de vérité d'une expression", gen() {
        const E = pick(EXPR), rows = [];
        for (let i = 0; i < 8; i++) { const [a, b, c] = bits(i, 3).split("").map(Number); rows.push([a, b, c, `<b>${+E.f(a, b, c)}</b>`]); }
        const ones = new Set([...Array(8).keys()].filter(i => E.f(...bits(i, 3).split("").map(Number))));
        const s = ones.size === 0 ? "0" : ones.size === 8 ? "1" : minimise(3, ones).map(t => terme(t, "abc")).join(" + ");
        return { q: `Dresser la table de vérité de F = ${E.e}, puis en déduire une forme simplifiée.`, c: `${T(["a", "b", "c", "F"], rows)}Avec un tableau de Karnaugh : <b>F = ${s}</b>.` };
    } },
  ]
};

/* ============================ 4. MATRICES ============================ */
const randM = (r, c, lo, hi) => Array.from({ length: r }, () => Array.from({ length: c }, () => R(lo, hi)));
CH.matrices = {
  ecrits: [
    { id: "m1", niv: 1, titre: "Dimensions et coefficients", q: `Soit A = ${M([[1, 4, -2], [0, 3, 5]])}. Donner la dimension de A et les coefficients a<sub>12</sub>, a<sub>23</sub> et a<sub>21</sub>.`,
      c: `A a 2 lignes et 3 colonnes : <b>2 × 3</b>. a<sub>12</sub> = <b>4</b> (ligne 1, colonne 2), a<sub>23</sub> = <b>5</b> et a<sub>21</sub> = <b>0</b>.` },
    { id: "m2", niv: 1, titre: "Somme, différence, multiple", q: `A = ${M([[1, 2], [3, 4]])} et B = ${M([[0, -1], [5, 2]])}. Calculer A + B, A − B et 3A.`,
      c: `A + B = ${M([[1, 1], [8, 6]])} ; A − B = ${M([[1, 3], [-2, 2]])} ; 3A = ${M([[3, 6], [9, 12]])}.` },
    { id: "m3", niv: 2, titre: "Produits possibles", q: `A est de taille 2 × 3, B de taille 3 × 2 et C de taille 2 × 2. Quels produits sont possibles parmi AB, BA, AC, CA ? Donner leur taille.`,
      c: `Un produit est possible quand le nombre de colonnes de la première matrice est égal au nombre de lignes de la seconde.<br>AB : <b>2 × 2</b>. BA : <b>3 × 3</b>. AC : <b>impossible</b> (3 ≠ 2). CA : <b>2 × 3</b>.` },
    { id: "m4", niv: 2, titre: "Produit 2×3 par 3×2", q: `Calculer AB avec A = ${M([[1, 2, 0], [-1, 1, 3]])} et B = ${M([[2, 1], [0, -1], [1, 4]])}.`,
      c: `Ligne 1 : (1×2 + 2×0 + 0×1 ; 1×1 + 2×(−1) + 0×4) = (2 ; −1).<br>Ligne 2 : (−1×2 + 1×0 + 3×1 ; −1×1 + 1×(−1) + 3×4) = (1 ; 10).<br>AB = ${M([[2, -1], [1, 10]])}.` },
    { id: "m5", niv: 2, titre: "Puissances d'une matrice", q: `A = ${M([[1, 1], [0, 1]])}. Calculer A², A³ et conjecturer Aⁿ.`,
      c: `A² = ${M([[1, 2], [0, 1]])} ; A³ = ${M([[1, 3], [0, 1]])}. Conjecture : <b>Aⁿ = ${M([[1, "n"], [0, 1]])}</b>.` },
    { id: "m6", niv: 2, titre: "Inverse d'une matrice 2×2", q: `Calculer l'inverse de A = ${M([[4, 7], [2, 4]])}, puis vérifier.`,
      c: `det A = 4×4 − 7×2 = 2 ≠ 0, donc A est inversible et A<sup>−1</sup> = ½ ${M([[4, -7], [-2, 4]])} = ${M([[2, -3.5], [-1, 2]])}.<br>Vérification : A × A<sup>−1</sup> = ${M([[1, 0], [0, 1]])} = I.` },
    { id: "m7", niv: 3, titre: "Résoudre un système", q: `Résoudre le système 2x + y = 5 et x + y = 3 en l'écrivant sous la forme AX = B.`,
      c: `A = ${M([[2, 1], [1, 1]])}, X = ${M([["x"], ["y"]])}, B = ${M([[5], [3]])}. det A = 1, donc A<sup>−1</sup> = ${M([[1, -1], [-1, 2]])}.<br>X = A<sup>−1</sup>B = ${M([[5 - 3], [-5 + 6]])} : <b>x = 2 et y = 1</b>.` },
    { id: "m8", niv: 2, titre: "Le produit n'est pas commutatif", q: `A = ${M([[0, 1], [0, 0]])} et B = ${M([[0, 0], [1, 0]])}. Calculer AB et BA.`,
      c: `AB = ${M([[1, 0], [0, 0]])} et BA = ${M([[0, 0], [0, 1]])}. Donc <b>AB ≠ BA</b>.` },
    { id: "m9", niv: 2, titre: "Produit booléen", q: `Calculer le produit booléen A ⊙ B avec A = ${M([[1, 0, 1], [0, 1, 0], [1, 1, 0]])} et B = ${M([[0, 1, 0], [1, 0, 0], [0, 0, 1]])} (1 + 1 = 1).`,
      c: `A ⊙ B = ${M(bmul([[1, 0, 1], [0, 1, 0], [1, 1, 0]], [[0, 1, 0], [1, 0, 0], [0, 0, 1]]))}. Par exemple, la ligne 1 est le OU des lignes 1 et 3 de B, car a<sub>11</sub> = a<sub>13</sub> = 1.` },
    { id: "m10", niv: 3, titre: "Matrice d'adjacence et chemins", q: `Un graphe a 4 sommets A, B, C, D et les arcs A→B, A→C, B→C, B→D, C→D, D→A.<br>1. Écrire sa matrice d'adjacence M.<br>2. Calculer M².<br>3. Combien y a-t-il de chemins de longueur 2 de A vers D ? Lesquels ?`,
      c: `1. M = ${M([[0, 1, 1, 0], [0, 0, 1, 1], [0, 0, 0, 1], [1, 0, 0, 0]])}<br>2. M² = ${M(mul([[0, 1, 1, 0], [0, 0, 1, 1], [0, 0, 0, 1], [1, 0, 0, 0]], [[0, 1, 1, 0], [0, 0, 1, 1], [0, 0, 0, 1], [1, 0, 0, 0]]))}<br>3. Le coefficient ligne A, colonne D vaut <b>2</b> : A → B → D et A → C → D.` },
    { id: "m11", niv: 3, titre: "Chiffrement de Hill", q: `On chiffre les paires de lettres (x<sub>1</sub>, x<sub>2</sub>) avec Y = AX modulo 26, où A = ${M([[3, 2], [1, 1]])} et A = 0, …, Z = 25.<br>1. Chiffrer GO.<br>2. Calculer A<sup>−1</sup> et vérifier en déchiffrant.`,
      c: `1. G = 6, O = 14 : y<sub>1</sub> = 3×6 + 2×14 = 46 ≡ 20 → U ; y<sub>2</sub> = 6 + 14 = 20 → U. GO devient <b>UU</b>.<br>2. det A = 3 − 2 = 1, donc A<sup>−1</sup> = ${M([[1, -2], [-1, 3]])}. Avec (20, 20) : x<sub>1</sub> = 20 − 40 = −20 ≡ 6 → G ; x<sub>2</sub> = −20 + 60 = 40 ≡ 14 → O ✔.` },
    { id: "m12", niv: 1, titre: "Application — calcul de factures", q: `Deux agences commandent des câbles (10 €), des switchs (20 €) et des adaptateurs (5 €). Les quantités sont données par Q = ${M([[2, 1, 0], [1, 3, 2]])} (une ligne par agence) et les prix par P = ${M([[10], [20], [5]])}.<br>Calculer QP et interpréter.`,
      c: `QP = ${M([[2 * 10 + 1 * 20 + 0], [10 + 60 + 10]])} : l'agence 1 paie <b>40 €</b> et l'agence 2 paie <b>80 €</b>.` },
  ],
  generes: [
    { id: "gm1", niv: 1, titre: "Combinaison de matrices", gen() {
        const A = randM(2, 2, -4, 5), B = randM(2, 2, -4, 5), a = pick([2, 3, -1]), b = pick([1, 2, -2]);
        const Rm = A.map((r, i) => r.map((v, j) => a * v + b * B[i][j]));
        return { q: `A = ${M(A)} et B = ${M(B)}. Calculer ${a === -1 ? "−" : a}A ${b < 0 ? "−" : "+"} ${Math.abs(b) === 1 ? "" : Math.abs(b)}B.`, c: `On calcule terme à terme : ${M(Rm)}.` };
    } },
    { id: "gm2", niv: 2, titre: "Produit de deux matrices 2×2", gen() {
        const A = randM(2, 2, -3, 4), B = randM(2, 2, -3, 4), AB = mul(A, B), BA = mul(B, A);
        const det = (X, Y, i, j) => `${X[i][0]}×${Y[0][j] < 0 ? "(" + Y[0][j] + ")" : Y[0][j]} + ${X[i][1]}×${Y[1][j] < 0 ? "(" + Y[1][j] + ")" : Y[1][j]}`;
        return { q: `A = ${M(A)} et B = ${M(B)}. Calculer AB et BA. Que remarque-t-on ?`,
          c: `AB = ${M(AB)} (par exemple, le coefficient (1,1) vaut ${det(A, B, 0, 0)} = ${AB[0][0]}).<br>BA = ${M(BA)}.<br>${JSON.stringify(AB) === JSON.stringify(BA) ? "Ici AB = BA, mais c'est un cas particulier." : "<b>AB ≠ BA</b> : le produit n'est pas commutatif."}` };
    } },
    { id: "gm3", niv: 2, titre: "Produit 2×3 par 3×2", gen() {
        const A = randM(2, 3, -2, 4), B = randM(3, 2, -2, 4), P = mul(A, B);
        const p = v => v < 0 ? `(${v})` : v;
        const det = [0, 1].map(i => [0, 1].map(j => `c<sub>${i + 1}${j + 1}</sub> = ${A[i].map((v, k) => `${v}×${p(B[k][j])}`).join(" + ")} = ${P[i][j]}`).join("<br>")).join("<br>");
        return { q: `Calculer AB avec A = ${M(A)} et B = ${M(B)}. Quelle est sa taille ?`, c: `(2 × 3)(3 × 2) donne une matrice <b>2 × 2</b>.<br>${det}<br>AB = ${M(P)}.` };
    } },
    { id: "gm4", niv: 2, titre: "Inverse d'une matrice 2×2", gen() {
        let A, d; do { A = randM(2, 2, -3, 6); d = A[0][0] * A[1][1] - A[0][1] * A[1][0]; } while (Math.abs(d) !== 1 || A.flat().filter(v => v === 0).length > 1);
        const p = v => v < 0 ? `(${v})` : v;
        const inv = [[A[1][1] * d, -A[0][1] * d], [-A[1][0] * d, A[0][0] * d]].map(r => r.map(v => v + 0));
        return { q: `Montrer que A = ${M(A)} est inversible et calculer A<sup>−1</sup>. Vérifier.`,
          c: `det A = ${A[0][0]}×${p(A[1][1])} − ${p(A[0][1])}×${p(A[1][0])} = <b>${d}</b> ≠ 0, donc A est inversible.<br>A<sup>−1</sup> = ${d === 1 ? "" : "−"}${M([[A[1][1], -A[0][1]], [-A[1][0], A[0][0]]].map(r => r.map(v => v + 0)))} = ${M(inv)}.<br>Vérification : A × A<sup>−1</sup> = ${M(mul(A, inv))} = I ✔.` };
    } },
    { id: "gm5", niv: 2, titre: "Produit booléen 3×3", gen() {
        const A = randM(3, 3, 0, 1), B = randM(3, 3, 0, 1);
        return { q: `Calculer le produit booléen A ⊙ B avec A = ${M(A)} et B = ${M(B)}.`, c: `On calcule comme un produit normal, avec 1 + 1 = 1 :<br>A ⊙ B = ${M(bmul(A, B))}.<br>Astuce : la ligne i du résultat est le OU des lignes de B dont le numéro correspond à un 1 de la ligne i de A.` };
    } },
    { id: "gm6", niv: 3, titre: "Matrice d'adjacence et chemins de longueur 2", gen() {
        let A, M2, cand; do { A = randGraph(4, 0.4); M2 = mul(A, A); cand = []; M2.forEach((r, i) => r.forEach((v, j) => v > 0 && cand.push([i, j]))); } while (!cand.length);
        const [x, y] = pick(cand), via = [0, 1, 2, 3].filter(k => A[x][k] && A[k][y]);
        const arcs = []; A.forEach((r, i) => r.forEach((v, j) => v && arcs.push(`${LET[i]}→${LET[j]}`)));
        return { q: `Un graphe a pour sommets A, B, C, D et pour arcs : ${arcs.join(", ")}.<br>1. Écrire sa matrice d'adjacence M.<br>2. Calculer M².<br>3. Combien y a-t-il de chemins de longueur 2 de ${LET[x]} vers ${LET[y]} ? Les écrire.`,
          c: `1. M = ${M(A)}<br>2. M² = ${M(M2)}<br>3. Le coefficient (${LET[x]}, ${LET[y]}) de M² vaut <b>${M2[x][y]}</b> : ${via.map(k => `${LET[x]} → ${LET[k]} → ${LET[y]}`).join(" ; ")}.` };
    } },
  ]
};

/* ============================ 5. GRAPHES ORIENTÉS ============================ */
CH.graphes = {
  ecrits: [
    { id: "g1", niv: 1, titre: "Vocabulaire", q: `Un graphe G a pour sommets 1, 2, 3, 4 et pour arcs : 1→2, 2→3, 3→1, 3→3, 2→4.<br>a) Donner les successeurs de 2 et les prédécesseurs de 3.<br>b) G a-t-il une boucle ? un circuit ?<br>c) Donner le demi-degré extérieur d<sup>+</sup> de chaque sommet.`,
      c: `a) Successeurs de 2 : <b>{3, 4}</b>. Prédécesseurs de 3 : <b>{2, 3}</b>.<br>b) Il y a une boucle sur 3 (l'arc 3→3) et un circuit : <b>1 → 2 → 3 → 1</b>.<br>c) d<sup>+</sup>(1) = 1, d<sup>+</sup>(2) = 2, d<sup>+</sup>(3) = 2, d<sup>+</sup>(4) = 0. La somme fait 5, c'est le nombre d'arcs.` },
    { id: "g2", niv: 1, titre: "Représentations d'un graphe", q: `Pour le graphe précédent (1→2, 2→3, 3→1, 3→3, 2→4), donner le tableau des successeurs puis la matrice d'adjacence.`,
      c: `${T(["Sommet", "1", "2", "3", "4"], [["Successeurs", "2", "3, 4", "1, 3", "—"]])}M = ${M([[0, 1, 0, 0], [0, 0, 1, 1], [1, 0, 1, 0], [0, 0, 0, 0]])}` },
    { id: "g3", niv: 2, titre: "Chemins", q: `Toujours avec ce graphe : donner tous les chemins de longueur 2 issus du sommet 1. Existe-t-il un chemin de longueur 3 de 1 vers 1 ?`,
      c: `Chemins de longueur 2 issus de 1 : <b>1 → 2 → 3</b> et <b>1 → 2 → 4</b>.<br>Oui : <b>1 → 2 → 3 → 1</b> (c'est le circuit).` },
    { id: "g4", niv: 2, titre: "Niveaux", q: `Déterminer les niveaux du graphe défini par ses successeurs : A : {B, C} ; B : {E} ; C : {D, E} ; D : {F} ; E : {F} ; F : ∅.`,
      c: `Prédécesseurs : A : ∅ ; B : A ; C : A ; D : C ; E : B, C ; F : D, E.<br>Niveau 0 : <b>A</b>. On retire A : niveau 1 : <b>B, C</b>. Ensuite, niveau 2 : <b>D, E</b>. Enfin, niveau 3 : <b>F</b>.` },
    { id: "g5", niv: 2, titre: "Niveaux et circuit", q: `Peut-on calculer les niveaux du graphe 1→2, 2→3, 3→1, 3→4 ? Expliquer.`,
      c: `Non. Le seul sommet qui pourrait être au niveau 0 n'existe pas : 1, 2 et 3 ont chacun un prédécesseur, et ils forment le <b>circuit 1 → 2 → 3 → 1</b>. On ne peut décomposer en niveaux qu'un graphe <b>sans circuit</b>.` },
    { id: "g6", niv: 2, titre: "Fermeture transitive (Roy-Warshall)", q: `G a pour arcs 1→2, 2→3, 3→4, 4→2. Déterminer le tableau des successeurs de sa fermeture transitive Ĝ.`,
      c: (() => { const A = [[0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1], [0, 1, 0, 0]], C = warshall(A); return `${T(["Sommet", "1", "2", "3", "4"], [["Successeurs dans Ĝ", ...C.map(r => setTxt(succ([r], 0), "1234"))]])}Explication : depuis 2, on atteint 3, 4, puis de nouveau 2 grâce au circuit 2 → 3 → 4 → 2. Les sommets 2, 3 et 4 s'atteignent donc tous entre eux, eux-mêmes compris. 1 atteint 2, 3 et 4, mais aucun chemin ne revient vers 1.<br>Matrice de Ĝ : ${M(C)}`; })() },
    { id: "g7", niv: 3, titre: "SISR — Ordre d'installation de paquets", q: `Pour installer un serveur web, on doit respecter ces dépendances : openssl dépend de libc et zlib ; pcre dépend de libc ; nginx dépend de openssl et pcre.<br>1. Représenter la situation par un graphe orienté (arc du paquet requis vers le paquet qui en dépend).<br>2. Déterminer les niveaux et proposer un ordre d'installation.`,
      c: `1. Arcs : libc → openssl, zlib → openssl, libc → pcre, openssl → nginx, pcre → nginx.<br>2. Niveau 0 : <b>libc, zlib</b>. Niveau 1 : <b>openssl, pcre</b>. Niveau 2 : <b>nginx</b>.<br>Ordre possible : libc, zlib, openssl, pcre, nginx.` },
    { id: "g8", niv: 2, titre: "MPM — projet simple", q: `${T(["Tâche", "A", "B", "C", "D", "E"], [["Durée (j)", 2, 4, 3, 2, 1], ["Antériorité", "—", "A", "A", "B", "C, D"]])}Calculer les dates au plus tôt et au plus tard, les marges totales, la durée du projet et le chemin critique.`,
      c: (() => { const d = [2, 4, 3, 2, 1], P = [[], [0], [0], [1], [2, 3]], r = mpm(d, P); return mpmTable("ABCDE", d, P, r, false) + `t(E) = max(2 + 3 ; 6 + 2) = 8. Le projet dure <b>${r.fin} jours</b>. Chemin critique : <b>${r.paths.map(p => p.map(i => "ABCDE"[i]).join(" → ")).join(" et ")}</b>. C a ${r.T[2] - r.t[2]} jours de marge.`; })() },
    { id: "g9", niv: 3, titre: "MPM — deux chemins critiques et marge libre", q: `${T(["Tâche", "A", "B", "C", "D", "E", "F"], [["Durée (j)", 4, 3, 2, 5, 3, 2], ["Antériorité", "—", "—", "A", "A, B", "C", "D, E"]])}1. Calculer t, T, les marges totales et la durée du projet.<br>2. Donner le ou les chemins critiques.<br>3. Calculer la marge libre de B.`,
      c: (() => { const d = [4, 3, 2, 5, 3, 2], P = [[], [], [0], [0, 1], [2], [3, 4]], r = mpm(d, P); return mpmTable("ABCDEF", d, P, r, true) + `1. Le projet dure <b>${r.fin} jours</b>.<br>2. Chemins critiques : <b>${r.paths.map(p => p.map(i => "ABCDEF"[i]).join(" → ")).join("</b> et <b>")}</b>.<br>3. ML(B) = t(D) − (t(B) + 3) = 4 − 3 = <b>1 jour</b>.`; })() },
    { id: "g10", niv: 2, titre: "Interpréter un retard", q: `Dans le projet A(2), B(4, après A), C(3, après A), D(2, après B), E(1, après C et D), la tâche C prend du retard. À partir de combien de jours de retard le projet est-il décalé ? Et si c'est B qui prend 1 jour de retard ?`,
      c: `C a une marge totale de 3 jours : le projet n'est retardé qu'<b>à partir de 4 jours</b> de retard sur C.<br>B est critique (marge nulle) : 1 jour de retard sur B retarde le projet d'<b>1 jour</b>.` },
    { id: "g11", niv: 3, titre: "Fermeture transitive par les matrices", q: `G a pour arcs A→B, B→C, C→A, C→D. Calculer M, M<sup>[2]</sup> et M<sup>[3]</sup> (produits booléens), puis la matrice de la fermeture transitive M ⊕ M<sup>[2]</sup> ⊕ M<sup>[3]</sup> ⊕ M<sup>[4]</sup>.`,
      c: (() => { const A = [[0, 1, 0, 0], [0, 0, 1, 0], [1, 0, 0, 1], [0, 0, 0, 0]], A2 = bmul(A, A), A3 = bmul(A2, A); return `M = ${M(A)} M<sup>[2]</sup> = ${M(A2)} M<sup>[3]</sup> = ${M(A3)}<br>Fermeture : ${M(warshall(A))}<br>A, B et C s'atteignent tous entre eux (circuit A → B → C → A) et atteignent D. D n'a aucun successeur.`; })() },
  ],
  generes: [
    { id: "gg1", niv: 1, titre: "Successeurs, prédécesseurs et matrice", gen() {
        const n = R(4, 5), A = randGraph(n, 0.35); const arcs = []; A.forEach((r, i) => r.forEach((v, j) => v && arcs.push(`${LET[i]}→${LET[j]}`)));
        return { q: `Un graphe a pour sommets ${LET.slice(0, n).split("").join(", ")} et pour arcs : ${arcs.join(", ")}.<br>Donner le tableau des successeurs, celui des prédécesseurs et la matrice d'adjacence.`,
          c: `${T(["Sommet", ...LET.slice(0, n).split("")], [["Successeurs", ...[...Array(n).keys()].map(i => setTxt(succ(A, i)))], ["Prédécesseurs", ...[...Array(n).keys()].map(j => setTxt(pred(A, j)))]])}M = ${M(A)}` };
    } },
    { id: "gg2", niv: 2, titre: "Niveaux d'un graphe sans circuit", gen() {
        const n = R(6, 8), A = randDAG(n), lv = niveaux(A);
        return { q: `Déterminer les niveaux du graphe défini par le tableau des prédécesseurs suivant :${T(["Sommet", ...LET.slice(0, n).split("")], [["Prédécesseurs", ...[...Array(n).keys()].map(j => setTxt(pred(A, j)))]])}`,
          c: lv.map((l, k) => `Niveau ${k} : <b>${l.sort((x, y) => x - y).map(i => LET[i]).join(", ")}</b>${k === 0 ? " (aucun prédécesseur)" : " (tous leurs prédécesseurs sont aux niveaux précédents)"}`).join("<br>") };
    } },
    { id: "gg3", niv: 2, titre: "Fermeture transitive", gen() {
        const n = R(4, 5), A = randGraph(n, 0.3), C = warshall(A), arcs = []; A.forEach((r, i) => r.forEach((v, j) => v && arcs.push(`${LET[i]}→${LET[j]}`)));
        return { q: `G a pour sommets ${LET.slice(0, n).split("").join(", ")} et pour arcs : ${arcs.join(", ")}.<br>Avec l'algorithme de Roy-Warshall, déterminer les successeurs de chaque sommet dans la fermeture transitive Ĝ.`,
          c: `${T(["Sommet", ...LET.slice(0, n).split("")], [["Successeurs dans G", ...[...Array(n).keys()].map(i => setTxt(succ(A, i)))], ["Successeurs dans Ĝ", ...[...Array(n).keys()].map(i => `<b>${setTxt(succ(C, i))}</b>`)]])}Matrice de Ĝ : ${M(C)}<br>Méthode : pour chaque sommet k, chaque prédécesseur de k reçoit tous les successeurs de k.` };
    } },
    { id: "gg4", niv: 3, titre: "Ordonnancement MPM", gen() {
        const n = R(6, 8), names = LET.slice(0, n), d = Array.from({ length: n }, () => R(1, 6));
        const P = [[]]; for (let j = 1; j < n; j++) { const k = j < 2 ? R(0, 1) : R(1, Math.min(2, j)); P.push(shuf([...Array(j).keys()]).slice(0, k).sort()); }
        const r = mpm(d, P);
        return { q: `Un projet comporte les tâches suivantes.${T(["Tâche", ...names.split("")], [["Durée (j)", ...d], ["Antériorité", ...P.map(p => p.length ? p.map(i => names[i]).join(", ") : "—")]])}1. Calculer les dates au plus tôt et au plus tard de chaque tâche.<br>2. En déduire la durée minimale du projet.<br>3. Calculer les marges totales et libres. Donner le ou les chemins critiques.`,
          c: `${mpmTable(names, d, P, r, true)}2. Durée minimale : <b>${r.fin} jours</b>.<br>3. Chemin${r.paths.length > 1 ? "s" : ""} critique${r.paths.length > 1 ? "s" : ""} : <b>${r.paths.map(p => p.map(i => names[i]).join(" → ")).join("</b> ; <b>")}</b>.<br>Rappel : t = max(t prédécesseur + durée prédécesseur) ; T = min(T successeur) − durée ; marge totale = T − t ; marge libre = min(t successeurs) − (t + durée).` };
    } },
    { id: "gg5", niv: 2, titre: "Chemins de longueur 3 (M³)", gen() {
        let A, M3, cand; do { A = randGraph(4, 0.4); M3 = mul(mul(A, A), A); cand = []; M3.forEach((r, i) => r.forEach((v, j) => v > 0 && cand.push([i, j]))); } while (!cand.length);
        const [x, y] = pick(cand), paths = [];
        for (let a = 0; a < 4; a++) for (let b = 0; b < 4; b++) if (A[x][a] && A[a][b] && A[b][y]) paths.push(`${LET[x]} → ${LET[a]} → ${LET[b]} → ${LET[y]}`);
        return { q: `La matrice d'adjacence d'un graphe de sommets A, B, C, D est M = ${M(A)}.<br>Calculer M³. Combien y a-t-il de chemins de longueur 3 de ${LET[x]} vers ${LET[y]} ? Les écrire.`,
          c: `M² = ${M(mul(A, A))} et M³ = ${M(M3)}.<br>Le coefficient (${LET[x]}, ${LET[y]}) de M³ vaut <b>${M3[x][y]}</b> : ${paths.join(" ; ")}.` };
    } },
  ]
};

return CH;
})();

/* Les 5 chapitres, dans l'ordre d'affichage */
const CHAPITRES = [
  { cle: "numeration", nom: "Numération", desc: "Bases 2, 8, 10 et 16, conversions, addition binaire, complément à 2, adressage IP" },
  { cle: "logique", nom: "Logique", desc: "Propositions, tables de vérité, implication, quantificateurs, ensembles" },
  { cle: "boole", nom: "Algèbre de Boole", desc: "Règles de calcul, De Morgan, tableaux de Karnaugh, circuits logiques" },
  { cle: "matrices", nom: "Matrices", desc: "Somme, produit, inverse 2×2, matrices booléennes, matrice d'adjacence" },
  { cle: "graphes", nom: "Graphes orientés", desc: "Vocabulaire, chemins, fermeture transitive, niveaux, ordonnancement MPM" },
];
