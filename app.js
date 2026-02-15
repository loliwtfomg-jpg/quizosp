/* =========================================
   QUIZ STRAŻACKI – ULTRA PRO (app.js)
   - 40 pytań + obrazki (img)
   - timer + zakończ
   - combo + bonus
   - ranking + podium + podgląd odpowiedzi
   - panel admina (bank pytań / reset)
   - panel dewelopera (3 klik w logo) – tylko wizualne ustawienia
========================================= */

(() => {
  "use strict";

  const BANK_KEY = "osp_quiz_bank_ultra_v1";
  const RANK_KEY = "osp_quiz_rank_ultra_v1";
  const DEV_KEY  = "osp_quiz_dev_ultra_v1";
  // Polyfill dla structuredClone (starsze przeglądarki / WebView)
  if (typeof window.structuredClone !== "function"){
    window.structuredClone = (obj)=> JSON.parse(JSON.stringify(obj));
  }

  /* =========================
     DOM
  ========================= */
  const $ = (id) => document.getElementById(id);

  // Music
  const music = $("bgMusic");
  const musicWidget = $("musicWidget");
  const musicMinBtn = $("musicMinBtn");
  const musicToggleBtn = $("musicToggleBtn");
  const musicVol = $("musicVol");

  // Admin
  const adminGear = $("adminGear");
  const adminCloseEdge = $("adminCloseEdge");
  const adminPanel = $("adminPanel");
  const adminPassword = $("adminPassword");
  const adminLoginBtn = $("adminLoginBtn");
  const loginSection = $("loginSection");
  const adminContent = $("adminContent");

  const resetBankBtn = $("resetBankBtn");
  const clearRankBtn = $("clearRankBtn");
  const clearHistoryBtn = $("clearHistoryBtn");

  const questionsList = $("questionsList");
  const bankCount = $("bankCount");
  const qCat = $("qCat");
  const newQ = $("newQ");
  const a1 = $("a1");
  const a2 = $("a2");
  const a3 = $("a3");
  const correctSel = $("correct");
  const qImgFile = $("qImgFile");
  const qImgPreview = $("qImgPreview");
  let editImgData = null;
  const saveQBtn = $("saveQBtn");
  const cancelEditBtn = $("cancelEditBtn");

  // Screens
  const startScreen = $("startScreen");
  const quizScreen = $("quizScreen");
  const resultScreen = $("resultScreen");

  // Game controls
  const playerName = $("playerName");
  const startBtn = $("startBtn");
  const trainingToggle = $("trainingToggle");
  const endBtn = $("endBtn");
  const nextPlayerBtn = $("nextPlayerBtn");

  // Quiz UI
  const qIndexEl = $("qIndex");
  const qTotalEl = $("qTotal");
  const timerEl = $("timer");
  const timePill = $("timePill");
  const categoryEl = $("category");
  const progressEl = $("progress");
  const questionArea = $("questionArea");
  const questionEl = $("question");
  const answersEl = $("answers");

  // Training mode
  const trainingPanel = $("trainingPanel");
  const trainingTitle = $("trainingTitle");
  const trainingBody = $("trainingBody");
  const trainingNextBtn = $("trainingNextBtn");

  const glowOk = $("glowOk");
  const glowBad = $("glowBad");

  const qImgWrap = $("qImgWrap");
  const qImg = $("qImg");

  const comboValueEl = $("comboValue");
  const bonusValueEl = $("bonusValue");
  const comboPop = $("comboPop");

  // Result UI
  const finalResult = $("finalResult");
  const rankBadge = $("rankBadge");
  const review = $("review");
  const countCorrect = $("countCorrect");
  const countBonus = $("countBonus");
  const countTotal = $("countTotal");
  const countPercent = $("countPercent");

  // Ranking + podium + history view
  const podiumStart = $("podiumStart");
  const podiumResult = $("podiumResult");
  const rankingList = $("rankingList");
  const rankingList2 = $("rankingList2");
  const historyView = $("historyView");
  const historyView2 = $("historyView2");

  // Confetti
  const confettiCanvas = $("confettiCanvas");
  const confCtx = confettiCanvas.getContext("2d");

  /* =========================
     Helpers
  ========================= */
  function safeParse(s){ try{ return JSON.parse(s); } catch { return null; } }
  function escapeHtml(str){
    return String(str ?? "")
      .replaceAll("&","&amp;")
      .replaceAll("<","&lt;")
      .replaceAll(">","&gt;")
      .replaceAll("\"", "&quot;")
      .replaceAll("'","&#039;");
  }
  function clamp(n, a, b){ return Math.max(a, Math.min(b, n)); }
  function shuffle(arr){
    for (let i = arr.length - 1; i > 0; i--){
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }


  /* =========================
     Mini-ikonki do pytań (offline)
     - Jeśli pytanie ma imgData (dodane w panelu admina), używamy go.
     - Jeśli nie, pokazujemy domyślną ikonkę na podstawie kategorii.
  ========================= */
  const ICONS = {
    default: 'data:image/svg+xml;utf8,' + encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="360" height="220" viewBox="0 0 360 220">
        <defs>
          <linearGradient id="g" x1="0" x2="1">
            <stop offset="0" stop-color="#b71c1c"/>
            <stop offset="1" stop-color="#e53935"/>
          </linearGradient>
        </defs>
        <rect width="360" height="220" rx="22" fill="url(#g)"/>
        <circle cx="82" cy="110" r="48" fill="rgba(255,255,255,0.22)"/>
        <path d="M92 76c-18 10-28 28-28 48 0 24 16 44 38 50-4-8-6-16-6-24 0-16 8-30 18-40 10 10 18 24 18 40 0 8-2 16-6 24 22-6 38-26 38-50 0-20-10-38-28-48-6 10-14 18-22 24-8-6-16-14-22-24z" fill="#fff"/>
        <text x="180" y="132" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="700" fill="rgba(255,255,255,0.92)">OSP</text>
      </svg>`),

    kpp: 'data:image/svg+xml;utf8,' + encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="360" height="220" viewBox="0 0 360 220">
        <rect width="360" height="220" rx="22" fill="#0d47a1"/>
        <rect x="40" y="50" width="280" height="120" rx="18" fill="rgba(255,255,255,0.18)"/>
        <path d="M180 76v68M146 110h68" stroke="#fff" stroke-width="18" stroke-linecap="round"/>
        <text x="180" y="196" text-anchor="middle" font-family="Arial" font-size="18" fill="rgba(255,255,255,0.9)">Pierwsza pomoc</text>
      </svg>`),

    sprzet: 'data:image/svg+xml;utf8,' + encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="360" height="220" viewBox="0 0 360 220">
        <rect width="360" height="220" rx="22" fill="#263238"/>
        <path d="M78 150c38-66 74-78 116-36 34-38 70-26 94 36" fill="none" stroke="#fff" stroke-width="16" stroke-linecap="round"/>
        <path d="M120 150h120" stroke="#fff" stroke-width="16" stroke-linecap="round"/>
        <text x="180" y="196" text-anchor="middle" font-family="Arial" font-size="18" fill="rgba(255,255,255,0.9)">Sprzęt</text>
      </svg>`),

    organizacja: 'data:image/svg+xml;utf8,' + encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="360" height="220" viewBox="0 0 360 220">
        <rect width="360" height="220" rx="22" fill="#1b5e20"/>
        <path d="M120 150v-52l60-34 60 34v52" fill="none" stroke="#fff" stroke-width="12" stroke-linejoin="round"/>
        <path d="M150 150v-34h60v34" fill="none" stroke="#fff" stroke-width="12" stroke-linejoin="round"/>
        <text x="180" y="196" text-anchor="middle" font-family="Arial" font-size="18" fill="rgba(255,255,255,0.9)">Organizacja</text>
      </svg>`),
  };

  function getCategoryIcon(cat){
    const c = String(cat || "").toLowerCase();
    if (/(kpp|pierwsz|ratownictwo med|resuscyt|opatr)/.test(c)) return ICONS.kpp;
    if (/(sprz|wąż|hydrant|gaśnic|armatur|pompa|drab)/.test(c)) return ICONS.sprzet;
    if (/(organiz|stopni|ustaw|przepisy|zastęp|dowód)/.test(c)) return ICONS.organizacja;
    return ICONS.default;
  }

  function getQuestionImage(q){
    if (q && q.imgData) return q.imgData; // wgrany w adminie (Base64)
    if (q && typeof q.img === "string" && q.img.trim()) return q.img.trim(); // ścieżka do pliku (np. images/q01.png)
    return getCategoryIcon(q?.cat);
  }

  /* =========================
     Default bank (40)
     img: images/q01.png ... images/q40.png (możesz podmienić w adminie)
  ========================= */
  const defaultBank40 = [
    {cat:"Pożary", q:"Najczęstszą przyczyną pożarów w budynkach mieszkalnych jest:", a:["wyładowanie atmosferyczne","nieostrożność osób dorosłych przy posługiwaniu się ogniem","podpalenie"], c:1, img:"images/q01.png"},
    {cat:"Sprzęt", q:"Gaśnica proszkowa oznaczona symbolem ABC służy do gaszenia:", a:["tylko ciał stałych","tylko cieczy","ciał stałych, cieczy i gazów"], c:2, img:"images/q02.png"},
    {cat:"Organizacja", q:"Numer alarmowy do straży pożarnej to:", a:["997","998","999"], c:1, img:"images/q03.png"},
    {cat:"Sprzęt", q:"Hydrant wewnętrzny znajduje się:", a:["na ulicy","w budynku","tylko w remizie"], c:1, img:"images/q04.png"},
    {cat:"ODO", q:"Aparat ODO służy do:", a:["ochrony słuchu","ochrony dróg oddechowych","pomiaru temperatury"], c:1, img:"images/q05.png"},
    {cat:"Taktyka", q:"Pierwszą czynnością po przybyciu na miejsce zdarzenia jest:", a:["rozwinięcie linii gaśniczej","rozpoznanie sytuacji","podanie wody"], c:1, img:"images/q06.png"},
    {cat:"Taktyka", q:"Minimalna liczba strażaków do roty to:", a:["1","2","3"], c:1, img:"images/q07.png"},
    {cat:"Taktyka", q:"Prąd rozproszony stosuje się głównie do:", a:["gaszenia instalacji elektrycznych","chłodzenia gazów pożarowych","podawania piany"], c:1, img:"images/q08.png"},
    {cat:"KPP", q:"RKO u dorosłych to:", a:["15:2","30:2","5:1"], c:1, img:"images/q09.png"},
    {cat:"Zagrożenia", q:"Tlenek węgla to gaz:", a:["bezbarwny i bezwonny","żółty","o silnym zapachu"], c:0, img:"images/q10.png"},
    {cat:"Prawo", q:"OSP działa na podstawie:", a:["Kodeksu cywilnego","Ustawy o ochronie przeciwpożarowej","Karty Nauczyciela"], c:1, img:"images/q11.png"},
    {cat:"BHP", q:"Hełm strażacki chroni przed:", a:["hałasem","urazami mechanicznymi i temperaturą","promieniowaniem UV"], c:1, img:"images/q12.png"},
    {cat:"Taktyka", q:"Pianę ciężką stosuje się do:", a:["gaszenia metali","gaszenia cieczy palnych","chłodzenia ścian"], c:1, img:"images/q13.png"},
    {cat:"Sprzęt", q:"Gaśnica śniegowa zawiera:", a:["wodę","CO₂","azot"], c:1, img:"images/q14.png"},
    {cat:"Dowodzenie", q:"Dowódcą akcji ratowniczej jest:", a:["najstarszy strażak","pierwszy przybyły kierowca","wyznaczony strażak z odpowiednimi kwalifikacjami"], c:2, img:"images/q15.png"},
    {cat:"Elektryka", q:"Prądu wody nie wolno podawać na:", a:["drewno","instalację pod napięciem","ścianę"], c:1, img:"images/q16.png"},
    {cat:"KPP", q:"AED służy do:", a:["podawania tlenu","defibrylacji","mierzenia ciśnienia"], c:1, img:"images/q17.png"},
    {cat:"Sprzęt", q:"Drabina nasadkowa składa się z:", a:["1 przęsła","2 przęseł","3 przęseł"], c:2, img:"images/q18.png"},
    {cat:"Organizacja", q:"Syrena alarmowa w OSP oznacza:", a:["zbiórkę","koniec akcji","ćwiczenia"], c:0, img:"images/q19.png"},
    {cat:"Taktyka", q:"Teren akcji należy:", a:["pozostawić bez zabezpieczenia","zabezpieczyć i oznakować","opuścić po ugaszeniu"], c:1, img:"images/q20.png"},

    {cat:"Organizacja", q:"Paliwo w samochodzie pożarniczym sprawdza:", a:["dowódca","kierowca","każdy strażak"], c:1, img:"images/q21.png"},
    {cat:"Sprzęt", q:"Rękaw W-52 ma średnicę:", a:["52 mm","75 mm","25 mm"], c:0, img:"images/q22.png"},
    {cat:"Zagrożenia", q:"Największe zagrożenie w pożarze to:", a:["ogień","dym","hałas"], c:1, img:"images/q23.png"},
    {cat:"Organizacja", q:"Czas dojazdu w KSRG w obszarze miejskim to ok.:", a:["20 min","15 min","5 min"], c:1, img:"images/q24.png"},
    {cat:"Chemia", q:"Sorbent służy do:", a:["gaszenia","pochłaniania cieczy","chłodzenia"], c:1, img:"images/q25.png"},
    {cat:"Sprzęt", q:"Linia główna zasilająca to zwykle:", a:["W-25","W-52","W-75"], c:2, img:"images/q26.png"},
    {cat:"Zagrożenia", q:"Zatrucie CO objawia się często:", a:["kaszlem","bólem głowy","wysypką"], c:1, img:"images/q27.png"},
    {cat:"Sprzęt", q:"Gaśnica wodna NIE służy do:", a:["papieru","drewna","oleju"], c:2, img:"images/q28.png"},
    {cat:"Łączność", q:"Łączność radiowa powinna być:", a:["krótka i rzeczowa","długa","prywatna"], c:0, img:"images/q29.png"},
    {cat:"Organizacja", q:"Zastęp to minimum:", a:["3 osoby","6 osób","2 osoby"], c:1, img:"images/q30.png"},

    {cat:"Sprzęt", q:"Hydrant zewnętrzny ma najczęściej kolor:", a:["czerwony","zielony","czarny"], c:0, img:"images/q31.png"},
    {cat:"Sprzęt", q:"Motopompa służy do:", a:["tłoczenia wody","piany","powietrza"], c:0, img:"images/q32.png"},
    {cat:"Taktyka", q:"Prąd zwarty ma zasięg większy niż prąd:", a:["mgłowy","pianowy","rozproszony"], c:2, img:"images/q33.png"},
    {cat:"Sprzęt", q:"Rękaw W-75 stosuje się głównie do:", a:["natarcia","zasilania","odwadniania"], c:1, img:"images/q34.png"},
    {cat:"Sprzęt", q:"Koc gaśniczy służy do:", a:["gaszenia małych pożarów","chłodzenia","izolacji akustycznej"], c:0, img:"images/q35.png"},
    {cat:"ODO", q:"Butla ODO zawiera:", a:["tlen","sprężone powietrze","azot"], c:1, img:"images/q36.png"},
    {cat:"Taktyka", q:"Rozpoznanie obejmuje przede wszystkim:", a:["liczbę poszkodowanych","markę auta","kolor budynku"], c:0, img:"images/q37.png"},
    {cat:"Pożary", q:"Pożar klasy B dotyczy:", a:["gazów","cieczy","metali"], c:1, img:"images/q38.png"},
    {cat:"Taktyka", q:"Piana izoluje poprzez:", a:["chłodzenie","odcięcie tlenu","rozcieńczenie"], c:1, img:"images/q39.png"},
    {cat:"Wypadki", q:"Wypadek drogowy wymaga w pierwszej kolejności:", a:["zabezpieczenia miejsca","tylko gaszenia","wywiadu medialnego"], c:0, img:"images/q40.png"},
  ];
  /* =========================
     Bank load/save
  ========================= */
  let questionBank = safeParse(localStorage.getItem(BANK_KEY));
  if (!Array.isArray(questionBank) || questionBank.length === 0){
    questionBank = structuredClone(defaultBank40);
    localStorage.setItem(BANK_KEY, JSON.stringify(questionBank));
  }
  function persistBank(){ localStorage.setItem(BANK_KEY, JSON.stringify(questionBank)); }

  /* =========================
     AUDIO: SFX + Alarm siren
  ========================= */
  let audioCtx = null;
  function getCtx(){
    if (!audioCtx){
      const AC = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AC();
    }
    if (audioCtx.state === "suspended") audioCtx.resume().catch(()=>{});
    return audioCtx;
  }

  function beep(freq=440, dur=0.06, gain=0.04, type="sine"){
    const ctx = getCtx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.value = gain;
    o.connect(g); g.connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + dur);
  }

  function sfxCorrect(){ beep(740, 0.05, 0.06, "triangle"); beep(980, 0.06, 0.05, "triangle"); }
  function sfxWrong(){ beep(220, 0.08, 0.06, "sawtooth"); }
  function sfxCombo(){ beep(880, 0.05, 0.05, "square"); beep(1040, 0.06, 0.05, "square"); }
  function sfxSirenShort(){
    const ctx = getCtx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sawtooth";
    g.gain.value = 0.03;
    o.connect(g); g.connect(ctx.destination);
    const t = ctx.currentTime;
    o.frequency.setValueAtTime(520, t);
    o.frequency.linearRampToValueAtTime(980, t + 0.35);
    o.frequency.linearRampToValueAtTime(520, t + 0.7);
    o.start(t);
    o.stop(t + 0.72);
  }

  // Alarm mode oscillator
  let alarmOsc = null;
  let alarmGain = null;
  let alarmFlashEl = null;

  function startAlarmSiren(){
    const ctx = getCtx();
    stopAlarmSiren();

    alarmOsc = ctx.createOscillator();
    alarmGain = ctx.createGain();
    alarmOsc.type = "sawtooth";
    alarmGain.gain.value = 0.02;
    alarmOsc.connect(alarmGain);
    alarmGain.connect(ctx.destination);

    const t = ctx.currentTime;
    alarmOsc.frequency.setValueAtTime(520, t);

    // LFO-ish ramp loop (manual)
    let run = true;
    const step = () => {
      if (!run || !alarmOsc) return;
      const now = ctx.currentTime;
      alarmOsc.frequency.cancelScheduledValues(now);
      alarmOsc.frequency.setValueAtTime(520, now);
      alarmOsc.frequency.linearRampToValueAtTime(980, now + 0.4);
      alarmOsc.frequency.linearRampToValueAtTime(520, now + 0.8);
      setTimeout(step, 800);
    };

    alarmOsc.start();
    step();

    // Flash overlay
    if (!alarmFlashEl){
      alarmFlashEl = document.createElement("div");
      alarmFlashEl.className = "alarmFlash";
      document.body.appendChild(alarmFlashEl);
    }
  }

  function stopAlarmSiren(){
    if (alarmOsc){
      try{ alarmOsc.stop(); }catch{}
      try{ alarmOsc.disconnect(); }catch{}
      alarmOsc = null;
    }
    if (alarmGain){
      try{ alarmGain.disconnect(); }catch{}
      alarmGain = null;
    }
    if (alarmFlashEl){
      alarmFlashEl.remove();
      alarmFlashEl = null;
    }
  }

  /* =========================
     MUSIC widget
  ========================= */
  music.volume = Number(musicVol?.value ?? 0.15) || 0.15;

  musicToggleBtn.addEventListener("click", ()=>{
    getCtx(); // unlock
    if (music.paused) music.play().catch(()=>{});
    else music.pause();
  });

  musicVol.addEventListener("input", (e)=>{
    const vol = clamp(Number(e.target.value), 0, 0.5);
    music.volume = vol;
  });

  musicMinBtn.addEventListener("click", ()=>{
    musicWidget.classList.toggle("minimized");
  });

  /* =========================
     ADMIN panel
  ========================= */
  let adminLogged = false;
  let editIndex = null;

  function toggleAdmin(){
    adminPanel.classList.toggle("active");
    const active = adminPanel.classList.contains("active");
    adminCloseEdge.style.display = active ? "block" : "none";
    if (active && adminLogged) renderAdminList();

    // Autofocus hasła po otwarciu (żeby od razu można pisać)
    if (active && !adminLogged){
      setTimeout(()=>{
        try{
          adminPassword.focus();
          adminPassword.select?.();
        }catch{}
      }, 0);
    }
  }

  function loginAdmin(){
    getCtx();
    const pass = adminPassword.value;
    if (pass === "osp1234"){
      adminLogged = true;
      loginSection.style.display = "none";
      adminContent.style.display = "block";
      renderAdminList();
    } else {
      alert("Nieprawidłowe hasło.");
    }
  }

  adminGear.addEventListener("click", toggleAdmin);
  adminCloseEdge.addEventListener("click", toggleAdmin);
  adminLoginBtn.addEventListener("click", loginAdmin);
  adminPassword.addEventListener("keydown", (e)=>{ if (e.key === "Enter") loginAdmin(); });

  function fillFormFromQuestion(q){
    qCat.value = q.cat ?? "";
    newQ.value = q.q ?? "";
    a1.value = q.a?.[0] ?? "";
    a2.value = q.a?.[1] ?? "";
    a3.value = q.a?.[2] ?? "";
    correctSel.value = String(q.c ?? 0);
    editImgData = q.imgData ?? null;
    qImgFile.value = "";
    if (editImgData){ qImgPreview.style.display="block"; qImgPreview.src = editImgData; }
    else { qImgPreview.style.display="none"; qImgPreview.src=""; }
  }

  function clearForm(){
    qCat.value = "";
    newQ.value = "";
    a1.value = "";
    a2.value = "";
    a3.value = "";
    correctSel.value = "0";
    editImgData = null;
    qImgFile.value = "";
    qImgPreview.style.display="none";
    qImgPreview.src = "";
  }


  // Miniaturka pytania (offline) — wczytujemy plik i zapisujemy jako małe dataURL (żeby nie zapchać pamięci)
  function readImageAsDataURL(file){
    return new Promise((resolve, reject)=>{
      const r = new FileReader();
      r.onload = ()=> resolve(String(r.result || ""));
      r.onerror = ()=> reject(new Error("Nie udało się wczytać pliku."));
      r.readAsDataURL(file);
    });
  }

  async function resizeToThumb(dataUrl, maxW=420, maxH=260, quality=0.80){
    return new Promise((resolve)=>{
      const img = new Image();
      img.onload = ()=>{
        const ratio = Math.min(maxW/img.width, maxH/img.height, 1);
        const w = Math.max(1, Math.round(img.width*ratio));
        const h = Math.max(1, Math.round(img.height*ratio));
        const c = document.createElement("canvas");
        c.width = w; c.height = h;
        const ctx = c.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h);
        // JPEG jest lżejszy niż PNG dla zdjęć
        try{
          resolve(c.toDataURL("image/jpeg", quality));
        }catch(e){
          resolve(dataUrl); // fallback
        }
      };
      img.onerror = ()=> resolve(dataUrl);
      img.src = dataUrl;
    });
  }

  qImgFile.addEventListener("change", async ()=>{
    const f = qImgFile.files && qImgFile.files[0];
    if (!f){
      // bez zmian
      return;
    }
    const raw = await readImageAsDataURL(f);
    const thumb = await resizeToThumb(raw);
    editImgData = thumb;
    qImgPreview.style.display = "block";
    qImgPreview.src = thumb;
  });

  function cancelEdit(){
    editIndex = null;
    cancelEditBtn.style.display = "none";
    saveQBtn.textContent = "💾 Zapisz";
    clearForm();
  }

  function renderAdminList(){
    bankCount.innerHTML = `Liczba pytań w banku: <b>${questionBank.length}</b>`;
    questionsList.innerHTML = "";

    questionBank.forEach((q, idx)=>{
      const row = document.createElement("div");
      row.className = "adminRow";
      row.innerHTML = `
        <b>${idx+1}. ${escapeHtml(q.q)}</b>
        <div class="muted">Kategoria: ${escapeHtml(q.cat || "—")} | Poprawna: ${String.fromCharCode(65 + (q.c ?? 0))}</div>
        <div class="muted" style="margin-top:6px;">
          A) ${escapeHtml(q.a?.[0] ?? "")}<br>
          B) ${escapeHtml(q.a?.[1] ?? "")}<br>
          C) ${escapeHtml(q.a?.[2] ?? "")}
        </div>
        <div class="muted" style="margin-top:6px;">Obrazek: ${escapeHtml(q.img || "—")}</div>
        <div>
          <button class="miniBtn" data-edit="${idx}">✏ Edytuj</button>
          <button class="miniBtn danger" data-del="${idx}">🗑 Usuń</button>
        </div>
      `;
      questionsList.appendChild(row);
    });

    questionsList.querySelectorAll("[data-edit]").forEach(btn=>{
      btn.addEventListener("click", ()=>{
        const idx = Number(btn.getAttribute("data-edit"));
        editIndex = idx;
        fillFormFromQuestion(questionBank[idx]);
        cancelEditBtn.style.display = "inline-block";
        saveQBtn.textContent = "💾 Zapisz zmiany";
        adminPanel.scrollTo({ top: adminPanel.scrollHeight, behavior:"smooth" });
      });
    });

    questionsList.querySelectorAll("[data-del]").forEach(btn=>{
      btn.addEventListener("click", ()=>{
        const idx = Number(btn.getAttribute("data-del"));
        if (!confirm("Usunąć to pytanie?")) return;
        questionBank.splice(idx, 1);
        persistBank();
        renderAdminList();
      });
    });
  }

  cancelEditBtn.addEventListener("click", cancelEdit);

  saveQBtn.addEventListener("click", ()=>{
    const q = {
      cat: qCat.value.trim(),
      q: newQ.value.trim(),
      a: [a1.value.trim(), a2.value.trim(), a3.value.trim()],
      c: Number(correctSel.value),
      imgData: editImgData
    };

    if (!q.q || q.a.some(x=>!x)){
      alert("Uzupełnij treść pytania i odpowiedzi A/B/C.");
      return;
    }
    if (![0,1,2].includes(q.c)) q.c = 0;

    if (editIndex === null){
      questionBank.push(q);
    } else {
      questionBank[editIndex] = q;
    }

    persistBank();
    renderAdminList();
    cancelEdit();
  });

  resetBankBtn.addEventListener("click", ()=>{
    if (!confirm("Przywrócić bank 40 pytań?")) return;
    questionBank = structuredClone(defaultBank40);
    persistBank();
    renderAdminList();
    cancelEdit();
    alert("Przywrócono bank pytań.");
  });

  clearRankBtn.addEventListener("click", clearRanking);
  clearHistoryBtn.addEventListener("click", clearHistoryView);

  /* =========================
     QUIZ + COMBO
  ========================= */
  let quiz = [];
  let current = 0;
  let score = 0;
  let bonus = 0;
  let combo = 0;
  let timer = null;
  let timeLeft = 20;
  let player = "";
  let userAnswers = [];
  let lockAnswers = false;
  let trainingMode = false;

  function setPillDanger(isDanger){
    if (isDanger) timePill.classList.add("pillDanger");
    else timePill.classList.remove("pillDanger");
  }
  function disableAllAnswers(){
    document.querySelectorAll(".ansBtn").forEach(b=>b.disabled = true);
  }
  function flashOk(){ glowOk.style.opacity = "1"; setTimeout(()=>glowOk.style.opacity = "0", 180); }
  function flashBad(){ glowBad.style.opacity = "1"; setTimeout(()=>glowBad.style.opacity = "0", 180); }
  function shake(el){
    el.classList.add("shake");
    setTimeout(()=>el.classList.remove("shake"), 220);
  }
  function showComboPop(text){
    comboPop.textContent = `🔥 ${text}!`;
    comboPop.classList.remove("show");
    void comboPop.offsetWidth;
    comboPop.classList.add("show");
  }
  function updateComboUI(){
    comboValueEl.textContent = `x${combo}`;
    bonusValueEl.textContent = `+${bonus}`;
  }
  function maybeAwardComboBonus(){
    if (combo === 3) { bonus += 1; showComboPop("+1 BONUS"); sfxCombo(); }
    if (combo === 5) { bonus += 2; showComboPop("+2 BONUS"); sfxCombo(); }
    if (combo === 8) { bonus += 3; showComboPop("+3 BONUS"); sfxCombo(); }
    updateComboUI();
  }

  function startQuiz(){
    getCtx();

    const name = playerName.value.trim();
    if(!name){ alert("Podaj imię!"); return; }

    if (!Array.isArray(questionBank) || questionBank.length < 40){
      alert("Bank pytań ma mniej niż 40. Przywróć bank w panelu admina.");
      return;
    }

    player = name;
    current = 0;
    score = 0;
    bonus = 0;
    combo = 0;
    userAnswers = [];
    lockAnswers = false;

    quiz = shuffle(structuredClone(questionBank)).slice(0, 40);

    startScreen.style.display = "none";
    resultScreen.style.display = "none";
    quizScreen.style.display = "block";

    sfxSirenShort();
    updateComboUI();
    showQuestion(true);
  }

  function endQuizEarly(){
    if (!confirm("Zakończyć quiz teraz?")) return;
    clearInterval(timer);
    finishQuiz();
  }

  function showQuestion(first=false){
    const q = quiz[current];

    if (!first){
      questionArea.classList.remove("fadeIn");
      questionArea.classList.add("fadeOut");
    }

    const applyUpdate = ()=>{
      questionArea.classList.remove("fadeOut");
      questionArea.classList.add("fadeIn");

      qIndexEl.innerText = String(current + 1);
      qTotalEl.innerText = String(quiz.length);
      categoryEl.innerText = q.cat || "—";
      questionEl.innerText = q.q;

      const pct = Math.round((current/quiz.length)*100);
      progressEl.style.width = `${pct}%`;

      // image (miniaturka do pytania)
      const imgSrc = getQuestionImage(q);
      if (imgSrc){
        qImgWrap.style.display = "flex";
        qImg.src = imgSrc;
      } else {
        qImgWrap.style.display = "none";
        qImg.src = "";
      }

      // answers
      answersEl.innerHTML = "";
      q.a.forEach((ans, i)=>{
        const btn = document.createElement("button");
        btn.className = "ansBtn";
        btn.innerHTML = `<b>${String.fromCharCode(65+i)}.</b> ${escapeHtml(ans)}`;
        btn.addEventListener("click", ()=> selectAnswer(i, btn));
        answersEl.appendChild(btn);
      });

      // timer
      lockAnswers = false;
      timeLeft = 20;
      timerEl.innerText = String(timeLeft);
      setPillDanger(false);
      clearInterval(timer);
      timer = setInterval(()=>{
        timeLeft--;
        timerEl.innerText = String(timeLeft);
        if (timeLeft <= 5) setPillDanger(true);
        if (timeLeft <= 0){
          clearInterval(timer);
          onTimeUp();
        }
      }, 1000);
    };

    if (first) applyUpdate();
    else setTimeout(applyUpdate, 150);
  }

  function onTimeUp(){
    if (lockAnswers) return;
    lockAnswers = true;
    disableAllAnswers();
    setPillDanger(false);

    // timeout => answer -1
    userAnswers.push(-1);

    // reveal correct
    const correct = quiz[current].c;
    const buttons = document.querySelectorAll(".ansBtn");
    if (buttons[correct]) buttons[correct].classList.add("ansCorrect");
    flashBad();
    combo = 0;
    updateComboUI();

    if (trainingMode){
      const correctText = quiz[current].a[correct];
      const explainText = quiz[current].exp || quiz[current].explain || "";
      showTrainingPanel(i === correct, correctText, explainText);
    } else {
      setTimeout(()=>{
        current++;
        if (current < quiz.length) showQuestion();
        else finishQuiz();
      }, 520);
    }
}

  
  function showTrainingPanel(isCorrect, correctText, explainText){
    if (!trainingPanel) return;
    trainingTitle.textContent = isCorrect ? "✅ Dobrze!" : "❌ Błędnie";
    const cls = isCorrect ? "ok" : "bad";
    const ex = explainText ? `<div class="muted" style="margin-top:6px;">${escapeHtml(explainText)}</div>` : "";
    trainingBody.innerHTML = `<div class="${cls}">Poprawna odpowiedź: <strong>${escapeHtml(correctText)}</strong></div>${ex}`;
    trainingPanel.style.display = "flex";
  }

  function hideTrainingPanelAndAdvance(){
    if (trainingPanel) trainingPanel.style.display = "none";
    current++;
    if (current < quiz.length) showQuestion();
    else finishQuiz();
  }

function selectAnswer(i, clickedBtn){
    if (lockAnswers) return;
    lockAnswers = true;
    clearInterval(timer);
    disableAllAnswers();

    const correct = quiz[current].c;

    if (i === correct){
      clickedBtn.classList.add("ansCorrect");
      sfxCorrect();
      flashOk();
      score++;

      combo++;
      maybeAwardComboBonus();
      if (combo >= 2) showComboPop(`COMBO x${combo}`);
    } else {
      clickedBtn.classList.add("ansWrong");
      const buttons = document.querySelectorAll(".ansBtn");
      if (buttons[correct]) buttons[correct].classList.add("ansCorrect");
      sfxWrong();
      flashBad();
      shake(questionArea);

      combo = 0;
      updateComboUI();
    }

    userAnswers.push(i);

    if (trainingMode){
      const correctText = quiz[current].a[correct];
      const explainText = quiz[current].exp || quiz[current].explain || "";
      showTrainingPanel(i === correct, correctText, explainText);
    } else {
      setTimeout(()=>{
        current++;
        if (current < quiz.length) showQuestion();
        else finishQuiz();
      }, 520);
    }
}

  /* =========================
     Rank system + end anim
  ========================= */
  function getRank(percent){
    if (percent === 100) return { name:"MISTRZ OSP", emoji:"🔥", bg:"rgba(246,196,83,.18)" };
    if (percent >= 90) return { name:"ELITA", emoji:"🏆", bg:"rgba(57,217,138,.16)" };
    if (percent >= 75) return { name:"STRAŻAK", emoji:"🚒", bg:"rgba(255,255,255,.10)" };
    if (percent >= 60) return { name:"RATOWNIK", emoji:"🧯", bg:"rgba(191,200,214,.16)" };
    return { name:"REKRUT", emoji:"🚧", bg:"rgba(255,77,77,.14)" };
  }

  function animateCountUp(correct, bonusPts, totalPts, percent){
    const start = performance.now();
    const dur = 900;

    function step(now){
      const t = clamp((now - start)/dur, 0, 1);
      const ease = 1 - Math.pow(1 - t, 3);

      countCorrect.textContent = String(Math.round(correct * ease));
      countBonus.textContent = String(Math.round(bonusPts * ease));
      countTotal.textContent = String(Math.round(totalPts * ease));
      countPercent.textContent = `${Math.round(percent * ease)}%`;

      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  // Confetti (simple)
  let confetti = [];
  let confettiRun = false;

  function resizeConfetti(){
    const rect = confettiCanvas.getBoundingClientRect();
    confettiCanvas.width = Math.floor(rect.width * devicePixelRatio);
    confettiCanvas.height = Math.floor(rect.height * devicePixelRatio);
  }

  function startConfetti(){
    resizeConfetti();
    window.addEventListener("resize", resizeConfetti);

    confetti = Array.from({length: 110}).map(()=>({
      x: Math.random(),
      y: Math.random() * -0.2,
      r: 2 + Math.random()*4,
      vx: (Math.random()-0.5) * 0.18,
      vy: 0.18 + Math.random()*0.28,
      a: Math.random()*Math.PI*2
    }));

    confettiRun = true;
    requestAnimationFrame(drawConfetti);
  }

  function stopConfetti(){
    confettiRun = false;
    confCtx.clearRect(0,0,confettiCanvas.width, confettiCanvas.height);
    window.removeEventListener("resize", resizeConfetti);
  }

  function drawConfetti(){
    if (!confettiRun) return;
    const w = confettiCanvas.width;
    const h = confettiCanvas.height;

    confCtx.clearRect(0,0,w,h);

    confetti.forEach(p=>{
      p.x += p.vx;
      p.y += p.vy;
      p.a += 0.1;

      if (p.y > 1.1) { p.y = -0.1; p.x = Math.random(); }
      if (p.x < -0.1) p.x = 1.1;
      if (p.x > 1.1) p.x = -0.1;

      const px = p.x * w;
      const py = p.y * h;

      confCtx.save();
      confCtx.translate(px, py);
      confCtx.rotate(p.a);
      confCtx.globalAlpha = 0.9;
      confCtx.fillStyle = `hsl(${Math.floor(Math.random()*360)}, 90%, 60%)`;
      confCtx.fillRect(-p.r, -p.r, p.r*2, p.r*2);
      confCtx.restore();
    });

    requestAnimationFrame(drawConfetti);
  }

  function finishQuiz(){
    clearInterval(timer);
    setPillDanger(false);

    const totalPoints = score + bonus;
    const percent = Math.round((score/quiz.length)*100);

    quizScreen.style.display = "none";
    resultScreen.style.display = "block";

    const r = getRank(percent);
    rankBadge.textContent = `${r.emoji} ${r.name}`;
    rankBadge.style.background = r.bg;

    finalResult.innerText =
      `${player} – poprawne: ${score}/${quiz.length} (${percent}%) | bonus: +${bonus} | suma pkt: ${totalPoints}`;

    renderReview(quiz, userAnswers, review);
    saveRankingAttempt({ name: player, score: percent, points: totalPoints, quiz, answers: userAnswers });

    renderRanking(rankingList);
    renderRanking(rankingList2);
    renderPodium(podiumStart);
    renderPodium(podiumResult);

    startConfetti();
    animateCountUp(score, bonus, totalPoints, percent);

    // scroll to top of result screen (button is already on top, but just in case)
    resultScreen.scrollIntoView({ behavior:"smooth", block:"start" });
  }

  function nextPlayer(){
    resultScreen.style.display = "none";
    quizScreen.style.display = "none";
    startScreen.style.display = "block";
    playerName.value = "";
    review.innerHTML = "";
    stopConfetti();
    clearInterval(timer);
  }

  /* =========================
     Review render
  ========================= */
  function renderReview(quizArr, answersArr, targetEl){
    let html = "";
    quizArr.forEach((q, idx)=>{
      const user = answersArr[idx];
      const correct = q.c;

      const userText = (user === -1)
        ? "Brak (czas minął)"
        : `${String.fromCharCode(65+user)}. ${q.a[user]}`;

      const userOk = (user === correct);

      html += `
        <div class="qBox">
          <b>${idx+1}. ${escapeHtml(q.q)}</b>
          <div class="muted">Kategoria: ${escapeHtml(q.cat || "—")}</div>
          <div class="muted">Obrazek: ${escapeHtml(q.img || "—")}</div>
          <div style="margin-top:8px;">
            Twoja odpowiedź:
            <span class="${userOk ? "ok" : "bad"}">${escapeHtml(userText)}</span><br>
            Poprawna:
            <span class="ok">${String.fromCharCode(65+correct)}. ${escapeHtml(q.a[correct])}</span>
          </div>
        </div>
      `;
    });
    targetEl.innerHTML = html;
  }

  /* =========================
     Ranking localStorage
  ========================= */
  function loadRanking(){
    const r = safeParse(localStorage.getItem(RANK_KEY));
    return Array.isArray(r) ? r : [];
  }

  function saveRankingAttempt(attempt){
    const ranking = loadRanking();
    ranking.push(attempt);
    ranking.sort((a,b)=>{
      const s = (b.score ?? 0) - (a.score ?? 0);
      if (s !== 0) return s;
      return (b.points ?? 0) - (a.points ?? 0);
    });
    localStorage.setItem(RANK_KEY, JSON.stringify(ranking.slice(0,200)));
  }

  function renderRanking(targetEl){
    const ranking = loadRanking();
    targetEl.innerHTML = "";

    if (!ranking.length){
      targetEl.innerHTML = `<div class="muted">Brak wyników — zagraj jako pierwszy 🙂</div>`;
      return;
    }

    ranking.slice(0, 30).forEach((r, idx)=>{
      const div = document.createElement("div");
      div.className = "rankItem";

      const place = idx+1;
      const badgeCls = place === 1 ? "gold" : place === 2 ? "silver" : place === 3 ? "bronze" : "";
      const badge = place <= 3
        ? `<span class="badge ${badgeCls}">#${place}</span>`
        : `<span class="badge">#${place}</span>`;

      div.innerHTML = `
        <div class="rankLeft">
          ${badge}
          <div>
            <div style="font-weight:1000;">${escapeHtml(r.name)}</div>
            <div class="muted">${r.score}% ${typeof r.points === "number" ? `| pkt: ${r.points}` : ""}</div>
          </div>
        </div>
        <div class="muted">📋</div>
      `;
      div.addEventListener("click", ()=> showHistory(idx));
      targetEl.appendChild(div);
    });
  }

  function renderPodium(targetEl){
    const ranking = loadRanking();
    const slots = [
      {label:"🥇", cls:"gold"},
      {label:"🥈", cls:"silver"},
      {label:"🥉", cls:"bronze"},
    ];
    targetEl.innerHTML = "";

    slots.forEach((s, idx)=>{
      const data = ranking[idx];
      const name = data ? data.name : "—";
      const score = data ? `${data.score}%` : "—";
      const pts = data && typeof data.points === "number" ? ` | pkt: ${data.points}` : "";

      const div = document.createElement("div");
      div.className = "podium";
      div.innerHTML = `
        <div class="podiumPlace">
          <span class="badge ${s.cls}">${s.label}</span>
          <span class="podiumScore">${score}${pts}</span>
        </div>
        <div class="podiumName">${escapeHtml(name)}</div>
        <div class="muted">TOP ${idx+1}</div>
      `;
      targetEl.appendChild(div);
    });
  }

  function showHistory(index){
    const ranking = loadRanking();
    const data = ranking[index];
    if (!data || !data.quiz || !data.answers){
      alert("Brak danych do podglądu.");
      return;
    }

    const header = `
      <div class="divider"></div>
      <div class="rankHeader">
        📋 Podgląd odpowiedzi:
        <span style="color:var(--text)">${escapeHtml(data.name)}</span>
        <span class="muted">(${data.score}% | pkt: ${data.points ?? 0})</span>
      </div>
    `;

    const target = (startScreen.style.display !== "none") ? historyView : historyView2;
    target.innerHTML = header + `<div id="__history_review"></div>`;
    renderReview(data.quiz, data.answers, $("__history_review"));
  }

  function clearRanking(){
    if (!confirm("Na pewno zresetować ranking?")) return;
    localStorage.removeItem(RANK_KEY);
    renderRanking(rankingList);
    renderRanking(rankingList2);
    renderPodium(podiumStart);
    renderPodium(podiumResult);
    clearHistoryView();
  }

  function clearHistoryView(){
    historyView.innerHTML = "";
    historyView2.innerHTML = "";
  }

  /* =========================
     Bind buttons
  ========================= */
  // Training mode toggle (offline)
  try{
    trainingMode = localStorage.getItem("osp_trainingMode") === "1";
  }catch(e){}
  if (trainingToggle){
    trainingToggle.checked = trainingMode;
    trainingToggle.addEventListener("change", ()=>{
      trainingMode = !!trainingToggle.checked;
      try{ localStorage.setItem("osp_trainingMode", trainingMode ? "1" : "0"); }catch(e){}
    });
  }

  startBtn.addEventListener("click", startQuiz);
  playerName.addEventListener("keydown", (e)=>{ if (e.key === "Enter") startQuiz(); });
  endBtn.addEventListener("click", endQuizEarly);
  nextPlayerBtn.addEventListener("click", nextPlayer);
  if (trainingNextBtn) trainingNextBtn.addEventListener("click", ()=>{ hideTrainingPanelAndAdvance(); });
  document.addEventListener("keydown", (e)=>{
    if (trainingMode && trainingPanel && trainingPanel.style.display !== "none" && (e.key === "Enter" || e.key === " ")){ 
      e.preventDefault();
      hideTrainingPanelAndAdvance();
    }
  });


  /* =========================
     DEV panel (dynamic)
     - open: 3 clicks on logo within 1s
     - pass: pako14 (no hints in UI)
     - changes visuals: subtitle, logo, bg, bg blur, music
  ========================= */
  function getDev(){
    try{ return JSON.parse(localStorage.getItem(DEV_KEY)) || {}; }
    catch{ return {}; }
  }
  function saveDev(obj){
    localStorage.setItem(DEV_KEY, JSON.stringify(obj));
  }

  function applyDev(){
    const s = getDev();

    // subtitle
    if (s.subtitle){
      const sub = document.querySelector(".subtitle");
      if (sub) sub.textContent = s.subtitle;
    }

    // logo
    if (s.logo){
      const logo = document.querySelector(".logo");
      if (logo) logo.src = s.logo;
    }

    // bg image
    if (s.bg){
      document.body.style.background = `url("${s.bg}") no-repeat center center fixed`;
      document.body.style.backgroundSize = "cover";
    }

    // bg blur
    const blur = Number(s.bgBlur ?? 12);
    document.documentElement.style.setProperty("--bg-blur", `${clamp(blur,0,20)}px`);

    // music (robust reload)
    if (s.music){
      try{
        music.pause();
        // remove all <source>
        while (music.firstChild) music.removeChild(music.firstChild);
        music.src = s.music;
        music.load();
      }catch{}
    }
  }

  function createDevPanel(){
    // Use existing panel from HTML if present; otherwise create it dynamically.
    let panel = document.getElementById("devPanel");
    if (!panel){
      panel = document.createElement("div");
      panel.id = "devPanel";
      panel.innerHTML = `
        <div class="adminTitle">Panel dewelopera</div>
        <div id="devCloseEdge">✖</div>

        <div id="devLoginSection" class="adminBox">
          <input class="input" type="password" id="devPassword" placeholder="Hasło" />
          <button class="btn btnPrimary" id="devLoginBtn">Zaloguj</button>
          <div class="muted" style="margin-top:8px;">Enter zatwierdza logowanie.</div>
        </div>

        <div id="devContent" style="display:none;">
          <div class="adminBox">
            <div class="muted" style="margin-bottom:8px;">Zmiany zapisują się lokalnie (offline) na tym urządzeniu.</div>

            <input class="input" id="devSubtitle" placeholder="Zmiana nazwy jednostki (np. Ochotnicza Straż Pożarna w ...)" />

            <div class="muted" style="margin-top:10px;">Zmiana logo jednostki (plik)</div>
            <input class="input" type="file" id="devLogo" accept="image/*" />

            <div class="muted" style="margin-top:10px;">Zmiana tła strony (plik)</div>
            <input class="input" type="file" id="devBg" accept="image/*" />

            <div class="muted" style="margin-top:10px;">Rozmycie tła</div>
            <input class="input" type="range" id="devBlur" min="0" max="20" step="1" value="12" />

            <div style="display:flex; gap:10px; margin-top:12px;">
              <button class="btn btnPrimary" id="devSaveBtn">💾 Zapisz</button>
              <button class="btn btnGhost" id="devResetBtn">🔄 Reset</button>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(panel);
    }

    // Close edge: support both "inside panel" edge and legacy "floating" edge.
    let edge = document.getElementById("devCloseEdge");
    if (!edge){
      edge = document.createElement("div");
      edge.id = "devCloseEdge";
      edge.textContent = "✖";
      document.body.appendChild(edge);
    }

    const open = () => {
      panel.classList.add("active");
      edge.style.display = "block";

      // Autofocus hasła po otwarciu (żeby od razu można pisać)
      setTimeout(()=>{
        try{
          const loginVisible = devLoginSection && devLoginSection.style.display !== "none";
          if (loginVisible){
            devPassword.focus();
            devPassword.select?.();
          }
        }catch{}
      }, 0);
    };
    const close = () => {
      panel.classList.remove("active");
      edge.style.display = "none";
    };

    edge.addEventListener("click", close);

    const devGear = document.getElementById("devGear");
    if (devGear){
      devGear.addEventListener("click", ()=>{
        if (panel.classList.contains("active")) close();
        else open();
      });
    }


    // Wire up login + controls (guard if elements are missing)
    const devPassword = document.getElementById("devPassword");
    const devLoginBtn = document.getElementById("devLoginBtn");
    const devLoginSection = document.getElementById("devLoginSection");
    const devContent = document.getElementById("devContent");

    function loginDev(){
      getCtx();
      if (devPassword && devPassword.value === "pako14"){
        if (devLoginSection) devLoginSection.style.display = "none";
        if (devContent) devContent.style.display = "block";

        // preload current settings
        const s = getDev();
        const sub = document.getElementById("devSubtitle");
        const blur = document.getElementById("devBlur");
        if (sub) sub.value = s.subtitle ?? "";
        if (blur) blur.value = String(Number(s.bgBlur ?? 12));
      } else {
        alert("Nieprawidłowe hasło.");
      }
    }

    if (devLoginBtn) devLoginBtn.addEventListener("click", loginDev);
    if (devPassword) devPassword.addEventListener("keydown", (e)=>{ if (e.key === "Enter") loginDev(); });

    // Save + reset
    const devSaveBtn = document.getElementById("devSaveBtn");
    if (devSaveBtn){
      devSaveBtn.addEventListener("click", ()=>{
        const s = getDev();
        const sub = document.getElementById("devSubtitle");
        const blur = document.getElementById("devBlur");
        if (sub) s.subtitle = sub.value.trim() || "";
        if (blur) s.bgBlur = Number(blur.value);

        saveDev(s);
        applyDev();
        close();
      });
    }

    const devResetBtn = document.getElementById("devResetBtn");
    if (devResetBtn){
      devResetBtn.addEventListener("click", ()=>{
        if (!confirm("Zresetować ustawienia panelu dewelopera?")) return;
        localStorage.removeItem(DEV_KEY);
        location.reload();
      });
    }

    // file inputs => dataURL (offline)
    function fileToDataUrl(input, cb){
      const file = input && input.files && input.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => cb(String(reader.result || ""));
      reader.readAsDataURL(file);
    }

    const devLogo = document.getElementById("devLogo");
    if (devLogo){
      devLogo.addEventListener("change", (e)=>{
        fileToDataUrl(e.target, (dataUrl)=>{
          const s = getDev();
          s.logo = dataUrl;
          saveDev(s);
          applyDev();
        });
      });
    }

    const devBg = document.getElementById("devBg");
    if (devBg){
      devBg.addEventListener("change", (e)=>{
        fileToDataUrl(e.target, (dataUrl)=>{
          const s = getDev();
          s.bg = dataUrl;
          saveDev(s);
          applyDev();
        });
      });
    }

    // opcjonalnie: ikona 🛠 obok panelu admina
    const devGearBtn = document.getElementById("devGear");
    if (devGearBtn){
      devGearBtn.addEventListener("click", open);
    }

    // 3-click open on logo (or title as fallback)
    let clicks = 0;
    let clickTimer = null;
    const logo = document.getElementById("unitLogo") || document.querySelector(".logo") || document.querySelector(".topBrand");
    if (logo){
      logo.addEventListener("click", ()=>{
        clicks++;
        clearTimeout(clickTimer);
        clickTimer = setTimeout(()=>{ clicks = 0; }, 900);

        if (clicks >= 3){
          clicks = 0;
          open();
        }
      });
    }
  }

  createDevPanel();
  applyDev();

  /* =========================
     INIT
  ========================= */
  renderRanking(rankingList);
  renderRanking(rankingList2);
  renderPodium(podiumStart);
  renderPodium(podiumResult);

})();
