const STORAGE_KEY = "first-star-kit-state-v1";

const sampleState = {
  projectName: "First Star Kit",
  tagline: "Turn a rough side project into a star-ready GitHub launch kit.",
  audience: "developers shipping tiny open-source tools",
  problem:
    "their repo looks useful, but strangers cannot understand it fast enough to star it",
  promise:
    "generating a crisp README, repo metadata, and launch posts in one calm workspace",
  demoUrl: "https://notoow.github.io/first-star-kit/",
  repoUrl: "https://github.com/notoow/first-star-kit",
  installCommand: "Open index.html",
  usageCommand: "Describe your project, then copy the generated launch kit.",
  status: "MVP",
  license: "MIT",
  keywords: "github, readme, launch, open-source, marketing, developer-tools",
  tone: "direct",
  repoPulse: null,
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
  repoPulse: null,
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

function titleizeRepoName(value) {
  return String(value || "")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .trim();
}

function uniqueList(values) {
  return [...new Set(values.map((value) => slugify(value)).filter(Boolean))];
}

function parseGitHubRepoUrl(value) {
  const text = String(value || "").trim();
  const match = text.match(/^https?:\/\/github\.com\/([^/\s]+)\/([^/\s#?]+?)(?:\.git)?(?:[/?#].*)?$/i);
  if (!match) return null;
  return {
    owner: match[1],
    repo: match[2].replace(/\.git$/i, ""),
  };
}

function extractInstallCommand(readme) {
  const text = String(readme || "");
  const fences = [...text.matchAll(/```(?:bash|sh|shell|zsh|powershell|ps1|console)?\s*([\s\S]*?)```/gi)];
  const installish = /(npm|pnpm|yarn|bun|pip|uv|cargo|go run|go install|deno|python|ruby|gem|composer|docker)/i;

  for (const fence of fences) {
    const lines = fence[1]
      .split("\n")
      .map((line) => line.replace(/^\s*[$>]\s?/, "").trim())
      .filter((line) => line && !line.startsWith("#"));
    if (lines.some((line) => installish.test(line))) {
      return lines.slice(0, 3).join("\n");
    }
  }

  const line = text
    .split("\n")
    .map((item) => item.trim())
    .find((item) => /^(npm|pnpm|yarn|bun|pip|uv|cargo|go|deno|python|docker)\b/i.test(item));
  return line || "";
}

function analyzeReadme(readme) {
  const text = String(readme || "");
  const lower = text.toLowerCase();
  const imagePattern = /!\[[^\]]*\]\([^)]+\)|<img\b/i;
  const demoPattern = /\b(demo|preview|screenshot|live|try it|playground)\b/i;
  const installPattern = /\b(quick start|getting started|installation|install|usage|setup)\b/i;
  const contributionPattern = /\b(contributing|contribute|good first issue|help wanted|pull request|issue)\b/i;

  return {
    exists: Boolean(text.trim()),
    wordCount: text.trim() ? text.trim().split(/\s+/).length : 0,
    headingCount: (text.match(/^#{1,3}\s+/gm) || []).length,
    hasInstall: Boolean(extractInstallCommand(text)) || installPattern.test(text),
    hasDemo: demoPattern.test(text) || hasUrl(text.match(/https?:\/\/[^\s)]+/)?.[0] || ""),
    hasScreenshot: imagePattern.test(text),
    hasLicenseMention: lower.includes("license"),
    hasContributionPath: contributionPattern.test(text),
  };
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

function buildHooks(data) {
  const name = data.projectName.trim() || "my side project";
  const audience = data.audience.trim() || "developers";
  const problem = data.problem.trim() || "the first-time experience is too hard to understand";
  const promise = data.promise.trim() || "making the next useful step obvious";
  const tagline = data.tagline.trim() || "A focused tool for a specific workflow.";

  return [
    {
      title: "Problem-first",
      text: `${audience} keep running into this: ${problem}. ${name} helps by ${promise}.`,
    },
    {
      title: "Fast promise",
      text: `${name}: ${tagline}`,
    },
    {
      title: "Before / after",
      text: `Before: ${compact(problem, 95)}\nAfter: ${compact(promise, 95)}`,
    },
    {
      title: "Feedback ask",
      text: `I am looking for one honest first-impression check: does ${name} make sense in under 30 seconds?`,
    },
    {
      title: "Star reason",
      text: `Star ${name} if you want to revisit this workflow: ${compact(promise, 100)}.`,
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

function daysSince(value) {
  if (!value) return null;
  const time = new Date(value).getTime();
  if (Number.isNaN(time)) return null;
  return Math.max(0, Math.round((Date.now() - time) / 86400000));
}

function buildSprintPlan(data, repoKit, totalScore) {
  const pulse = data.repoPulse;
  const items = [];
  const missingLinks = !hasUrl(data.demoUrl) || !hasUrl(data.repoUrl);
  const lowTopics = repoKit.topics.length < 5;
  const hasFirstStar = pulse && pulse.stars > 0;

  items.push({
    time: "0-5 min",
    title: pulse ? "Fix the first visible gap" : "Import the repo",
    detail: pulse
      ? firstPulseNudge(data, pulse, repoKit)
      : "Paste a public GitHub URL and import it so the sprint can use live repo context.",
  });
  items.push({
    time: "5-12 min",
    title: "Sharpen the repo face",
    detail: missingLinks
      ? "Add the repo and demo links in the top half of the README."
      : `Use this description: ${repoKit.description}`,
  });
  items.push({
    time: "12-18 min",
    title: "Create one low-friction entry point",
    detail: lowTopics
      ? "Add a few searchable topics so the repo is findable after the launch post fades."
      : `Open this issue: ${repoKit.issues[0]}`,
  });
  items.push({
    time: "18-25 min",
    title: "Post where the pain is already obvious",
    detail: buildHooks(data)[0].text,
  });
  items.push({
    time: "25-30 min",
    title: hasFirstStar ? "Ask for the second honest signal" : "Ask for the first honest signal",
    detail: buildLaunchPosts(data).find((post) => post.title === "Friendly DM").text,
  });

  if (totalScore < 80) {
    items.unshift({
      time: "Before posting",
      title: "Raise the readiness score",
      detail: getNudges(data)[0],
    });
  }

  return items.slice(0, 6);
}

function buildDoctor(data, repoKit) {
  const pulse = data.repoPulse;
  const stats = pulse && pulse.readmeStats;
  const imported = Boolean(pulse);
  const checks = [
    {
      label: "Repo context",
      ok: imported,
      why: imported ? `Using live context from ${pulse.fullName}.` : "The doctor is strongest after a public GitHub import.",
      fix: imported ? "Refresh import after major README changes." : "Paste a public GitHub URL and press Import.",
    },
    {
      label: "README front door",
      ok: stats ? stats.exists && stats.wordCount >= 80 : true,
      why: stats
        ? stats.exists
          ? `${stats.wordCount} words and ${stats.headingCount} headings found.`
          : "No README was found on the default branch."
        : "The generated README is ready to export.",
      fix: stats && !stats.exists ? "Add README.md before sharing the repo." : "Keep the first screen focused on the promise, demo, and quick start.",
    },
    {
      label: "One-line promise",
      ok: data.tagline.trim().length >= 24 && data.tagline.trim().length <= 130,
      why: data.tagline.trim() ? `"${compact(data.tagline, 90)}"` : "No tagline yet.",
      fix: "Write one sentence that says who it helps and what changes after using it.",
    },
    {
      label: "Try path",
      ok: Boolean(data.installCommand.trim()) && (stats ? stats.hasInstall : true),
      why: data.installCommand.trim() ? compact(data.installCommand, 110) : "No quick-start command yet.",
      fix: "Add the shortest install or open command near the top of the README.",
    },
    {
      label: "Proof",
      ok: hasUrl(data.demoUrl) || Boolean(stats && (stats.hasDemo || stats.hasScreenshot)),
      why: hasUrl(data.demoUrl)
        ? "A demo URL is visible."
        : stats && stats.hasScreenshot
          ? "A screenshot appears in README."
          : "No demo or screenshot signal yet.",
      fix: "Add a live demo, screenshot, or 20-second GIF above the feature list.",
    },
    {
      label: "Reuse permission",
      ok: Boolean(data.license.trim()) || Boolean(pulse && pulse.license) || Boolean(stats && stats.hasLicenseMention),
      why: data.license.trim() || (pulse && pulse.license) || "License is unclear.",
      fix: "Add a LICENSE file and mention it in the README.",
    },
    {
      label: "Findability",
      ok: repoKit.topics.length >= 5,
      why: `${repoKit.topics.length} topics prepared.`,
      fix: "Use at least five concrete GitHub topics, including the audience and workflow.",
    },
    {
      label: "Next contribution",
      ok: Boolean(stats && stats.hasContributionPath),
      why: stats && stats.hasContributionPath ? "README mentions issues, PRs, or contribution." : "No visible contributor path found.",
      fix: `Create this starter issue: ${repoKit.issues[0]}`,
    },
  ];

  const passed = checks.filter((check) => check.ok).length;
  return {
    passed,
    total: checks.length,
    checks,
  };
}

function buildPatchSections(data, repoKit, doctor) {
  const name = data.projectName.trim() || "Project Name";
  const tagline = data.tagline.trim() || "A clear one-line promise for your project.";
  const audience = data.audience.trim() || "developers";
  const problem = data.problem.trim() || "the current workflow takes too much effort";
  const promise = data.promise.trim() || "making the next step obvious";
  const demo = data.demoUrl.trim();
  const repo = data.repoUrl.trim();
  const install = data.installCommand.trim() || "Open the project and follow the README.";
  const issueTitle = `Improve the first-run experience for ${name}`;
  const failedChecks = doctor.checks.filter((check) => !check.ok);
  const topFixes = failedChecks.length
    ? failedChecks.map((check) => `- ${check.label}: ${check.fix}`).join("\n")
    : "- Keep the README promise, demo, quick start, and first issue visible above the fold.";

  return [
    {
      title: "README hero",
      text: `# ${name}

> ${tagline}

${name} helps ${audience} who run into this problem: ${sentence(problem, "the workflow is harder than it should be")} It helps by ${promise}.

${demo ? `Demo: ${demo}\n` : ""}${repo ? `Repo: ${repo}\n` : ""}`,
    },
    {
      title: "Quick start",
      text: `## Quick start

\`\`\`bash
${install}
\`\`\`

Try the smallest useful path first. If anything is confusing, open an issue with the step that failed and what you expected to happen.`,
    },
    {
      title: "Why this exists",
      text: `## Why this exists

- Problem: ${sentence(problem, "the pain is specific")}
- Audience: ${sentence(audience, "the user is specific")}
- Outcome: ${sentence(promise, "the result is practical")}
- Status: ${data.status || "MVP"}, with feedback especially welcome from ${audience}.`,
    },
    {
      title: "Starter issue",
      text: `Title: ${issueTitle}

Body:
The first-run path should feel obvious to someone landing on the repo for the first time.

Tasks:
- Confirm the README explains the problem in one screen.
- Confirm the demo or screenshot is visible before the feature list.
- Run the quick start and note the first confusing step.
- Suggest one sentence that would make the value clearer.

Good first issue: yes`,
    },
    {
      title: "Doctor fixes",
      text: `## First-impression fixes

${topFixes}

Prepared with First Star Kit.`,
    },
    {
      title: "Feedback ask",
      text: `I am trying to make ${name} understandable in under 30 seconds.

Could you look at the README and tell me:
1. What do you think it does?
2. Would you try it?
3. What sentence or screenshot is missing?

${repo || "[repo link]"}`,
    },
  ];
}

function firstPulseNudge(data, pulse, repoKit) {
  if (!pulse.readmeFound) return "Add a README before sharing. No launch copy can beat a missing front door.";
  if (!hasUrl(data.demoUrl)) return "Add a live demo or screenshot link so people can inspect the result.";
  if (!pulse.license) return "Add a license so people know whether they can reuse the project.";
  if (repoKit.topics.length < 5) return "Add at least five topics so GitHub can place the repo in the right rooms.";
  if (daysSince(pulse.pushedAt) > 30) return "Push a tiny recent polish commit so the repo looks alive.";
  return "The basics are in place. Share it with one person who has this exact problem.";
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

function getNudges(data) {
  const nudges = [];
  if (!data.projectName.trim()) nudges.push("Name the project before sharing.");
  if (data.tagline.trim().length < 24) nudges.push("Make the one-line promise more concrete.");
  if (data.problem.trim().length < 24) nudges.push("Describe the pain in a stranger's words.");
  if (!hasUrl(data.repoUrl)) nudges.push("Add the GitHub repo URL.");
  if (!hasUrl(data.demoUrl)) nudges.push("Add a live demo or screenshot link.");
  if (splitKeywords(data.keywords).length < 4) nudges.push("Add at least four GitHub topics.");
  if (!data.installCommand.trim()) nudges.push("Add the fastest way to try it.");

  return nudges.length
    ? nudges.slice(0, 4)
    : ["Ready to share. Ask for a first impression before asking for a star."];
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

function renderHooks(hooks) {
  const panel = document.querySelector('[data-panel="hooks"]');
  panel.innerHTML = hooks
    .map(
      (hook, index) => `
        <article class="copy-block hook-block">
          <div class="copy-block-head">
            <h2>${escapeHtml(hook.title)}</h2>
            ${copyButton(`hook:${index}`)}
          </div>
          <p>${escapeHtml(hook.text)}</p>
        </article>
      `,
    )
    .join("");
}

function renderSprint(items) {
  const panel = document.querySelector('[data-panel="sprint"]');
  panel.innerHTML = `
    <article class="copy-block sprint-summary">
      <div class="copy-block-head">
        <h2>30-minute first-star sprint</h2>
        ${copyButton("sprint")}
      </div>
      <p>Small, specific moves beat vague launch energy. Do these in order.</p>
    </article>
    <div class="sprint-list">
      ${items
        .map(
          (item, index) => `
            <article class="sprint-step">
              <span>${escapeHtml(item.time)}</span>
              <div>
                <h2>${index + 1}. ${escapeHtml(item.title)}</h2>
                <p>${escapeHtml(item.detail)}</p>
              </div>
            </article>
          `,
        )
        .join("")}
    </div>
  `;
}

function renderDoctor(doctor) {
  const panel = document.querySelector('[data-panel="doctor"]');
  panel.innerHTML = `
    <article class="copy-block doctor-summary">
      <div class="copy-block-head">
        <h2>README Doctor</h2>
        ${copyButton("doctor")}
      </div>
      <p>${doctor.passed}/${doctor.total} first-impression checks are passing.</p>
    </article>
    <div class="doctor-list">
      ${doctor.checks
        .map(
          (check) => `
            <article class="doctor-card ${check.ok ? "ok" : "warn"}">
              <div class="doctor-card-head">
                ${icon(check.ok ? "check" : "link")}
                <h2>${escapeHtml(check.label)}</h2>
                <span>${check.ok ? "Pass" : "Fix"}</span>
              </div>
              <p>${escapeHtml(check.why)}</p>
              <strong>${escapeHtml(check.fix)}</strong>
            </article>
          `,
        )
        .join("")}
    </div>
  `;
}

function renderPatch(sections) {
  const panel = document.querySelector('[data-panel="patch"]');
  panel.innerHTML = `
    <article class="copy-block patch-summary">
      <div class="copy-block-head">
        <h2>Drop-in patches</h2>
        ${copyButton("patch")}
      </div>
      <p>Copy the pieces that match the Doctor findings and paste them into the repo.</p>
    </article>
    ${sections
      .map(
        (section, index) => `
          <article class="patch-card">
            <div class="copy-block-head">
              <h2>${escapeHtml(section.title)}</h2>
              ${copyButton(`patch:${index}`)}
            </div>
            <pre>${escapeHtml(section.text)}</pre>
          </article>
        `,
      )
      .join("")}
  `;
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

function renderScores(scores, nudges) {
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

  document.getElementById("nudgeList").innerHTML = nudges
    .map((nudge) => `<div class="nudge-item">${icon("check")}<span>${escapeHtml(nudge)}</span></div>`)
    .join("");

  return total;
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

function renderRepoPulse(pulse) {
  const target = document.getElementById("repoPulse");
  if (!pulse) {
    target.innerHTML = `
      <p class="pulse-empty">Import a public GitHub repo to see stars, activity, license, README status, and launch blockers.</p>
    `;
    return;
  }

  const updatedDays = daysSince(pulse.pushedAt);
  const checks = [
    { label: "README", ok: pulse.readmeFound },
    { label: "Homepage", ok: pulse.hasHomepage },
    { label: "License", ok: Boolean(pulse.license) },
    { label: "Topics", ok: pulse.topicsCount >= 5 },
  ];

  target.innerHTML = `
    <div class="pulse-grid">
      <div><strong>${pulse.stars}</strong><span>stars</span></div>
      <div><strong>${pulse.forks}</strong><span>forks</span></div>
      <div><strong>${pulse.openIssues}</strong><span>issues</span></div>
      <div><strong>${updatedDays === null ? "?" : updatedDays}</strong><span>days since push</span></div>
    </div>
    <div class="pulse-meta">
      <span>${escapeHtml(pulse.language || "Unknown language")}</span>
      <span>${escapeHtml(pulse.license || "No license")}</span>
    </div>
    <div class="pulse-checks">
      ${checks
        .map(
          (check) => `
            <div class="${check.ok ? "ok" : "warn"}">
              ${icon(check.ok ? "check" : "link")}
              <span>${escapeHtml(check.label)}</span>
            </div>
          `,
        )
        .join("")}
    </div>
  `;
}

function renderShareCard(repoKit, totalScore) {
  document.getElementById("cardName").textContent = state.projectName || "Project Name";
  document.getElementById("cardTagline").textContent =
    state.tagline || "A clear one-line promise for your project.";
  document.getElementById("cardScore").textContent = `${totalScore}/100`;
  document.getElementById("cardTopics").textContent = repoKit.topics.slice(0, 3).join(" / ");
}

function render() {
  const readme = buildReadme(state);
  const posts = buildLaunchPosts(state);
  const hooks = buildHooks(state);
  const repoKit = buildRepoChecklist(state);
  const scores = getScores(state);
  const nudges = getNudges(state);
  const totalScore = Math.round(scores.reduce((sum, item) => sum + item.score, 0) / scores.length);
  const sprint = buildSprintPlan(state, repoKit, totalScore);
  const doctor = buildDoctor(state, repoKit);
  const patchSections = buildPatchSections(state, repoKit, doctor);

  renderReadme(readme);
  renderHooks(hooks);
  renderSprint(sprint);
  renderDoctor(doctor);
  renderPatch(patchSections);
  renderLaunch(posts);
  renderRepo(repoKit);
  renderScores(scores, nudges);
  renderPreview(repoKit);
  renderRepoPulse(state.repoPulse);
  renderShareCard(repoKit, totalScore);
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
  const hooks = buildHooks(state);
  const repoKit = buildRepoChecklist(state);
  const doctor = buildDoctor(state, repoKit);
  const patches = buildPatchSections(state, repoKit, doctor);

  if (key === "readme") return readme;
  if (key.startsWith("post:")) return posts[Number(key.split(":")[1])].text;
  if (key.startsWith("hook:")) return hooks[Number(key.split(":")[1])].text;
  if (key.startsWith("patch:")) return patches[Number(key.split(":")[1])].text;
  if (key === "patch") {
    return patches.map((section) => `## ${section.title}\n\n${section.text}`).join("\n\n---\n\n");
  }
  if (key === "sprint") {
    const totalScore = Math.round(getScores(state).reduce((sum, item) => sum + item.score, 0) / 3);
    return buildSprintPlan(state, repoKit, totalScore)
      .map((item) => `${item.time} - ${item.title}\n${item.detail}`)
      .join("\n\n");
  }
  if (key === "doctor") {
    return doctor.checks
      .map((check) => `${check.ok ? "PASS" : "FIX"} - ${check.label}\n${check.why}\nNext: ${check.fix}`)
      .join("\n\n");
  }
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

function setImportStatus(message, type = "info") {
  const status = document.getElementById("importStatus");
  status.textContent = message || "";
  status.className = message ? `import-status show ${type}` : "import-status";
}

async function fetchReadmeText(owner, repo, branch) {
  const rawUrl = `https://raw.githubusercontent.com/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/${encodeURIComponent(branch)}/README.md`;
  const response = await fetch(rawUrl);
  if (!response.ok) return "";
  return response.text();
}

async function importRepoFromGitHub(button) {
  const parsed = parseGitHubRepoUrl(state.repoUrl);
  if (!parsed) {
    setImportStatus("Paste a public GitHub repo URL first.", "error");
    return;
  }

  button.disabled = true;
  const label = button.querySelector("span");
  const originalLabel = label.textContent;
  label.textContent = "Importing";
  setImportStatus(`Reading ${parsed.owner}/${parsed.repo} from GitHub...`);

  try {
    const response = await fetch(
      `https://api.github.com/repos/${encodeURIComponent(parsed.owner)}/${encodeURIComponent(parsed.repo)}`,
      { headers: { Accept: "application/vnd.github+json" } },
    );
    if (!response.ok) {
      throw new Error(response.status === 404 ? "Repo not found or private." : `GitHub returned ${response.status}.`);
    }

    const repo = await response.json();
    const readme = await fetchReadmeText(parsed.owner, parsed.repo, repo.default_branch || "main");
    const readmeStats = analyzeReadme(readme);
    const installCommand = extractInstallCommand(readme);
    const topics = uniqueList([
      ...(repo.topics || []),
      repo.language || "",
      "github",
      "open-source",
    ]).slice(0, 10);
    const repoDescription = repo.description || "";
    const audienceSeed = repo.language || topics[0] || "open-source";
    const shouldReplace = (key) => !state[key] || state[key] === sampleState[key];

    state = {
      ...state,
      projectName: titleizeRepoName(repo.name) || state.projectName,
      tagline: repoDescription || state.tagline,
      audience: shouldReplace("audience") ? `developers interested in ${audienceSeed}` : state.audience,
      problem: shouldReplace("problem")
        ? "strangers need to understand why this repo matters before they try it"
        : state.problem,
      promise: shouldReplace("promise")
        ? "turning the repo's first impression into a clearer README, launch hook, and share card"
        : state.promise,
      demoUrl: hasUrl(repo.homepage) ? repo.homepage : state.demoUrl,
      repoUrl: repo.html_url || state.repoUrl,
      installCommand: installCommand || (shouldReplace("installCommand") ? "Follow the README quick start." : state.installCommand),
      usageCommand: shouldReplace("usageCommand")
        ? "Open the demo, scan the README, then try the smallest useful workflow."
        : state.usageCommand,
      license:
        repo.license && repo.license.spdx_id && repo.license.spdx_id !== "NOASSERTION"
          ? repo.license.spdx_id
          : state.license,
      keywords: topics.length ? topics.join(", ") : state.keywords,
      repoPulse: {
        fullName: repo.full_name,
        stars: repo.stargazers_count || 0,
        forks: repo.forks_count || 0,
        openIssues: repo.open_issues_count || 0,
        language: repo.language || "",
        license:
          repo.license && repo.license.spdx_id && repo.license.spdx_id !== "NOASSERTION"
            ? repo.license.spdx_id
            : "",
        pushedAt: repo.pushed_at || "",
        defaultBranch: repo.default_branch || "main",
        hasHomepage: hasUrl(repo.homepage),
        readmeFound: Boolean(readme),
        readmeStats,
        topicsCount: topics.length,
      },
    };

    saveState();
    setInputs();
    render();
    setImportStatus(
      `Imported ${repo.full_name}${installCommand ? " and found a quick-start command." : "."}`,
      "success",
    );
  } catch (error) {
    setImportStatus(error.message || "Could not import this repo.", "error");
  } finally {
    button.disabled = false;
    label.textContent = originalLabel;
  }
}

function wrapCanvasText(context, text, x, y, maxWidth, lineHeight, maxLines) {
  const words = String(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let current = "";

  words.forEach((word) => {
    const next = current ? `${current} ${word}` : word;
    if (context.measureText(next).width <= maxWidth) {
      current = next;
      return;
    }
    if (current) lines.push(current);
    current = word;
  });
  if (current) lines.push(current);

  lines.slice(0, maxLines).forEach((line, index) => {
    const output = index === maxLines - 1 && lines.length > maxLines ? `${line.replace(/[.,;:!?]*$/, "")}...` : line;
    context.fillText(output, x, y + index * lineHeight);
  });

  return Math.min(lines.length, maxLines) * lineHeight;
}

function downloadLaunchCard() {
  const repoKit = buildRepoChecklist(state);
  const scores = getScores(state);
  const total = Math.round(scores.reduce((sum, item) => sum + item.score, 0) / scores.length);
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 630;
  const context = canvas.getContext("2d");
  const name = state.projectName.trim() || "Project Name";
  const tagline = state.tagline.trim() || "A clear one-line promise for your project.";
  const topics = repoKit.topics.slice(0, 4);

  const gradient = context.createLinearGradient(0, 0, 1200, 630);
  gradient.addColorStop(0, "#eef7f6");
  gradient.addColorStop(0.55, "#f9fbfd");
  gradient.addColorStop(1, "#fff1ef");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 1200, 630);

  context.fillStyle = "#ffffff";
  context.strokeStyle = "#d4e0ec";
  context.lineWidth = 3;
  roundRect(context, 70, 70, 1060, 490, 28);
  context.fill();
  context.stroke();

  context.fillStyle = "#0e7c7b";
  context.font = "700 32px Segoe UI, Arial, sans-serif";
  context.fillText("Star-ready repo", 110, 135);

  context.fillStyle = "#17212f";
  context.font = "800 72px Segoe UI, Arial, sans-serif";
  wrapCanvasText(context, name, 110, 235, 760, 82, 2);

  context.fillStyle = "#405069";
  context.font = "400 34px Segoe UI, Arial, sans-serif";
  wrapCanvasText(context, tagline, 110, 365, 760, 46, 3);

  context.fillStyle = "#0e7c7b";
  context.beginPath();
  context.arc(980, 225, 82, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#ffffff";
  context.font = "800 42px Segoe UI, Arial, sans-serif";
  context.textAlign = "center";
  context.fillText(`${total}`, 980, 220);
  context.font = "700 24px Segoe UI, Arial, sans-serif";
  context.fillText("ready", 980, 255);
  context.textAlign = "left";

  let chipX = 110;
  context.font = "700 24px Segoe UI, Arial, sans-serif";
  topics.forEach((topic) => {
    const width = context.measureText(topic).width + 42;
    context.fillStyle = "#eef5ff";
    context.strokeStyle = "#c8d7ea";
    context.lineWidth = 2;
    roundRect(context, chipX, 492, width, 48, 24);
    context.fill();
    context.stroke();
    context.fillStyle = "#214d8f";
    context.fillText(topic, chipX + 21, 524);
    chipX += width + 14;
  });

  const anchor = document.createElement("a");
  anchor.href = canvas.toDataURL("image/png");
  anchor.download = `${repoKit.slug || "launch-card"}.png`;
  anchor.click();
}

function roundRect(context, x, y, width, height, radius) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.arcTo(x + width, y, x + width, y + height, radius);
  context.arcTo(x + width, y + height, x, y + height, radius);
  context.arcTo(x, y + height, x, y, radius);
  context.arcTo(x, y, x + width, y, radius);
  context.closePath();
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

  if (action.dataset.action === "download-card") {
    downloadLaunchCard();
  }

  if (action.dataset.action === "import-repo") {
    importRepoFromGitHub(action);
  }
});

setInputs();
render();
