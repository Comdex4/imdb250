(function () {
  "use strict";

  const STORAGE_KEY = "imdb250.seen.v1";

  const movies = window.IMDB_TOP_250.map(([title, year], i) => ({
    rank: i + 1,
    title,
    year,
    id: `${title}|${year}`,
  }));

  // seen: { [movieId]: ISO date string }
  let seen = load();
  let current = null;
  let filter = "all";

  const $ = (id) => document.getElementById(id);
  const els = {
    seenCount: $("seen-count"),
    totalCount: $("total-count"),
    barFill: $("bar-fill"),
    bar: document.querySelector(".bar"),
    card: $("card"),
    cardEmpty: $("card-empty"),
    cardBody: $("card-body"),
    cardRank: $("card-rank"),
    cardTitle: $("card-title"),
    cardYear: $("card-year"),
    cardStatus: $("card-status"),
    markSeen: $("mark-seen"),
    imdbLink: $("imdb-link"),
    pick: $("pick"),
    unseenOnly: $("unseen-only"),
    search: $("search"),
    list: $("movie-list"),
    exportBtn: $("export"),
    importInput: $("import"),
    reset: $("reset"),
  };

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const data = raw ? JSON.parse(raw) : {};
      return data && typeof data === "object" ? data : {};
    } catch {
      return {};
    }
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seen));
    } catch {
      // Storage unavailable (private mode, etc.); state still works for this visit.
    }
  }

  function imdbUrl(m) {
    return `https://www.imdb.com/find/?q=${encodeURIComponent(`${m.title} ${m.year}`)}&s=tt&ttype=ft`;
  }

  function formatDate(iso) {
    const d = new Date(iso);
    return isNaN(d) ? "" : d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  }

  function setSeen(m, value) {
    if (value) seen[m.id] = new Date().toISOString();
    else delete seen[m.id];
    save();
    render();
  }

  function pool() {
    return els.unseenOnly.checked ? movies.filter((m) => !seen[m.id]) : movies;
  }

  function pick() {
    const available = pool();
    if (!available.length) return;
    // Avoid re-picking the movie already on screen when there's another option.
    const candidates = available.length > 1 ? available.filter((m) => m !== current) : available;

    // Brief shuffle animation through random titles before landing.
    const finalPick = candidates[Math.floor(Math.random() * candidates.length)];
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const steps = reduceMotion ? 0 : 12;
    let i = 0;
    els.pick.disabled = true;
    els.card.classList.add("spinning");

    const tick = () => {
      if (i < steps) {
        showCard(candidates[Math.floor(Math.random() * candidates.length)], true);
        i++;
        setTimeout(tick, 40 + i * 12);
      } else {
        els.card.classList.remove("spinning");
        current = finalPick;
        render();
      }
    };
    tick();
  }

  function showCard(m, preview) {
    els.cardEmpty.hidden = true;
    els.cardBody.hidden = false;
    els.cardRank.textContent = `#${m.rank}`;
    els.cardTitle.textContent = m.title;
    els.cardYear.textContent = m.year;
    if (preview) {
      els.cardStatus.textContent = "";
      return;
    }
    const isSeen = Boolean(seen[m.id]);
    els.cardStatus.textContent = isSeen ? `Seen · ${formatDate(seen[m.id])}` : "";
    els.markSeen.textContent = isSeen ? "Undo — mark unseen" : "✓ I've seen it";
    els.markSeen.classList.toggle("undo", isSeen);
    els.imdbLink.href = imdbUrl(m);
  }

  function renderProgress() {
    const count = movies.filter((m) => seen[m.id]).length;
    els.seenCount.textContent = count;
    els.totalCount.textContent = movies.length;
    els.barFill.style.width = `${(count / movies.length) * 100}%`;
    els.bar.setAttribute("aria-valuenow", count);
    els.bar.setAttribute("aria-valuemax", movies.length);

    const remaining = pool().length;
    els.pick.disabled = remaining === 0;
    els.pick.textContent = remaining === 0 ? "🏆 You've seen them all!" : "🎲 Pick a random movie";
  }

  function renderList() {
    const q = els.search.value.trim().toLowerCase();
    const visible = movies.filter((m) => {
      if (filter === "seen" && !seen[m.id]) return false;
      if (filter === "unseen" && seen[m.id]) return false;
      return !q || m.title.toLowerCase().includes(q) || String(m.year).includes(q);
    });

    const frag = document.createDocumentFragment();
    for (const m of visible) {
      const li = document.createElement("li");
      li.className = (seen[m.id] ? "seen " : "") + (m === current ? "current" : "");

      const label = document.createElement("label");
      const box = document.createElement("input");
      box.type = "checkbox";
      box.checked = Boolean(seen[m.id]);
      box.addEventListener("change", () => setSeen(m, box.checked));

      const rank = document.createElement("span");
      rank.className = "m-rank";
      rank.textContent = m.rank;

      const title = document.createElement("span");
      title.className = "m-title";
      title.textContent = m.title + " ";
      const year = document.createElement("span");
      year.className = "m-year";
      year.textContent = `(${m.year})`;
      title.appendChild(year);

      label.append(box, rank, title);
      li.appendChild(label);

      if (seen[m.id]) {
        const date = document.createElement("span");
        date.className = "m-date";
        date.textContent = formatDate(seen[m.id]);
        li.appendChild(date);
      }
      frag.appendChild(li);
    }

    if (!visible.length) {
      const li = document.createElement("li");
      li.className = "empty-list";
      li.textContent = "No movies match.";
      frag.appendChild(li);
    }

    els.list.replaceChildren(frag);
  }

  function render() {
    renderProgress();
    renderList();
    if (current) showCard(current, false);
  }

  function exportData() {
    const payload = {
      app: "imdb250",
      exportedAt: new Date().toISOString(),
      seen,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `imdb250-seen-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  function importData(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        const incoming = data && typeof data.seen === "object" ? data.seen : null;
        if (!incoming) throw new Error("bad file");
        const merged = { ...seen };
        for (const [id, date] of Object.entries(incoming)) {
          if (typeof date === "string") merged[id] = date;
        }
        seen = merged;
        save();
        render();
        alert(`Imported ${Object.keys(incoming).length} seen movies.`);
      } catch {
        alert("That file doesn't look like an IMDb 250 backup.");
      }
    };
    reader.readAsText(file);
  }

  els.pick.addEventListener("click", pick);
  els.markSeen.addEventListener("click", () => current && setSeen(current, !seen[current.id]));
  els.unseenOnly.addEventListener("change", renderProgress);
  els.search.addEventListener("input", renderList);
  document.querySelectorAll(".seg button").forEach((btn) => {
    btn.addEventListener("click", () => {
      filter = btn.dataset.filter;
      document.querySelectorAll(".seg button").forEach((b) => b.classList.toggle("active", b === btn));
      renderList();
    });
  });
  els.exportBtn.addEventListener("click", exportData);
  els.importInput.addEventListener("change", () => {
    if (els.importInput.files[0]) importData(els.importInput.files[0]);
    els.importInput.value = "";
  });
  els.reset.addEventListener("click", () => {
    if (confirm("Clear your entire seen list? Export a backup first if you want to keep it.")) {
      seen = {};
      save();
      render();
    }
  });

  render();
})();
