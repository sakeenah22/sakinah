/* Sakeenah card identity — no email, no password, no username.
   cardId  = the 6-digit card code; the permanent key for the learner's records (typed by people who cannot scan)
   token   = random 128-bit secret; the ONLY content of the QR ("SKN1:<token>")
   The QR never contains the name, scores, mistakes or history. */
(function(SK){
  const ST = () => SK.services.storage;
  const rand = n => { const a = new Uint8Array(n); if (window.crypto && crypto.getRandomValues) crypto.getRandomValues(a); else a.forEach((_,i)=>a[i]=Math.random()*256|0); return [...a].map(b=>b.toString(16).padStart(2,'0')).join(''); };
  const QR_PREFIX = 'SKN1:';
  function newCardId(){ for (let i=0;i<50;i++){ const c = String(100000 + (parseInt(rand(4),16) % 900000)); if (!ST().cardExists(c)) return c; } return String(Date.now()).slice(-6); }

  SK.services.profiles = {
    QR_PREFIX,
    create({name}={}){
      const card = ST().createCard({ cardId:newCardId(), token:rand(16), displayName:(name||'').trim().slice(0,30), createdAt:new Date().toISOString() });
      return { cardId:card.cardId, code:card.cardId, token:card.token, qr:QR_PREFIX+card.token, displayName:card.displayName };
    },
    /** QR text or 6-digit code -> { session:{cardId, token, code}, card } */
    resolve(input){
      const s = String(input||'').trim(); let cardId = null;
      if (s.startsWith(QR_PREFIX)) cardId = ST().cardIdForToken(s.slice(QR_PREFIX.length));
      else if (/^\d{6}$/.test(s)) cardId = s;
      if (!cardId) return null;
      const prof = ST().loadProfile(cardId); if (!prof) return null;
      return { session:{ cardId, token:prof.card.token, code:cardId }, card:prof.card, journeys:prof.journeys };
    },
    lastDeviceToken(){ return ST().lastDeviceToken(); }
  };
})(window.SK);
