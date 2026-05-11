const STORAGE_KEY = "first-star-kit-state-v1";

const sampleState = {
  projectName: "First Star Kit",
  tagline: "Turn a rough side project into a star-ready GitHub launch kit.",
  audience: "developers shipping tiny open-source tools",
  problem:
    "their repo looks useful, but strangers cannot understand it fast enough to star it",
  promise:
    "generating a crisp README, repo metadata, and launch posts in one calm workspace",
  demoUrl: "https://example.com/demo",
  repoUrl: "https://github.com/you/first-star-kit",
  installCommand: "Open index.html",
  usageCommand: "Describe your project, then copy the generated launch kit.",
  status: "MVP",
  license: "MIT",
  keywords: "github, readme, launch, open-source, marketing, developer-tools",
  tone: "direct",
};

const blankState = {
  projectName: "",
  tagline: "",
  audience: "",
  problem: "",
  promise: "",
  demoUrl: "",
  repoUrl: "",
  installCommand: "",
  usageCommand: "",
  status: "MVP",
  license: "MIT",
  keywords: "",
  tone: "direct",
};

let state = loadInitialState();
let activeTab = "readme";

function loadInitialState() {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved ? { ...blankState, ...JSON.parse(saved) } : { ...sampleState };
  } catch {
    return { ...sampleState };
  }
}

function saveState() {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function clampScore(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function hasUrl(value) {
  return /^https?:\/\/\S+\.\S+/.test(String(value).trim());
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function sentence(value, fallback) {
  const text = String(value || "").trim();
  if (!text) return fallback;
  return /[.!?]$/.test(text) ? text : `${text}.`;
}

function compact(value, max = 150) {
  const text = String(value || "").trim().replace(/\s+/g, " ");
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trim()}...`;
}

function splitKeywords(value) {
  return String(value || "")
    .split(",")
    .map((item) => slugify(item))
    .filter(Boolean)
    .slice(0, 10);
}

function buildRepoDescription(data) {
  const name = data.projectName.trim() || "This project";
  const audience = data.audience.trim() || "developers";
  const problem = data.problem.trim() || "a focused workflow";
  return compact(`${name} helps ${audience} with ${problem}`, 155);
}

function toneLead(tone) {
  if (tone === "playful") return "I made a tiny thing";
  if (tone === "technical") return "I built a small developer tool";
  return "I built a focused tool";
}

function buildReadme(data) {
  const name = data.projectName.trim() || "Project Name";
  const tagline = data.tagline.trim() || "A clear one-line promise for your project.";
  const audience = data.audience.trim() || "people who need this workflow";
  const problem = data.problem.trim() || "the current workflow takes too much time";
  const promise = data.promise.trim() || "making the next step obvious";
  const install = data.installCommand.trim() || "Open index.html";
  const usage = data.usageCommand.trim() || "Run the app and follow the prompts.";
  const repo = data.repoUrl.trim();
  const demo = data.demoUrl.trim();
  const keywords = splitKeywords(data.keywords);

  return `# ${name}

> ${tagline}

${name} helps ${audience} solve this: ${sentence(problem, "the current workflow is slower than it needs to be")} It does that by ${promise}.

${demo ? `Live demo: ${demo}\n` : "Add a screenshot or demo link here before launch.\n"}
${repo ? `Repository: ${repo}\n` : ""}
## Why this exists

- The problem is specific: ${sentence(problem, "the pain is easy to recognize")}
- The intended user is clear: ${sentence(audience, "a specific group of people")}
- The promise is practical: ${sentence(promise, "one useful outcome")}

## Quick start

\`\`\`bash
${install}
\`\`\`

## Usage

${usage}

## What to try first

1. Run the project locally.
2. Try the smallest useful workflow.
3. Open an issue if the result is confusing, slow, or missing an obvious next step.

## Project status

${data.status || "MVP"}. Feedback is welcome, especially from ${audience}.

## Topics

${keywords.length ? keywords.map((keyword) => `\`${keyword}\``).join(" ") : "`open-source` `developer-tools`"}

## License

${data.license || "MIT"}`;
}

function buildLaunchPosts(data) {
  const name = data.projectName.trim() || "my new project";
  const tagline = sentence(data.tagline, "it makes a small developer workflow easier");
  const problem = sentence(
    data.problem,
    "I wanted the first-time experience to be easier to understand",
  );
  const promise = sentence(
    data.promise,
    "it turns rough input into something immediately useful",
  );
  const repo = data.repoUrl.trim() || "[repo link]";
  const demo = data.demoUrl.trim();
  const lead = toneLead(data.tone);

  return [
    {
      title: "X / Threads",
      text: `${lead}: ${name}.\n\n${tagline}\n\nI built it because ${problem}\n\nRepo: ${repo}${demo ? `\nDemo: ${demo}` : ""}`,
    },
    {
      title: "Reddit / Discord",
      text: `I shipped a small ${data.status || "MVP"} called ${name}.\n\nIt is for ${data.audience || "developers"} who run into this problem: ${problem}\n\nThe goal is simple: ${promise}\n\nI would love a quick first-impression check from people who have felt this pain.\n\n${repo}`,
    },
    {
      title: "Hacker News",
      text: `Show HN: ${name} - ${compact(data.tagline || "a small tool for developers", 70)}\n\nI built ${name} because ${problem} The project is intentionally small: ${promise}\n\n${repo}${demo ? `\n\nDemo: ${demo}` : ""}`,
    },
    {
      title: "Friendly DM",
      text: `Hey, I made a tiny open-source tool and I am trying to get one honest first impression today.\n\n${name}: ${tagline}\n\nCould you look at the repo for 30 seconds and tell me if the value is clear?\n${repo}`,
    },
  ];
}

function buildRepoChecklist(data) {
  const topics = splitKeywords(data.keywords);
  const name = data.projectName.trim() || "project-name";
  const slug = slugify(name) || "project-name";

  return {
    slug,
    description: buildRepoDescription(data),
    topics: topics.length ? topics : ["open-source", "developer-tools", "productivity"],
    issues: [
      "Add first screenshot or 20-second demo GIF",
      `Create "good first issue" for ${name}`,
      "Add installation smoke test to README",
      "Write a one-sentence comparison against the slow/manual way",
    ],
  };
}

function getScores(data) {
  const clarity = clampScore(
    20 +
      (data.projectName.trim() ? 20 : 0) +
      (data.tagline.trim().length > 25 ? 25 : 0) +
      (data.audience.trim().length > 12 ? 20 : 0) +
      (data.problem.trim().length > 20 ? 15 : 0),
  );

  const trust = clampScore(
    10 +
      (hasUrl(data.repoUrl) ? 20 : 0) +
      (hasUrl(data.demoUrl) ? 25 : 0) +
      (data.installCommand.trim() ? 20 : 0) +
      (data.license.trim() ? 10 : 0) +
      (data.status.trim() ? 15 : 0),
  );

  const share = clampScore(
    15 +
      (data.promise.trim().length > 24 ? 25 : 0) +
      (splitKeywords(data.keywords).length >= 4 ? 20 : 0) +
      (data.tagline.trim().length < 110 && data.tagline.trim().length > 20 ? 25 : 0) +
      (data.tone ? 15 : 0),
  );

  return [
    {
      label: "Clarity",
      score: clarity,
      hint: "Can a stranger understand the repo in ten seconds?",
    },
    {
      label: "Trust",
      score: trust,
      hint: "Does the project show proof, status, and a way to try it?",
    },
    {
      label: "Share",
      score: share,
      hint: "Is the launch message specific enough to repeat?",
    },
  ];
}

function icon(name) {
  return `<svg class="icon"><use href="#i-${name}"></use></svg>`;
}

function copyButton(key) {
  return `<button class="copy-button" type="button" data-copy="${key}">${icon("clipboard")}<span>Copy</span></button>`;
}

function setInputs() {
  document.querySelectorAll("[data-field]").forEach((input) => {
    input.value = state[input.dataset.field] || "";
  });
}

function renderReadme(readme) {
  document.getElementById("readmePreview").textContent = readme;
}

function renderLaunch(posts) {
  const panel = document.querySelector('[data-panel="launch"]');
  panel.innerHTML = posts
    .map(
      (post, index) => `
        <article class="copy-block">
          <div class="copy-block-head">
            <h2>${escapeHtml(post.title)}</h2>
            ${copyButton(`post:${index}`)}
          </div>
          <p>${escapeHtml(post.text)}</p>
        </article>
      `,
    )
    .join("");
}

function renderRepo(repoKit) {
  const panel = document.querySelector('[data-panel="repo"]');
  panel.innerHTML = `
    <article class="copy-block">
      <div class="copy-block-head">
        <h2>Repository name</h2>
        ${copyButton("repoName")}
      </div>
      <p>${escapeHtml(repoKit.slug)}</p>
    </article>

    <article class="copy-block">
      <div class="copy-block-head">
        <h2>Description</h2>
        ${copyButton("description")}
      </div>
      <p>${escapeHtml(repoKit.description)}</p>
    </article>

    <article class="copy-block">
      <div class="copy-block-head">
        <h2>Topics</h2>
        ${copyButton("topics")}
      </div>
      <div class="topic-row">
        ${repoKit.topics.map((topic) => `<span>${escapeHtml(topic)}</span>`).join("")}
      </div>
    </article>

    <article class="copy-block">
      <div class="copy-block-head">
        <h2>First issues</h2>
        ${copyButton("issues")}
      </div>
      <ul class="issue-list">
        ${repoKit.issues.map((issue) => `<li>${escapeHtml(issue)}</li>`).join("")}
      </ul>
    </article>
  `;
}

function renderScores(scores) {
  const total = Math.round(scores.reduce((sum, item) => sum + item.score, 0) / scores.length);
  document.getElementById("totalScore").textContent = `${total}/100`;
  document.getElementById("scoreRingValue").textContent = total;
  const ring = document.getElementById("scoreRing");
  ring.style.background = `conic-gradient(#0e7c7b ${total * 3.6}deg, #d9e1eb 0deg)`;
  ring.setAttribute("aria-label", `Score ${total}`);

  document.getElementById("scoreList").innerHTML = scores
    .map(
      (item) => `
        <div class="score-item">
          <div>
            <strong>${escapeHtml(item.label)}</strong>
            <span>${escapeHtml(item.hint)}</span>
          </div>
          <meter min="0" max="100" value="${item.score}">${item.score}</meter>
        </div>
      `,
    )
    .join("");
}

function renderPreview(repoKit) {
  document.getElementById("previewName").textContent = state.projectName || "project-name";
  document.getElementById("previewDescription").textContent = repoKit.description;
  document.getElementById("previewTopics").innerHTML = repoKit.topics
    .slice(0, 6)
    .map((topic) => `<span>${escapeHtml(topic)}</span>`)
    .join("");

  const links = [];
  if (hasUrl(state.repoUrl)) {
    links.push(
      `<a href="${escapeHtml(state.repoUrl)}" target="_blank" rel="noreferrer">${icon("github")}Repo</a>`,
    );
  }
  if (hasUrl(state.demoUrl)) {
    links.push(
      `<a href="${escapeHtml(state.demoUrl)}" target="_blank" rel="noreferrer">${icon("play")}Demo</a>`,
    );
  }
  document.getElementById("previewLinks").innerHTML = links.join("");
}

function render() {
  const readme = buildReadme(state);
  const posts = buildLaunchPosts(state);
  const repoKit = buildRepoChecklist(state);
  const scores = getScores(state);

  renderReadme(readme);
  renderLaunch(posts);
  renderRepo(repoKit);
  renderScores(scores);
  renderPreview(repoKit);
  setActiveTab(activeTab);
}

function setActiveTab(tab) {
  activeTab = tab;
  document.querySelectorAll("[data-tab]").forEach((button) => {
    button.classList.toggle("active", button.dataset.tab === tab);
  });
  document.querySelectorAll("[data-panel]").forEach((panel) => {
    panel.hidden = panel.dataset.panel !== tab;
  });
}

async function copyText(text, button) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    if (button) {
      const label = button.querySelector("span");
      const original = label.textContent;
      label.textContent = "Copied";
      button.classList.add("copied");
      window.setTimeout(() => {
        label.textContent = original;
        button.classList.remove("copied");
      }, 1200);
    }
  } catch {
    window.alert("Copy failed. Select the text manually.");
  }
}

function textForCopy(key) {
  const readme = buildReadme(state);
  const posts = buildLaunchPosts(state);
  const repoKit = buildRepoChecklist(state);

  if (key === "readme") return readme;
  if (key.startsWith("post:")) return posts[Number(key.split(":")[1])].text;
  if (key === "repoName") return repoKit.slug;
  if (key === "description") return repoKit.description;
  if (key === "topics") return repoKit.topics.join(", ");
  if (key === "issues") return repoKit.issues.map((issue) => `- ${issue}`).join("\n");
  return "";
}

function exportMarkdown() {
  const repoKit = buildRepoChecklist(state);
  const file = new Blob([buildReadme(state)], { type: "text/markdown" });
  const url = URL.createObjectURL(file);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${repoKit.slug || "README"}.md`;
  anchor.click();
  URL.revokeObjectURL(url);
}

document.querySelectorAll("[data-field]").forEach((input) => {
  input.addEventListener("input", () => {
    state = { ...state, [input.dataset.field]: input.value };
    saveState();
    render();
  });
});

document.querySelectorAll("[data-tab]").forEach((button) => {
  button.addEventListener("click", () => setActiveTab(button.dataset.tab));
});

document.addEventListener("click", (event) => {
  const copy = event.target.closest("[data-copy]");
  if (copy) {
    copyText(textForCopy(copy.dataset.copy), copy);
    return;
  }

  const action = event.target.closest("[data-action]");
  if (!action) return;

  if (action.dataset.action === "sample") {
    state = { ...sampleState };
    saveState();
    setInputs();
    render();
  }

  if (action.dataset.action === "clear") {
    state = { ...blankState };
    saveState();
    setInputs();
    render();
  }

  if (action.dataset.action === "export") {
    exportMarkdown();
  }
});

setInputs();
render();
