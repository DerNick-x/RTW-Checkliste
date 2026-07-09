const sections = window.CHECKLIST_DATA || [];
const storageKey = "kreis-steinfurt-bestueckung-v2";
let checked = new Set(JSON.parse(localStorage.getItem(storageKey) || "[]"));
let groupFilter = "all";
let statusFilter = "all";
let query = "";
const sectionList = document.querySelector("#sectionList");
const sectionTemplate = document.querySelector("#sectionTemplate");
const itemTemplate = document.querySelector("#itemTemplate");
const overallPercent = document.querySelector("#overallPercent");
const overallText = document.querySelector("#overallText");
const overallBar = document.querySelector("#overallBar");
const doneCount = document.querySelector("#doneCount");
const openCount = document.querySelector("#openCount");
const search = document.querySelector("#search");
const resetAll = document.querySelector("#resetAll");
const allItems = () => sections.flatMap(section => section.items);
const isDone = item => checked.has(item.id);
const save = () => localStorage.setItem(storageKey, JSON.stringify([...checked]));
function normalize(value) { return value.toLocaleLowerCase("de-DE"); }
function matches(item, section) {
  const haystack = normalize(`${section.group} ${section.title} ${item.name} ${item.amount} ${item.note || ""}`);
  if (groupFilter !== "all" && section.group !== groupFilter) return false;
  if (statusFilter === "open" && isDone(item)) return false;
  if (statusFilter === "done" && !isDone(item)) return false;
  if (query && !haystack.includes(normalize(query))) return false;
  return true;
}
function updateProgress() {
  const total = allItems().length;
  const done = allItems().filter(isDone).length;
  const percent = total ? Math.round((done / total) * 100) : 0;
  overallPercent.textContent = `${percent}%`;
  overallText.textContent = done === total ? "Alles vollst?ndig abgehakt." : `${done} von ${total} Positionen abgehakt.`;
  overallBar.style.width = `${percent}%`;
  doneCount.textContent = done;
  openCount.textContent = total - done;
}
function render() {
  sectionList.replaceChildren();
  let visibleSections = 0;
  sections.forEach(section => {
    const visibleItems = section.items.filter(item => matches(item, section));
    if (!visibleItems.length) return;
    visibleSections += 1;
    const node = sectionTemplate.content.cloneNode(true);
    const article = node.querySelector(".check-section");
    const head = node.querySelector(".section-head");
    const pill = node.querySelector(".group-pill");
    const title = node.querySelector(".section-title");
    const meta = node.querySelector(".section-meta");
    const percentNode = node.querySelector(".section-percent");
    const miniBar = node.querySelector(".mini-bar span");
    const items = node.querySelector(".items");
    const sectionDone = section.items.filter(isDone).length;
    const sectionPercent = section.items.length ? Math.round((sectionDone / section.items.length) * 100) : 0;
    pill.textContent = section.group === "RTW" ? "RTW" : "Rucksack";
    title.textContent = section.title;
    meta.textContent = `${sectionDone}/${section.items.length} erledigt`;
    percentNode.textContent = `${sectionPercent}%`;
    miniBar.style.width = `${sectionPercent}%`;
    visibleItems.forEach(item => {
      const itemNode = itemTemplate.content.cloneNode(true);
      const label = itemNode.querySelector(".item");
      const checkbox = itemNode.querySelector("input");
      const name = itemNode.querySelector("strong");
      const note = itemNode.querySelector("small");
      const amount = itemNode.querySelector(".amount");
      checkbox.checked = isDone(item);
      label.classList.toggle("done", checkbox.checked);
      name.textContent = item.name;
      note.textContent = item.note || "";
      note.hidden = !item.note;
      amount.textContent = item.amount;
      checkbox.addEventListener("change", () => {
        checkbox.checked ? checked.add(item.id) : checked.delete(item.id);
        save();
        render();
      });
      items.append(itemNode);
    });
    head.addEventListener("click", () => article.classList.toggle("collapsed"));
    sectionList.append(node);
  });
  if (!visibleSections) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "Keine passenden Positionen gefunden.";
    sectionList.append(empty);
  }
  updateProgress();
}
document.querySelectorAll("[data-group]").forEach(button => button.addEventListener("click", () => {
  groupFilter = button.dataset.group;
  document.querySelectorAll("[data-group]").forEach(current => current.classList.toggle("active", current === button));
  render();
}));
document.querySelectorAll("[data-status]").forEach(button => button.addEventListener("click", () => {
  statusFilter = button.dataset.status;
  document.querySelectorAll("[data-status]").forEach(current => current.classList.toggle("active", current === button));
  render();
}));
search.addEventListener("input", () => { query = search.value.trim(); render(); });
resetAll.addEventListener("click", () => {
  if (!window.confirm("Alle H?kchen f?r die n?chste Schicht entfernen?")) return;
  checked = new Set();
  save();
  render();
});
render();

if ("serviceWorker" in navigator && location.protocol === "https:") {
  navigator.serviceWorker.register("service-worker.js").catch(() => {});
}
