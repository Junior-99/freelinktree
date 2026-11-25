export const repository = "Junior-99/freelinktree";
export const filePath = "docs/profile.json";
export const themes = {
  arcade: { label: "Midnight Arcade", accent: "#e2fa78" },
  paper: { label: "Newsprint", accent: "#ffd777" },
  cobalt: { label: "Cobalt", accent: "#c9dcff" },
};
export const icons = {
  link: ["Link", "↗"], code: ["Code", "</>"], video: ["Video", "▶"],
  music: ["Music", "♫"], photo: ["Photo", "◎"], chat: ["Community", "✦"],
  mail: ["Email", "@"], shop: ["Shop", "◇"],
};
export const blankLink = { title: "", description: "", url: "", icon: "link", visible: true };

export function safeUrl(value, protocols = ["https:", "http:", "mailto:", "tel:"]) {
  try {
    const url = new URL(value.trim());
    if (protocols.includes(url.protocol) && !url.username && !url.password) return url.href;
  } catch {
    return "";
  }
  return "";
}

export async function loadProfile() {
  const response = await fetch("./profile.json", { cache: "no-cache" });
  if (!response.ok) throw new Error("Could not load the published profile.");
  return response.json();
}
