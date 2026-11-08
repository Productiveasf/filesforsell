const form = document.getElementById("form");
const fileInput = document.getElementById("files");
const drop = document.getElementById("drop");
const dropText = document.getElementById("dropText");
const fileList = document.getElementById("fileList");
const deliveryMode = document.getElementById("deliveryMode");
const telegramFields = document.getElementById("telegramFields");
const checkBtn = document.getElementById("checkBtn");
const checkResult = document.getElementById("checkResult");
const submitBtn = document.getElementById("submitBtn");
const logSection = document.getElementById("log");
const logStatus = document.getElementById("logStatus");
const buildElapsed = document.getElementById("buildElapsed");
const logLines = document.getElementById("logLines");
const results = document.getElementById("results");

const PLATFORM_LABELS = {
  v7: "32-bit Android",
  v8: "64-bit Android",
  win: "Windows",
  linux: "Linux",
};

/* ── Ambient dot field (crystallizes to ember near cursor) ── */


/* ── State readers ── */
function getVersions() {
  return [...form.querySelectorAll('input[name="versions"]:checked')].map(i => i.value);
}
function getPlatforms() {
  return [...form.querySelectorAll('input[name="platforms"]:checked')].map(i => i.value);
}
function protectionLayers() {
  if (!obfuscate.checked) return [];
  const ids = ["antiSite", "antiDebug"];
  return ["String obfuscation", ...ids
    .map(id => document.getElementById(id))
    .filter(el => el && el.checked)
    .map(el => el.closest(".toggle").querySelector(".toggle-copy b")?.textContent || "")];
}

/* ── Topbar matrix ── */
const matrixCount = document.getElementById("matrixCount");
const matrixGrid = document.getElementById("matrixGrid");

function updateMatrix() {
  const n = getVersions().length * getPlatforms().length;
  matrixCount.textContent = n;
  document.querySelector(".matrix-label").textContent = n === 1 ? "build target" : "build targets";
  const cells = Math.min(Math.max(n, 0), 16);
  matrixGrid.innerHTML = "";
  for (let i = 0; i < 16; i++) {
    const cell = document.createElement("i");
    if (i < cells) cell.classList.add("lit");
    matrixGrid.appendChild(cell);
  }
}

/* ── Live pipeline (hero signature) ── */
function setStage(el, on, meta) {
  el.classList.toggle("on", on);
  const m = el.querySelector(".stage-meta");
  if (m && meta != null) m.textContent = meta;
}
function updatePipeline() {
  const n = getVersions().length * getPlatforms().length;
  const layers = protectionLayers().length;
  const delivery = deliveryMode.querySelector("input:checked").value;

  setStage(document.getElementById("pipeSource"), selectedFiles.length > 0,
    selectedFiles.length ? "File selected" : "No file");
  setStage(document.getElementById("pipeObf"), obfuscate.checked, obfuscate.checked ? "on" : "off");
  setStage(document.getElementById("pipeHarden"), layers > 0,
    `${layers} layer${layers === 1 ? "" : "s"}`);
  setStage(document.getElementById("pipeCompile"), n > 0,
    `${n} target${n === 1 ? "" : "s"}`);
  setStage(document.getElementById("pipeDeliver"), true,
    delivery === "bot" ? "telegram" : "download");
}

/* ── Live build-order manifest ── */
function updateSummary() {
  const versions = getVersions();
  const platforms = getPlatforms();
  const n = versions.length * platforms.length;
  const layers = protectionLayers();
  const bundle = form.querySelector('input[name="bundle_mode"]:checked').value;
  const delivery = deliveryMode.querySelector("input:checked").value;

  const sumCount = document.getElementById("sumCount");
  const sumFiles = document.getElementById("sumFiles");
  const sumObf = document.getElementById("sumObf");
  const sumProtect = document.getElementById("sumProtect");
  const sumTargets = document.getElementById("sumTargets");
  const sumOutput = document.getElementById("sumOutput");
  const sumDelivery = document.getElementById("sumDelivery");
  const sumNote = document.getElementById("sumNote");

  sumCount.textContent = n;

  sumFiles.textContent = selectedFiles.length
    ? selectedFiles[0].name
    : "No file selected";
  sumFiles.className = selectedFiles.length ? "on-live" : "";

  if (obfuscate.checked) {
    sumObf.textContent = "On";
    sumObf.className = "on-ember";
  } else {
    sumObf.textContent = "Off (not recommended)";
    sumObf.className = "";
  }

  sumProtect.textContent = layers.length ? layers.join(", ") : "None";
  sumProtect.className = layers.length ? "on-ember" : "";

  if (n === 0) {
    sumTargets.textContent = "—";
    sumTargets.className = "mono";
  } else {
    const combos = [];
    for (const v of versions) for (const p of platforms) {
      combos.push(`${v} · ${PLATFORM_LABELS[p] || p}`);
    }
    sumTargets.textContent = combos.length <= 3 ? combos.join("  ·  ") : `${combos.length} combinations`;
    sumTargets.className = "mono";
  }

  sumOutput.textContent = bundle === "zip" ? "Single ZIP" : "Individual files";
  sumDelivery.textContent = delivery === "bot" ? "Telegram" : "Download";

  if (!selectedFiles.length) sumNote.textContent = "Choose your source to begin.";
  else if (n === 0) sumNote.textContent = "Pick at least one version and platform.";
  else sumNote.textContent = `Ready to build ${n} output${n === 1 ? "" : "s"}.`;
}

function refreshAll() {
  updateMatrix();
  updatePipeline();
  updateSummary();
}
form.addEventListener("change", refreshAll);

/* ── File selection ── */
let selectedFiles = [];

function renderFiles() {
  fileList.innerHTML = "";
  for (const f of selectedFiles) {
    const li = document.createElement("li");
    li.textContent = f.name;
    fileList.appendChild(li);
  }
  drop.classList.toggle("loaded", selectedFiles.length > 0);
  dropText.innerHTML = selectedFiles.length
    ? "Source selected. Click to change."
    : "Choose your Python file";
  refreshAll();
}

drop.addEventListener("click", (e) => {
  if (e.target !== fileInput) fileInput.click();
});
drop.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    fileInput.click();
  }
});
fileInput.addEventListener("change", () => {
  selectedFiles = [...fileInput.files].filter(f => f.name.toLowerCase().endsWith(".py")).slice(0, 1);
  renderFiles();
});
["dragover", "dragleave", "drop"].forEach(evt => {
  drop.addEventListener(evt, (e) => {
    e.preventDefault();
    drop.classList.toggle("dragover", evt === "dragover");
  });
});
drop.addEventListener("drop", (e) => {
  const dropped = [...e.dataTransfer.files].filter(f => f.name.toLowerCase().endsWith(".py"));
  if (dropped.length) {
    selectedFiles = dropped.slice(0, 1);
    renderFiles();
  }
});

/* ── Segmented active state ── */
for (const seg of document.querySelectorAll(".seg")) {
  seg.addEventListener("change", () => {
    seg.querySelectorAll(".segopt").forEach(o => {
      o.classList.toggle("active", o.querySelector("input").checked);
    });
  });
}

/* ── Conditional sections ── */
const antiSite = document.getElementById("antiSite");
const antiDebug = document.getElementById("antiDebug");
const obfuscate = document.getElementById("obfuscate");
const obfWarn = document.getElementById("obfWarn");
const obfOptions = document.getElementById("obfOptions");
function syncObfOptions() {
  obfWarn.classList.toggle("hidden", obfuscate.checked);
  obfOptions.classList.remove("hidden");
  obfOptions.classList.toggle("is-disabled", !obfuscate.checked);
  antiSite.disabled = !obfuscate.checked;
  antiDebug.disabled = !obfuscate.checked;
}
obfuscate.addEventListener("change", syncObfOptions);
syncObfOptions();

deliveryMode.addEventListener("change", () => {
  const val = deliveryMode.querySelector("input:checked").value;
  telegramFields.classList.toggle("hidden", val !== "bot");
});



/* ── Telegram verify ── */
checkBtn.addEventListener("click", async () => {
  const token = document.getElementById("token").value.trim();
  const chatId = document.getElementById("chatId").value.trim();
  checkResult.textContent = "Checking...";
  checkResult.className = "check-result";
  try {
    const r = await fetch("/api/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, chat_id: chatId }),
    });
    const d = await r.json();
    checkResult.textContent = d.ok ? "Verified" : (d.error || "Failed");
    checkResult.className = "check-result " + (d.ok ? "ok" : "bad");
  } catch (e) {
    checkResult.textContent = "Network error";
    checkResult.className = "check-result bad";
  }
});

/* ── Console helpers ── */
function addLine(text, cls) {
  const div = document.createElement("div");
  if (cls) div.className = cls;
  div.textContent = text;
  logLines.appendChild(div);
  logLines.scrollTop = logLines.scrollHeight;
}

function addResultLink(url, name) {
  const a = document.createElement("a");
  a.className = "btn primary";
  a.href = url;
  a.textContent = `Download ${name}`;
  a.setAttribute("download", name);
  results.appendChild(a);
}

let timerId = null;
let buildStartedAt = 0;
function fmtElapsed(ms) {
  const s = Math.floor(ms / 1000);
  return String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0");
}
function startTimer() {
  stopTimer();
  buildStartedAt = performance.now();
  const tick = () => {
    setStatus("Building", "run");
    buildElapsed.textContent = `Elapsed ${fmtElapsed(performance.now() - buildStartedAt)}`;
  };
  tick();
  timerId = setInterval(tick, 1000);
}
function stopTimer() {
  if (timerId) { clearInterval(timerId); timerId = null; }
}

function setStatus(text, cls) {
  logStatus.textContent = text;
  logStatus.className = "log-status" + (cls ? " " + cls : "");
}

/* ── Submit / build ── */
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!selectedFiles.length) {
    alert("Choose a .py file");
    return;
  }
  const versions = getVersions();
  const platforms = getPlatforms();
  if (!versions.length) { alert("Select at least one Python version"); return; }
  if (!platforms.length) { alert("Select at least one platform"); return; }

  const bundleMode = form.querySelector('input[name="bundle_mode"]:checked').value;
  const delivery = deliveryMode.querySelector("input:checked").value;

  const fd = new FormData();
  fd.append("files", selectedFiles[0]);
  fd.append("versions", versions.join(","));
  fd.append("platforms", platforms.join(","));
  fd.append("bundle_mode", bundleMode);

  fd.append("c_level_obf", "1");
  if (obfuscate.checked) {
    fd.append("obfuscate", "1");
    fd.append("strings", selectedFiles[0].size > 20 * 1024 ? "low" : "high");
    fd.append("name_prefix", "l");
    fd.append("min_length", "3");
    fd.append("max_length", "7");
    fd.append("coding", ["chinese", "l", "o"][Math.floor(Math.random() * 3)]);
    if (antiSite.checked) fd.append("anti_site", "1");
    if (antiDebug.checked) fd.append("anti_debug", "1");
    fd.append("stein_best", "1");
  }
  const bannerEl = document.getElementById("banner");
  if (bannerEl) fd.append("banner", bannerEl.value);

  let endpoint = "/api/download";
  if (delivery === "bot") {
    const token = document.getElementById("token").value.trim();
    const chatId = document.getElementById("chatId").value.trim();
    if (!token || !chatId) { alert("Enter bot token and chat ID"); return; }
    fd.append("token", token);
    fd.append("chat_id", chatId);
    endpoint = "/api/encrypt";
  }

  submitBtn.disabled = true;
  submitBtn.textContent = "Building…";
  logSection.classList.remove("hidden");
  startTimer();
  logLines.innerHTML = "";
  results.innerHTML = "";
  logSection.scrollIntoView({ behavior: "smooth", block: "nearest" });

  let failed = false;
  try {
    const resp = await fetch(endpoint, { method: "POST", body: fd });
    if (!resp.ok || !resp.body) {
      const d = await resp.json().catch(() => ({}));
      addLine(d.error || `Request failed (${resp.status})`, "err");
      failed = true;
      return;
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buf = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const events = buf.split("\n\n");
      buf = events.pop();
      for (const raw of events) {
        const line = raw.trim();
        if (!line || line.startsWith(":")) continue;
        if (!line.startsWith("data:")) continue;
        const payload = JSON.parse(line.slice(5).trim());
        if (payload.type === "progress") addLine(payload.message);
        else if (payload.type === "error") { addLine(payload.message, "err"); failed = true; }
        else if (payload.type === "file_ready") {
          addLine(`Ready: ${payload.name}`, "ok");
          addResultLink(payload.download_url, payload.name);
        } else if (payload.type === "done") {
          addLine(payload.message || "Done", "ok");
          if (payload.download_url) addResultLink(payload.download_url, payload.name);
        }
      }
    }
  } catch (err) {
    addLine("Connection lost: " + err.message, "err");
    failed = true;
  } finally {
    const duration = performance.now() - buildStartedAt;
    stopTimer();
    submitBtn.disabled = false;
    submitBtn.textContent = "Run build";
    setStatus(failed ? "Failed" : "Complete", failed ? "fail" : "done");
    const elapsed = duration < 60000 ? `${(duration / 1000).toFixed(1)}s` : fmtElapsed(duration);
    buildElapsed.textContent = `${failed ? "Stopped after" : "Completed in"} ${elapsed}`;
  }
});

/* ── Init ── */
refreshAll();
