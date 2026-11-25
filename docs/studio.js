import { blankLink, filePath, icons, loadProfile, repository, safeUrl, themes } from "./model.js";

const element = (id) => document.getElementById(id);
const form = element("editor");
const list = element("edit-links");
const frame = document.querySelector("iframe");
const dialog = element("publish-dialog");
const publishStatus = element("publish-state");
const tokenField = element("token");
const draftKey = `jnk-profile-draft-v1:${new URL("./", location.href).pathname}`;
const apiUrl = `https://api.github.com/repos/${repository}/contents/${filePath}`;
let profile;
let published;
let publishing = false;

const json = (value) => JSON.stringify(value, null, 2) + "\n";
const addOptions = (select, values) => {
  for (const [value, label] of values) select.add(new Option(label, value));
};

function preview() {
  if (profile) frame.contentWindow.postMessage({ type: "profile", profile }, location.origin);
}

function updateDraft() {
  const status = element("draft-state");
  try {
    if (json(published) === json(profile)) {
      localStorage.removeItem(draftKey);
      status.textContent = "Published version";
    } else {
      localStorage.setItem(draftKey, json(profile));
      status.textContent = "Draft saved on this device";
    }
  } catch {
    status.textContent = "Draft is available for this session";
  }
  preview();
}

function renderLinks() {
  list.replaceChildren();
  if (!profile.links.length) {
    list.textContent = "Add your first link to get started.";
    return;
  }
  profile.links.forEach((link, index) => {
    const card = element("link-template").content.firstElementChild.cloneNode(true);
    card.dataset.index = index;
    addOptions(card.querySelector("select"), Object.entries(icons).map(([id, [label]]) => [id, label]));
    for (const input of card.querySelectorAll("[data-key]")) {
      const key = input.dataset.key;
      if (key === "visible") input.checked = link.visible !== false;
      else input.value = link[key] ?? blankLink[key];
    }
    card.querySelector('[data-action="up"]').disabled = index === 0;
    card.querySelector('[data-action="down"]').disabled = index === profile.links.length - 1;
    list.append(card);
  });
}

function validate() {
  if (!profile.name.trim()) return "Enter a display name in Appearance.";
  if (profile.avatar.trim() && !safeUrl(profile.avatar, ["https:"])) {
    return "Enter a valid HTTPS profile photo URL.";
  }
  for (const [index, link] of profile.links.entries()) {
    if (link.visible && (!link.title.trim() || !safeUrl(link.url))) {
      return `Add a title and valid URL to link ${index + 1}, or set it to hidden.`;
    }
  }
  return "";
}

form.addEventListener("submit", (event) => event.preventDefault());
form.addEventListener("input", ({ target }) => {
  if (target.dataset.key) {
    const link = profile.links[Number(target.closest("[data-index]").dataset.index)];
    link[target.dataset.key] = target.type === "checkbox" ? target.checked : target.value;
  } else if (target.name) {
    profile[target.name] = target.value;
    if (target.name === "theme") {
      profile.accent = themes[target.value].accent;
      form.elements.accent.value = profile.accent;
    }
  }
  updateDraft();
});

form.addEventListener("click", ({ target }) => {
  if (!target.dataset.panel) return;
  for (const tab of form.querySelectorAll("[data-panel]")) {
    const selected = tab === target;
    tab.setAttribute("aria-pressed", selected);
    element(tab.dataset.panel).hidden = !selected;
  }
});

element("add").addEventListener("click", () => {
  profile.links.push({ ...blankLink });
  renderLinks();
  list.lastElementChild.querySelector('[data-key="title"]').focus();
  updateDraft();
});

list.addEventListener("click", ({ target }) => {
  const action = target.dataset.action;
  if (!action) return;
  const index = Number(target.closest("[data-index]").dataset.index);
  const [link] = profile.links.splice(index, 1);
  let destination = index;
  if (action !== "remove") {
    destination = action === "up" ? index - 1 : index + 1;
    profile.links.splice(destination, 0, link);
  }
  renderLinks();
  const card = list.children[Math.min(destination, list.children.length - 1)];
  const sameAction = card?.querySelector(`[data-action="${action}"]:enabled`);
  (sameAction || card?.querySelector('[data-key="title"]') || element("add")).focus();
  updateDraft();
});

frame.addEventListener("load", preview);
window.addEventListener("message", ({ origin, source, data }) => {
  if (origin === location.origin && source === frame.contentWindow && data?.type === "preview-ready") preview();
});

element("open-publish").addEventListener("click", () => {
  const problem = validate();
  if (problem) {
    element("draft-state").textContent = problem;
    return;
  }
  publishStatus.textContent = "";
  dialog.showModal();
});
element("close-publish").addEventListener("click", () => dialog.close());
dialog.addEventListener("cancel", (event) => { if (publishing) event.preventDefault(); });
dialog.addEventListener("close", () => { tokenField.value = ""; });
element("edit-github").href = `https://github.com/${repository}/edit/HEAD/${filePath}`;
element("copy").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(json(profile));
    publishStatus.textContent = "Settings copied. Paste them into the GitHub editor and commit.";
  } catch {
    publishStatus.textContent = "Clipboard access failed. Try another browser or use direct publishing.";
  }
});

async function requestGitHub(headers, options) {
  const response = await fetch(apiUrl, { headers, cache: "no-store", ...options });
  if (response.ok) return response.json();
  const error = await response.json().catch(() => ({}));
  throw new Error(error.message || `GitHub returned HTTP ${response.status}.`);
}

const decode = (content) => new TextDecoder().decode(Uint8Array.from(atob(content), (char) => char.charCodeAt(0)));
function encode(content) {
  const bytes = new TextEncoder().encode(content);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

element("publish-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const token = tokenField.value.trim();
  tokenField.value = "";
  if (!token || publishing) {
    if (!publishing) publishStatus.textContent = "Enter a GitHub token to publish directly.";
    return;
  }
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
  };
  publishing = true;
  element("publish").disabled = true;
  element("close-publish").disabled = true;
  publishStatus.textContent = "Saving to GitHub…";
  try {
    const remote = await requestGitHub(headers);
    const remoteProfile = JSON.parse(decode(remote.content));
    if (json(remoteProfile) !== json(published) && json(remoteProfile) !== json(profile)) {
      throw new Error("GitHub has a newer version. Wait for the live page to update, then reload Studio and review your local draft before publishing.");
    }
    if (json(remoteProfile) !== json(profile)) {
      await requestGitHub(headers, {
        method: "PUT",
        body: JSON.stringify({ message: "Update link page from Studio", content: encode(json(profile)), sha: remote.sha }),
      });
    }
    published = structuredClone(profile);
    updateDraft();
    publishStatus.textContent = "Saved to GitHub. GitHub Pages may take a few minutes to update the live page.";
  } catch (error) {
    publishStatus.textContent = error.message;
  } finally {
    publishing = false;
    element("publish").disabled = false;
    element("close-publish").disabled = false;
  }
});

loadProfile().then((data) => {
  published = data;
  try {
    profile = JSON.parse(localStorage.getItem(draftKey)) || structuredClone(data);
  } catch {
    profile = structuredClone(data);
  }
  addOptions(form.elements.theme, Object.entries(themes).map(([id, theme]) => [id, theme.label]));
  for (const field of form.elements) if (field.name) field.value = profile[field.name];
  renderLinks();
  updateDraft();
  element("load-state").hidden = true;
  form.hidden = false;
  element("open-publish").disabled = false;
}).catch(() => {
  element("load-state").textContent = "Couldn’t open your page settings. Refresh to try again.";
});
