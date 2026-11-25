import { icons, loadProfile, safeUrl, themes } from "./model.js";

const element = (id) => document.getElementById(id);
const isPreview = window.parent !== window && new URLSearchParams(location.search).has("preview");

function render(profile) {
  document.body.dataset.theme = Object.hasOwn(themes, profile.theme) ? profile.theme : "arcade";
  document.body.dataset.shape = profile.shape;
  document.body.dataset.layout = profile.layout;
  if (/^#[\da-f]{6}$/i.test(profile.accent)) {
    document.body.style.setProperty("--accent", profile.accent);
  }
  element("name").textContent = profile.name;
  element("handle").textContent = profile.handle ? "@" + profile.handle.replace(/^@+/, "") : "";
  element("bio").textContent = profile.bio;
  document.title = profile.name;
  const avatar = element("avatar");
  const source = safeUrl(profile.avatar || "", ["https:"]);
  const monogram = () => {
    const mark = document.createElement("span");
    mark.textContent = ".";
    avatar.replaceChildren(Array.from(profile.name.trim())[0]?.toUpperCase() || "J", mark);
  };
  if (source) {
    const image = new Image();
    image.alt = "";
    image.referrerPolicy = "no-referrer";
    image.addEventListener("error", monogram, { once: true });
    image.src = source;
    avatar.replaceChildren(image);
  } else {
    monogram();
  }
  document.querySelector(".site-footer p").textContent = profile.name;
  const links = element("links");
  links.replaceChildren();
  for (const link of profile.links) {
    const url = safeUrl(link.url);
    if (link.visible === false || !url || !link.title.trim()) continue;
    const card = document.createElement("a");
    card.className = "link-card";
    card.href = url;
    if (!isPreview && url.startsWith("http")) {
      card.target = "_blank";
      card.rel = "noopener noreferrer";
    }
    const icon = document.createElement("span");
    icon.className = "link-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = (Object.hasOwn(icons, link.icon) ? icons[link.icon] : icons.link)[1];
    const copy = document.createElement("span");
    const title = document.createElement("strong");
    title.textContent = link.title;
    copy.append(title);
    if (link.description) {
      const description = document.createElement("small");
      description.textContent = link.description;
      copy.append(description);
    }
    card.append(icon, copy);
    if (isPreview) card.addEventListener("click", (event) => event.preventDefault());
    links.append(card);
  }
  if (!links.childElementCount) links.textContent = "No links yet.";
}

if (isPreview) {
  document.body.classList.add("preview");
  window.addEventListener("message", (event) => {
    if (event.source === window.parent && event.origin === location.origin && event.data?.type === "profile") {
      render(event.data.profile);
    }
  });
  window.parent.postMessage({ type: "preview-ready" }, location.origin);
} else {
  loadProfile().then(render).catch(() => {
    element("links").textContent = "Links couldn’t load. Refresh the page to try again.";
  });
}

element("share").addEventListener("click", async () => {
  const url = new URL("./", location.href).href;
  const toast = element("toast");
  try {
    if (navigator.share) {
      await navigator.share({ title: document.title, url });
      return;
    }
    await navigator.clipboard.writeText(url);
    toast.textContent = "Link copied.";
  } catch (error) {
    if (error.name === "AbortError") return;
    toast.textContent = url;
  }
  toast.hidden = false;
});
