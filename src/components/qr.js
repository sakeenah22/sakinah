/* Minimal offline QR encoder (byte mode, error correction M, versions 1–6) — so the Sakeenah card renders its QR without a network. */
(function(SK){
  // [total codewords, ec per block, blocks group1, data per block g1, blocks g2, data per block g2]
  const SPEC = { 1:[26,10,1,16,0,0], 2:[44,16,1,28,0,0], 3:[70,26,1,44,0,0], 4:[100,18,2,32,0,0], 5:[134,24,2,43,0,0], 6:[172,16,4,27,0,0] };
  const ALIGN = { 1:[], 2:[6,18], 3:[6,22], 4:[6,26], 5:[6,30], 6:[6,34] };
  const EXP = new Array(512), LOG = new Array(256);
  (() => { let x = 1; for (let i = 0; i < 255; i++){ EXP[i] = x; LOG[x] = i; x <<= 1; if (x & 256) x ^= 0x11d; } for (let i = 255; i < 512; i++) EXP[i] = EXP[i-255]; })();
  const mul = (a,b) => (a && b) ? EXP[LOG[a] + LOG[b]] : 0;
  function rsGen(n){ let g = [1]; for (let i = 0; i < n; i++){ const ng = new Array(g.length+1).fill(0); g.forEach((c,j) => { ng[j] ^= c; ng[j+1] ^= mul(c, EXP[i]); }); g = ng; } return g; }
  function rsEncode(data, n){ const g = rsGen(n), res = data.concat(new Array(n).fill(0));
    for (let i = 0; i < data.length; i++){ const f = res[i]; if (f) for (let j = 0; j < g.length; j++) res[i+j] ^= mul(g[j], f); } return res.slice(data.length); }
  function encode(text){
    const bytes = Array.from(new TextEncoder().encode(text));
    let ver = 1; while (ver <= 6){ const s = SPEC[ver]; const dataCw = s[2]*s[3] + s[4]*s[5]; if (4 + 8 + bytes.length*8 <= dataCw*8) break; ver++; }
    if (ver > 6) throw new Error('QR: text too long');
    const [total, ec, b1, d1, b2, d2] = SPEC[ver], dataCw = b1*d1 + b2*d2;
    const bits = []; const put = (v, n) => { for (let i = n-1; i >= 0; i--) bits.push((v >> i) & 1); };
    put(4,4); put(bytes.length, 8); bytes.forEach(b => put(b,8)); put(0, Math.min(4, dataCw*8 - bits.length));
    while (bits.length % 8) bits.push(0);
    const cw = []; for (let i = 0; i < bits.length; i += 8) cw.push(parseInt(bits.slice(i,i+8).join(''),2));
    for (let p = 0; cw.length < dataCw; p++) cw.push(p % 2 ? 0x11 : 0xEC);
    const blocks = []; let k = 0; for (let i = 0; i < b1; i++){ blocks.push(cw.slice(k, k+d1)); k += d1; } for (let i = 0; i < b2; i++){ blocks.push(cw.slice(k, k+d2)); k += d2; }
    const ecb = blocks.map(b => rsEncode(b, ec)); const out = [];
    for (let i = 0; i < Math.max(d1, d2); i++) blocks.forEach(b => { if (i < b.length) out.push(b[i]); });
    for (let i = 0; i < ec; i++) ecb.forEach(b => out.push(b[i]));
    // matrix
    const n = 17 + 4*ver, M = Array.from({length:n}, () => new Array(n).fill(null)), R = Array.from({length:n}, () => new Array(n).fill(false));
    const set = (r,c,v) => { M[r][c] = v; R[r][c] = true; };
    const finder = (r,c) => { for (let i = -1; i <= 7; i++) for (let j = -1; j <= 7; j++){ const y = r+i, x = c+j; if (y<0||x<0||y>=n||x>=n) continue;
      const on = (i>=0&&i<=6&&(j===0||j===6)) || (j>=0&&j<=6&&(i===0||i===6)) || (i>=2&&i<=4&&j>=2&&j<=4); set(y,x,on); } };
    finder(0,0); finder(0,n-7); finder(n-7,0);
    for (let i = 8; i < n-8; i++){ set(6,i,i%2===0); set(i,6,i%2===0); }
    const al = ALIGN[ver]; al.forEach(r => al.forEach(c => { if (R[r][c]) return; for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) set(r+i, c+j, Math.max(Math.abs(i),Math.abs(j)) !== 1); }));
    set(n-8, 8, true);                                               // dark module
    for (let i = 0; i < 9; i++){ if (!R[8][i]) R[8][i] = true; if (!R[i][8]) R[i][8] = true; }   // reserve format areas
    for (let i = 0; i < 8; i++){ R[8][n-1-i] = true; R[n-1-i][8] = true; }
    // place data (zigzag)
    const dbits = []; out.forEach(b => { for (let i = 7; i >= 0; i--) dbits.push((b >> i) & 1); });
    let bi = 0, up = true;
    for (let c = n-1; c > 0; c -= 2){ if (c === 6) c--;
      for (let t = 0; t < n; t++){ const r = up ? n-1-t : t;
        for (let d = 0; d < 2; d++){ const x = c-d; if (R[r][x]) continue; M[r][x] = bi < dbits.length ? !!dbits[bi] : false; bi++; } }
      up = !up; }
    // mask 0 ((r+c)%2==0) on data modules, then format info for EC level M (01) + mask 000
    // recompute which cells are data: cells not part of function patterns
    const F = Array.from({length:n}, () => new Array(n).fill(false));
    const markF = (r,c) => { if (r>=0&&c>=0&&r<n&&c<n) F[r][c] = true; };
    [[0,0],[0,n-7],[n-7,0]].forEach(([r,c]) => { for (let i=-1;i<=7;i++) for (let j=-1;j<=7;j++) markF(r+i,c+j); });
    for (let i = 0; i < n; i++){ markF(6,i); markF(i,6); }
    al.forEach(r => al.forEach(c => { if ((r<9&&c<9)||(r<9&&c>n-10)||(r>n-10&&c<9)) return; for (let i=-2;i<=2;i++) for (let j=-2;j<=2;j++) markF(r+i,c+j); }));
    markF(n-8,8); for (let i = 0; i < 9; i++){ markF(8,i); markF(i,8); } for (let i = 0; i < 8; i++){ markF(8,n-1-i); markF(n-1-i,8); }
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (!F[r][c] && (r + c) % 2 === 0) M[r][c] = !M[r][c];
    const data = (0 << 3) | 0;                                      // EC level M (format bits 00), mask 0
    let rem = data; for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >> 9) * 0x537);
    const f = ((data << 10) | rem) ^ 0x5412, fb = i => ((f >> i) & 1) === 1;
    for (let i = 0; i <= 5; i++) M[i][8] = fb(i);
    M[7][8] = fb(6); M[8][8] = fb(7); M[8][7] = fb(8);
    for (let i = 9; i < 15; i++) M[8][14-i] = fb(i);
    for (let i = 0; i < 8; i++) M[8][n-1-i] = fb(i);
    for (let i = 8; i < 15; i++) M[n-15+i][8] = fb(i);
    M[n-8][8] = true;
    return M;
  }
  /** draw a QR into a <canvas> (quiet zone 4 modules) */
  function canvas(text, size = 180, dark = '#063F3A', light = '#ffffff'){
    const m = encode(text), n = m.length, q = 4, scale = Math.floor(size / (n + 2*q)) || 1, px = scale * (n + 2*q);
    const cv = document.createElement('canvas'); cv.width = cv.height = px; const g = cv.getContext('2d');
    g.fillStyle = light; g.fillRect(0,0,px,px); g.fillStyle = dark;
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (m[r][c]) g.fillRect((c+q)*scale, (r+q)*scale, scale, scale);
    cv.style.width = cv.style.height = size + 'px'; return cv;
  }
  SK.qr = { encode, canvas };
})(window.SK);
