(() => {
  const STORE_KEY = "topix-v1";
  const WEEK = ["日", "月", "火", "水", "木", "金", "土"];
  const BADGES = [
    [1, "🌱 はじめの一歩! 話しかけられたね"],
    [3, "🌿 3回達成! いい調子"],
    [5, "🍀 5回! 話しかけるのに慣れてきたね"],
    [10, "🌳 10回! もう立派な話しかけ名人"],
    [20, "🏅 20回! すごい!"],
    [30, "🏆 30回! 自信をもっていいよ"],
    [50, "👑 50回! トークマスター"],
  ];

  // ---------- 保存 ----------
  function load() {
    try {
      const s = JSON.parse(localStorage.getItem(STORE_KEY));
      if (s && Array.isArray(s.used) && Array.isArray(s.fav)) return s;
    } catch (e) { /* ignore */ }
    return { used: [], fav: [] };
  }
  let state = load();
  const save = () => localStorage.setItem(STORE_KEY, JSON.stringify(state));

  // ---------- 日付と並び順 ----------
  const dayNumber = (d) => Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000);
  const keyOf = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  function rng(seed) {
    return () => {
      seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function shuffled(list, seed) {
    const a = list.slice(), r = rng(seed);
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(r() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  const general = shuffled(TOPICS.filter((t) => !t.months), 20261);
  const trivia = shuffled(TRIVIA, 4242);

  function topicsFor(date) {
    const n = dayNumber(date);
    const picks = [general[(n * 2) % general.length], general[(n * 2 + 1) % general.length]];
    const seasonal = TOPICS.filter((t) => t.months && t.months.includes(date.getMonth() + 1));
    if (seasonal.length) picks.push(seasonal[n % seasonal.length]);
    return picks;
  }

  // ---------- 表示 ----------
  const $ = (id) => document.getElementById(id);
  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  function cardHTML(t, label) {
    const c = CATEGORIES[t.cat];
    const fav = state.fav.includes(t.q);
    const used = state.used.some((u) => u.q === t.q && u.date === keyOf(new Date()));
    return `
      <div class="card topic" data-q="${esc(t.q)}">
        <div class="label">${label} <span class="cat">${c.emoji} ${c.label}</span></div>
        <h2 class="question">${esc(t.q)}</h2>
        <div class="opener"><span>💬 話しかけ例</span><p>「${esc(t.open)}」</p></div>
        <div class="follow"><span>🔁 つづける質問</span><ul>${t.follow.map((f) => `<li>${esc(f)}</li>`).join("")}</ul></div>
        <p class="hint">🧠 自分ならどう答える? 先に考えておくと話しやすいよ。</p>
        <div class="actions">
          <button class="btn ghost fav ${fav ? "on" : ""}">${fav ? "⭐ お気に入り" : "☆ お気に入り"}</button>
          <button class="btn primary use ${used ? "on" : ""}">${used ? "🎉 使ってみた!" : "✅ 使ってみた"}</button>
        </div>
      </div>`;
  }

  let offset = 0;
  function renderToday() {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    const isToday = offset === 0;
    $("dateLabel").textContent = `${d.getMonth() + 1}月${d.getDate()}日(${WEEK[d.getDay()]})${isToday ? " きょう" : ""}`;
    $("backToday").classList.toggle("hidden", isToday);
    const [a, b, s] = topicsFor(d);
    $("cards").innerHTML =
      cardHTML(a, "⭐ きょうのメイン話題") + cardHTML(b, "➕ もうひとつ") + (s ? cardHTML(s, "🍂 季節の話題") : "");
    $("trivia").textContent = trivia[dayNumber(d) % trivia.length];
  }

  function renderLog() {
    $("usedCount").textContent = state.used.length;
    const got = BADGES.filter(([n]) => state.used.length >= n).pop();
    $("badge").textContent = got ? got[1] : "きょうの話題で、まず1回ためしてみよう!";
    $("favList").innerHTML = state.fav.length
      ? state.fav.map((q) => `<li>⭐ ${esc(q)}</li>`).join("")
      : `<li class="empty">まだありません。話題の「☆ お気に入り」をおすと ここに出ます。</li>`;
    $("usedList").innerHTML = state.used.length
      ? state.used.slice().reverse().map((u) => `<li><span class="d">${u.date.slice(5).replace("-", "/")}</span> ${esc(u.q)}</li>`).join("")
      : `<li class="empty">まだありません。話しかけたら「✅ 使ってみた」をおそう!</li>`;
  }

  function renderAll() { renderToday(); renderLog(); }

  // ---------- 操作 ----------
  document.addEventListener("click", (e) => {
    const card = e.target.closest(".topic");
    if (!card) return;
    const q = card.dataset.q;
    if (e.target.closest(".fav")) {
      state.fav = state.fav.includes(q) ? state.fav.filter((x) => x !== q) : [...state.fav, q];
    } else if (e.target.closest(".use")) {
      const today = keyOf(new Date());
      const i = state.used.findIndex((u) => u.q === q && u.date === today);
      if (i >= 0) state.used.splice(i, 1);
      else state.used.push({ q, date: today });
    } else return;
    save();
    renderAll();
    const more = $("moreCard").firstElementChild;
    if (more) showMore(TOPICS.find((t) => t.q === more.dataset.q));
  });

  function showMore(t) { $("moreCard").innerHTML = cardHTML(t, "🎲 ほかの話題"); }
  $("moreBtn").addEventListener("click", () => {
    const current = $("moreCard").firstElementChild?.dataset.q;
    const pool = TOPICS.filter((t) => (!t.months || t.months.includes(new Date().getMonth() + 1)) && t.q !== current);
    showMore(pool[Math.floor(Math.random() * pool.length)]);
  });

  $("prevDay").addEventListener("click", () => { offset--; renderToday(); });
  $("nextDay").addEventListener("click", () => { offset++; renderToday(); });
  $("backToday").addEventListener("click", () => { offset = 0; renderToday(); });

  $("resetBtn").addEventListener("click", () => {
    if (confirm("きろくとお気に入りを全部消します。いいですか?")) {
      state = { used: [], fav: [] };
      save();
      renderAll();
    }
  });

  document.querySelectorAll(".tab").forEach((btn) =>
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach((b) => b.classList.toggle("active", b === btn));
      document.querySelectorAll(".panel").forEach((p) => p.classList.toggle("active", p.id === btn.dataset.tab));
      if (btn.dataset.tab === "log") renderLog();
      window.scrollTo(0, 0);
    })
  );

  // 日付が変わったら(次の日にアプリを開いたら)自動で更新
  let lastDay = keyOf(new Date());
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && keyOf(new Date()) !== lastDay) {
      lastDay = keyOf(new Date());
      offset = 0;
      renderAll();
    }
  });

  renderAll();
})();
