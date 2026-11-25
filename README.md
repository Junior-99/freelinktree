# Junior The Nerd King

A personal link-in-bio page with a visual editor and no application dependencies. GitHub Pages serves the public site from the `docs` folder.

- [Public page](https://junior-99.github.io/freelinktree/)
- [Page Studio](https://junior-99.github.io/freelinktree/studio.html)

## Edit and publish

1. Open Page Studio. Use **Links** to add, remove, reorder, or hide links. Use **Appearance** to change your profile, photo, theme, accent color, card shape, or layout.
2. Select **Publish changes**. Use **Copy settings** and **Open GitHub editor**. Replace the contents of `docs/profile.json` on GitHub and commit to the default branch while signed in as the repository owner.
3. Wait for GitHub Pages to finish deploying. The public URL stays the same.

Studio saves drafts in the current browser. For optional direct publishing, create a fine-grained GitHub token restricted to this repository with **Contents** read and write permission. Paste it only into the deployed Studio page. The editor clears the token field after each attempt and sends the token to GitHub’s API over HTTPS. A GitHub account with write access is required to change the shared page.

## Local development

Run `npm start` from the repository, then open the printed URL. Run `npm run check` to check JavaScript syntax. The public settings live in `docs/profile.json` and the visual styles in `docs/style.css`.

For a new GitHub repository, update the repository and branch names in `docs/model.js`. In **Settings → Pages**, select **Deploy from a branch**, choose that branch and the **/docs** folder, and save.
