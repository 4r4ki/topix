(() => {
  const $ = (id) => document.getElementById(id);
  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const thisMonth = new Date().getMonth() + 1;

  $("version").textContent = "v" + APP_VERSION;

  // ---------- タブ ----------
  function showTab(name) {
    document.querySelectorAll(".tab").forEach((b) => b.classList.toggle("active", b.dataset.tab === name));
    document.querySelectorAll(".panel").forEach((p) => p.classList.toggle("active", p.id === name));
  }
  document.querySelectorAll(".tab").forEach((btn) =>
    btn.addEventListener("click", () => { showTab(btn.dataset.tab); window.scrollTo(0, 0); })
  );

  // ---------- ネタ帳 ----------
  function itemHTML(t, open) {
    const c = CATEGORIES[t.cat];
    const month = t.months
      ? `<span class="month ${t.months.includes(thisMonth) ? "now" : ""}">${t.months.includes(thisMonth) ? "今月" : t.months.join("・") + "月"}</span>`
      : "";
    return `
      <details class="item" ${open ? "open" : ""}>
        <summary><span class="emoji">${c.emoji}</span>${esc(t.q)}${month}</summary>
        <div class="opener"><span>💬 話しかけ例</span><p>「${esc(t.open)}」</p></div>
        <div class="follow"><span>🔁 つづける質問</span><ul>${t.follow.map((f) => `<li>${esc(f)}</li>`).join("")}</ul></div>
      </details>`;
  }

  let current = "all";
  function renderFilters() {
    const chips = [["all", "すべて"], ...Object.entries(CATEGORIES).map(([k, c]) => [k, `${c.emoji} ${c.label}`])];
    $("filters").innerHTML = chips
      .map(([k, label]) => `<button class="chip ${k === current ? "on" : ""}" data-cat="${k}">${label}</button>`)
      .join("");
  }
  function renderItems() {
    const list = TOPICS.filter((t) => current === "all" || t.cat === current);
    $("netaCount").textContent = `(${list.length}こ)`;
    $("netaItems").innerHTML = list.map((t) => itemHTML(t)).join("");
  }
  $("filters").addEventListener("click", (e) => {
    const chip = e.target.closest(".chip");
    if (!chip) return;
    current = chip.dataset.cat;
    renderFilters();
    renderItems();
  });

  // 今の月に使える話題からランダムに1つ
  let last = null;
  $("randomBtn").addEventListener("click", () => {
    const pool = TOPICS.filter((t) => (!t.months || t.months.includes(thisMonth)) && t !== last);
    last = pool[Math.floor(Math.random() * pool.length)];
    $("randomCard").innerHTML = itemHTML(last, true);
  });

  $("triviaList").innerHTML = TRIVIA.map((t) => `<li>${esc(t)}</li>`).join("");

  // ---------- 印刷(両方のタブ・全部の話題を開いて印刷) ----------
  $("printBtn").addEventListener("click", () => {
    current = "all";
    renderFilters();
    renderItems();
    document.querySelectorAll("details.item").forEach((d) => (d.open = true));
    window.print();
  });

  renderFilters();
  renderItems();
})();
