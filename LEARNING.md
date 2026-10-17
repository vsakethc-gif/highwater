# Learning log

Evidence of my own work and a study guide for judging. Fill in "What I did" in your own words after each session.

## Session log

### Saturday, October 17, 2026: Phase 0 (setup)

**What I did** *(edit this in your own words)*
- Chose the problem and wrote the project brief (`CLAUDE.md`).
- Reviewed the Phase 0 plan, the color and font choices, and the placeholder page.
- _Add: anything you tested, changed, or decided yourself._

**What was built**
- The project skeleton (folders, config, tooling), the design tokens, a placeholder page, the first tests, and automatic deployment to GitHub Pages.

## Concepts

### What is a web app made of?
- **HTML** is the structure (headings, paragraphs, links).
- **CSS** is the look (colors, fonts, spacing).
- **JavaScript** is the behavior. We write **TypeScript**, which is JavaScript plus "types": labels that say what kind of data each thing holds, so mistakes are caught before the code runs.

### npm and package.json
`package.json` lists the libraries (code other people wrote and shared) the app uses. `npm install` downloads them into `node_modules/`. We don't commit that folder, because anyone can re-download it.

### Vite (build tool)
During development, `npm run dev` shows the site on your computer and refreshes it when you save. `npm run build` packs everything into small, fast files in `dist/`, and those are what get published.

### Design tokens
Named values like `--color-accent` or `--space-2`, defined once in `tokens.css`. Everything else uses the names, so the design stays consistent and can be changed in one place.

### Contrast ratio (accessibility)
A number comparing how light text is versus its background, from 1:1 (invisible) to 21:1 (black on white). WCAG AA requires at least 4.5:1 for normal text and 3:1 for borders and icons. We measured every color pair.

### Feature flags
On/off switches in `config.ts`. An unfinished feature stays off, so it can't break the working app.

### Git, GitHub, and GitHub Pages
- **Git** saves snapshots ("commits") of the project, so you can see what changed and undo mistakes.
- **GitHub** stores those snapshots online.
- **GitHub Actions** runs a script on GitHub's computers every time you push: it runs the tests, builds the site, and publishes it.
- **GitHub Pages** hosts the published site for free.

### Automated tests
Small programs that check our code gives the right answers, for example "the overall status is the highest level among hazards." `npm test` runs them all in under a second.

### XSS (cross-site scripting)
An attack where someone sneaks code into text that a site displays. Our `h()` helper always inserts text as plain text, never as HTML, which blocks this.
