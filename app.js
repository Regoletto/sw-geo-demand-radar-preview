const form = document.querySelector("#radarForm");
const progressPanel = document.querySelector("#progressPanel");
const progressBar = document.querySelector("#progressBar");
const progressTitle = document.querySelector("#progressTitle");
const progressSteps = Array.from(document.querySelectorAll("#progressSteps span"));
const resultPanel = document.querySelector("#resultPanel");
const resultHeadline = document.querySelector("#resultHeadline");
const resultSummary = document.querySelector("#resultSummary");
const resultSource = document.querySelector("#resultSource");
const signalList = document.querySelector("#signalList");
const solutionStrip = document.querySelector("#solutionStrip");
const ctaText = document.querySelector("#ctaText");

const steps = [
  "识别行业场景",
  "分析 AI 问答需求",
  "归纳客户顾虑",
  "匹配 SOLIDWORKS 方案",
];

const genericSolutions = [
  {
    name: "SOLIDWORKS 3D CAD",
    fit: "快速完成产品结构、装配关系与工程图输出，让概念设计更快进入可制造状态。",
  },
  {
    name: "SOLIDWORKS Simulation",
    fit: "在样机前验证强度、运动、热或流体相关风险，减少反复试制和现场返工。",
  },
  {
    name: "3DEXPERIENCE Works",
    fit: "连接设计、仿真、BOM、评审与跨部门协同，降低版本混乱和交付延误。",
  },
];

let libraryCache = null;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function setProgress(index, percent) {
  progressTitle.textContent = steps[index] || steps[0];
  progressBar.style.width = `${percent}%`;
  progressSteps.forEach((item, itemIndex) => {
    item.classList.toggle("active", itemIndex <= index);
  });
}

function normalizeText(value) {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, "");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function loadLibrary() {
  if (libraryCache) return libraryCache;
  const response = await fetch("data/industry_library.json", { cache: "no-store" });
  libraryCache = await response.json();
  return libraryCache;
}

function findLibraryEntry(industry, library) {
  const normalized = normalizeText(industry);
  return library.find((entry) => {
    const candidates = [entry.industry, ...(entry.aliases || [])];
    return candidates.some((candidate) => {
      const key = normalizeText(candidate);
      return key && (key.includes(normalized) || normalized.includes(key));
    });
  });
}

function generatedEntry(industry) {
  const clean = industry.trim() || "制造业";
  return {
    industry: clean,
    headline: `${clean}行业的终端客户在 AI 搜索中暴露出的需求信号`,
    summary: `系统从${clean}终端客户的采购、比较和使用顾虑出发，生成适合营销互动使用的 GEO 需求洞察。`,
    signals: [
      {
        question: `买${clean}前要先看哪些指标？`,
        pain: "你的客户通常不是一开始就问技术细节，而是想快速判断方案是否可靠、是否适合自己的场景、后续成本会不会失控。",
        solution: "SOLIDWORKS 3D CAD 可帮助企业把产品结构、配置和应用场景更直观地展示出来，让客户更容易理解方案差异。",
      },
      {
        question: `${clean}怎么判断质量靠不靠谱？`,
        pain: "这类问题反映出终端客户缺少判断依据，需要供应商拿出设计验证、测试逻辑和稳定交付能力。",
        solution: "SOLIDWORKS Simulation 可帮助企业在设计阶段形成可解释的验证依据，用更清楚的工程证据回应客户疑虑。",
      },
      {
        question: `${clean}后期维护和升级麻烦吗？`,
        pain: "终端客户会把维护便利性、交付资料完整性和后续升级能力视为采购风险的一部分。",
        solution: "3DEXPERIENCE Works 可帮助企业管理设计资料、BOM、变更和协作记录，让产品交付后的支持更有依据。",
      },
    ],
    solutions: genericSolutions,
    cta: "了解完整解决方案",
  };
}

async function analyzeIndustry(industry, email, consent) {
  if (industry.trim().length < 2) {
    throw new Error("请输入有效行业");
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
    throw new Error("请输入有效公司邮箱");
  }
  if (!consent) {
    throw new Error("请先确认信息使用授权");
  }

  const library = await loadLibrary();
  const entry = findLibraryEntry(industry, library) || generatedEntry(industry);
  const source = entry.aliases ? "cached" : "generated";
  return {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    industryInput: industry.trim(),
    industry: entry.industry || industry.trim(),
    headline: entry.headline || "",
    summary: entry.summary || "",
    signals: entry.signals || [],
    solutions: entry.solutions || genericSolutions,
    cta: entry.cta || "了解完整解决方案",
    source,
    generatedAt: new Date().toISOString(),
  };
}

function renderResult(data) {
  resultHeadline.textContent = data.headline || "你的客户在 AI 搜索中暴露出的需求信号";
  resultSummary.textContent = data.summary || "";
  resultSource.textContent = data.source === "cached" ? "行业库匹配" : "即时生成";
  ctaText.textContent = data.cta || "了解完整解决方案";

  signalList.innerHTML = (data.signals || [])
    .map((item, index) => {
      return `
        <article class="signal-item">
          <div class="signal-index">${String(index + 1).padStart(2, "0")}</div>
          <div>
            <h3>${escapeHtml(item.question)}</h3>
            <dl>
              <div>
                <dt>反映出的客户顾虑</dt>
                <dd>${escapeHtml(item.pain)}</dd>
              </div>
              <div>
                <dt>SOLIDWORKS 对应方案</dt>
                <dd>${escapeHtml(item.solution)}</dd>
              </div>
            </dl>
          </div>
        </article>
      `;
    })
    .join("");

  solutionStrip.innerHTML = (data.solutions || [])
    .map((item) => {
      return `
        <article class="solution-item">
          <h3>${escapeHtml(item.name)}</h3>
          <p>${escapeHtml(item.fit)}</p>
        </article>
      `;
    })
    .join("");

  resultPanel.classList.remove("hidden");
  resultPanel.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function runProgress(task) {
  progressPanel.classList.remove("hidden");
  resultPanel.classList.add("hidden");
  setProgress(0, 12);
  await sleep(650);
  setProgress(1, 38);
  await sleep(820);
  setProgress(2, 66);
  await sleep(760);
  setProgress(3, 88);
  const data = await task();
  await sleep(520);
  progressBar.style.width = "100%";
  await sleep(260);
  return data;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const submitButton = form.querySelector("button[type='submit']");
  submitButton.disabled = true;
  submitButton.querySelector("span").textContent = "分析中";

  try {
    const data = await runProgress(() =>
      analyzeIndustry(form.industry.value, form.email.value, form.consent.checked)
    );
    renderResult(data);
  } catch (error) {
    alert(error.message || "分析失败，请稍后再试。");
  } finally {
    submitButton.disabled = false;
    submitButton.querySelector("span").textContent = "查看行业需求";
  }
});
