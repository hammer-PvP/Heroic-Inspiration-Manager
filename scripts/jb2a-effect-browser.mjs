/**
 * Standalone JB2A Picker, extracted/adapted from CTN v1.1.15.
 * Reference component for Heroic Inspiration Manager; not a CTN module patch.
 * Requires Foundry VTT + Sequencer + installed JB2A paths.
 */
import { JB2A_FACETS, indexJB2APaths, facetValues, filterJB2AIndex } from "./jb2a-browser-filters.mjs";

const defaultLabels={
  Browse:"JB2A Effect Browser",All:"All",Search:"Search installed effects…",
  FilterCategory:"Category",FilterColor:"Color",FilterFormat:"Shape",FilterVariation:"Variation",FilterDistance:"Distance",
  Preview:"Animated preview",ChoosePreview:"Choose an effect to preview.",LoadingPreview:"Loading animation…",
  PreviewUnavailable:"Preview unavailable. This effect can still be selected.",NoEffects:"No JB2A effects found.",
  NoMatches:"No effects match the current filters.",Results:"effects found",
  FirstPage:"First",PreviousPage:"Previous",NextPage:"Next",LastPage:"Last",PageNavigation:"Pages",
  PageNumber:"Page number",GoPage:"Go",CancelEditor:"Cancel",ConfirmEffect:"Confirm"
};
const escape = (value) => foundry.utils.escapeHTML(String(value ?? ""));
const opt = (value, title, selected) => `<option value="${escape(value)}"${value === selected ? " selected" : ""}>${escape(title)}</option>`;

let databaseCacheInstance = null;
let databaseCache = null;
/** Get all installed JB2A Sequencer Database keys, not just first N. */
export function installedJB2APaths() {
  if (!game.modules.get("sequencer")?.active || !globalThis.Sequencer?.Database) return [];
  try {
    const db = globalThis.Sequencer.Database;
    if (databaseCacheInstance === db && databaseCache?.length) return databaseCache;
    const paths = db.getPathsUnder("jb2a", { fullyQualified: true });
    databaseCacheInstance = db;
    databaseCache = [...new Set((Array.isArray(paths) ? paths : [])
      .filter((key) => typeof key === "string" && key.startsWith("jb2a.")))].sort();
    return databaseCache;
  } catch (error) {
    console.warn("JB2A browser | unable to enumerate paths", error);
    return [];
  }
}

/** Resolve an installed JB2A database entry for a GM-only HTML video preview.
 * Sequencer returns a SequencerFile or an array thereof, not always a path.
 * Using the media element avoids any Scene FX, persistent flags, or sockets.
 */
async function previewMediaPath(path) {
  const entry = globalThis.Sequencer?.Database?.getEntry?.(path, { softFail: true });
  if (!entry) return null;
  const fileEntry = Array.isArray(entry) ? entry[0] : entry;
  let file = typeof fileEntry?.getFile === "function" ? await fileEntry.getFile() : fileEntry;
  if (file && typeof file === "object" && !Array.isArray(file)) file = file.file ?? file.path ?? file.src ?? file;
  if (Array.isArray(file)) file = file[0];
  if (typeof file !== "string" || !/\.(?:webm|mp4|png|jpe?g|webp)(?:[?#].*)?$/i.test(file)) return null;
  return file;
}

/**
 * Open a GM-side JB2A effect browser and return the selected Database path.
 * No Tiles, Canvas effects, sequencer playback, flags, sockets or writes.
 * Caller must persist the path in the appropriate setting.
 */
export function openJB2ABrowser({ onChoose, current = "", labels = {}, pageSize = 100, paths: installedPaths = null } = {}) {
  if (typeof onChoose !== "function") throw new TypeError("onChoose callback required");
  const label = (key) => labels[key] ?? defaultLabels[key] ?? key;
  // The caller may restrict the available keys to its verified free JB2A library.
  const paths = (Array.isArray(installedPaths) ? [...new Set(installedPaths)] : installedJB2APaths())
    .filter((path)=>typeof path==="string"&&path.startsWith("jb2a.")).sort();
  if (!paths.length) { ui.notifications.warn(label("NoEffects")); return; }
  const PAGE_SIZE = Math.max(1, Math.trunc(Number(pageSize) || 100));
  const index = indexJB2APaths(paths);
  const filterFields = JB2A_FACETS.map((facet) => {
    const title = label(`Filter${facet[0].toUpperCase()}${facet.slice(1)}`);
    const choices = facetValues(index, facet)
      .map((value) => opt(value, value, "")).join("");
    return `<label class="him-jb2a-browser__filter"><span>${escape(title)}</span>
      <select data-fx-filter="${facet}" aria-label="${escape(title)}">${opt("", label("All"), "")}${choices}</select></label>`;
  }).join("");
  // Only one picker per Settings window: avoid competing native modal dialogs.
  document.querySelector("dialog.him-jb2a-browser")?.close();
  const dlg = document.createElement("dialog");
  dlg.className = "him-jb2a-browser";
  dlg.innerHTML = `<section class="him-jb2a-browser__layout">
    <div class="him-jb2a-browser__list">
      <header><strong>${escape(label("Browse"))}</strong>
        <button type="button" data-fx-close aria-label="Close">×</button></header>
      <div class="him-jb2a-browser__filters">${filterFields}</div>
      <input type="search" data-fx-query placeholder="${escape(label("Search"))}" autocomplete="off">
      <p class="hint" data-fx-count></p>
      <div data-fx-results class="him-jb2a-results" role="listbox"></div>
      <nav class="him-jb2a-browser__pages" aria-label="${escape(label("PageNavigation"))}">
        <button type="button" data-fx-first title="${escape(label("FirstPage"))}" aria-label="${escape(label("FirstPage"))}">«</button>
        <button type="button" data-fx-previous title="${escape(label("PreviousPage"))}" aria-label="${escape(label("PreviousPage"))}">‹</button>
        <input data-fx-page type="number" min="1" step="1" value="1" aria-label="${escape(label("PageNumber"))}">
        <button type="button" data-fx-go title="${escape(label("GoPage"))}">${escape(label("GoPage"))}</button>
        <span data-fx-pages-count></span>
        <button type="button" data-fx-next title="${escape(label("NextPage"))}" aria-label="${escape(label("NextPage"))}">›</button>
        <button type="button" data-fx-last title="${escape(label("LastPage"))}" aria-label="${escape(label("LastPage"))}">»</button>
      </nav>
    </div>
    <div class="him-jb2a-browser__preview">
      <strong>${escape(label("Preview"))}</strong>
      <div class="him-jb2a-browser__media">
        <video data-fx-video muted loop playsinline autoplay controls hidden></video>
        <img data-fx-image alt="" hidden>
        <p data-fx-status>${escape(label("ChoosePreview"))}</p>
      </div>
      <p data-fx-path class="him-jb2a-browser__path"></p>
      <footer>
        <button type="button" data-fx-cancel>${escape(label("CancelEditor"))}</button>
        <button type="button" data-fx-confirm disabled>${escape(label("ConfirmEffect"))}</button>
      </footer>
    </div>
  </section>`;
  document.body.append(dlg);
  const search = dlg.querySelector("[data-fx-query]");
  const results = dlg.querySelector("[data-fx-results]");
  const count = dlg.querySelector("[data-fx-count]");
  const video = dlg.querySelector("[data-fx-video]");
  const image = dlg.querySelector("[data-fx-image]");
  const status = dlg.querySelector("[data-fx-status]");
  const pathLabel = dlg.querySelector("[data-fx-path]");
  const confirm = dlg.querySelector("[data-fx-confirm]");
  const pageInput = dlg.querySelector("[data-fx-page]");
  const pageCount = dlg.querySelector("[data-fx-pages-count]");
  const filters = Object.fromEntries(JB2A_FACETS.map((facet) => [facet, dlg.querySelector(`[data-fx-filter="${facet}"]`)]));
  let selected = paths.includes(current) ? current : "";
  let previewedPath = "";
  let previewRequest = 0;
  let filtered = index;
  let page = selected ? Math.floor(paths.indexOf(selected) / PAGE_SIZE) + 1 : 1;
  const stopMedia = () => {
    video.pause(); video.removeAttribute("src"); video.load();
    video.hidden = true; image.removeAttribute("src"); image.hidden = true;
  };
  const preview = async (path) => {
    const request = ++previewRequest;
    stopMedia();
    pathLabel.textContent = path;
    status.textContent = label("LoadingPreview");
    status.hidden = false;
    try {
      const file = await previewMediaPath(path);
      if (request !== previewRequest || !dlg.isConnected) return;
      if (!file) { status.textContent = label("PreviewUnavailable"); return; }
      if (/\.(png|jpe?g|webp)(?:[?#].*)?$/i.test(file)) {
        image.src = file; image.hidden = false;
      } else {
        video.src = file; video.hidden = false;
        void video.play().catch(() => {});
      }
      status.hidden = true;
    } catch (error) {
      if (request !== previewRequest) return;
      console.warn("JB2A browser | preview unavailable", error);
      status.textContent = label("PreviewUnavailable");
    }
  };
  const choose = (path) => {
    selected = path;
    if (previewedPath !== path) {
      previewedPath = path;
      void preview(path);
    }
    confirm.disabled = !selected;
    results.querySelectorAll("button[data-fx-path]").forEach((btn) => {
      const chosen = btn.dataset.fxPath === path;
      btn.classList.toggle("selected", chosen);
      btn.setAttribute("aria-selected", String(chosen));
    });
  };
  const render = () => {
    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    page = Math.min(Math.max(page, 1), totalPages);
    const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    const frag = document.createDocumentFragment();
    for (const item of visible) {
      const button = document.createElement("button");
      button.type = "button";
      button.setAttribute("role", "option");
      button.dataset.fxPath = item.path;
      button.textContent = item.path;
      button.title = item.path;
      button.addEventListener("click", () => choose(item.path));
      frag.append(button);
    }
    results.replaceChildren(frag);
    results.scrollTop = 0;
    count.textContent = `${filtered.length} ${label("Results")}`;
    pageInput.value = String(page);
    pageInput.max = String(totalPages);
    pageCount.textContent = `/ ${totalPages}`;
    dlg.querySelector("[data-fx-first]").disabled = page <= 1;
    dlg.querySelector("[data-fx-previous]").disabled = page <= 1;
    dlg.querySelector("[data-fx-next]").disabled = page >= totalPages;
    dlg.querySelector("[data-fx-last]").disabled = page >= totalPages;
    if (visible.length) choose(visible.some((item) => item.path === selected) ? selected : visible[0].path);
    else {
      selected = "";
      previewedPath = "";
      confirm.disabled = true;
      ++previewRequest;
      stopMedia(); status.hidden = false; status.textContent = label("NoMatches"); pathLabel.textContent = "";
    }
  };
  const applyFilters = () => {
    page = 1;
    const facets = Object.fromEntries(JB2A_FACETS.map((facet) => [facet, filters[facet].value]));
    filtered = filterJB2AIndex(index, search.value, facets);
    render();
  };
  const goPage = (target) => {
    const candidate = Number(target);
    if (!Number.isInteger(candidate)) { pageInput.value = String(page); return; }
    page = Math.max(1, Math.min(Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)), candidate));
    render();
  };
  dlg.querySelector("[data-fx-first]").addEventListener("click", () => goPage(1));
  dlg.querySelector("[data-fx-previous]").addEventListener("click", () => goPage(page - 1));
  dlg.querySelector("[data-fx-next]").addEventListener("click", () => goPage(page + 1));
  dlg.querySelector("[data-fx-last]").addEventListener("click", () => goPage(Math.ceil(filtered.length / PAGE_SIZE)));
  dlg.querySelector("[data-fx-go]").addEventListener("click", () => goPage(pageInput.value));
  pageInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") { event.preventDefault(); goPage(pageInput.value); }
  });
  dlg.querySelector("[data-fx-close]").addEventListener("click", () => dlg.close());
  dlg.querySelector("[data-fx-cancel]").addEventListener("click", () => dlg.close());
  confirm.addEventListener("click", () => { if (selected) { onChoose(selected); dlg.close(); } });
  dlg.addEventListener("close", () => { ++previewRequest; stopMedia(); dlg.remove(); }, { once: true });
  search.addEventListener("input", applyFilters);
  JB2A_FACETS.forEach((facet) => filters[facet].addEventListener("change", applyFilters));
  search.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    if (!filtered.length) return;
    event.preventDefault();
    const position = Math.max(0, filtered.findIndex((item) => item.path === selected));
    const next = Math.max(0, Math.min(filtered.length - 1, position + (event.key === "ArrowDown" ? 1 : -1)));
    const nextPage = Math.floor(next / PAGE_SIZE) + 1;
    if (page !== nextPage) { page = nextPage; render(); }
    choose(filtered[next].path);
    results.querySelectorAll("button[data-fx-path]").forEach((btn) => {
      if (btn.dataset.fxPath === selected) btn.scrollIntoView({ block: "nearest" });
    });
  });
  video.addEventListener("error", () => { video.hidden = true; status.hidden = false; status.textContent = label("PreviewUnavailable"); });
  image.addEventListener("error", () => { image.hidden = true; status.hidden = false; status.textContent = label("PreviewUnavailable"); });
  render(); dlg.showModal(); search.focus();
}

