# Last Mile — Simple Guide for Nia

This is a quick guide to help you pull the latest code and keep building with Claude in Cursor from your own laptop.

## 1) First-time setup (one time)

### A) Install tools

- Install Git: [https://git-scm.com/downloads](https://git-scm.com/downloads)
- Install Node.js LTS (includes npm): [https://nodejs.org](https://nodejs.org)
- Install Cursor: [https://cursor.com](https://cursor.com)

### B) Clone the repo

In Terminal:

```bash
git clone https://github.com/sosaisho/lastMile.git
cd lastMile
```

### C) Switch to your branch

```bash
git checkout v2-nia
```

### D) Run the app

```bash
npm start
```

Then open:

`http://localhost:8787/passage-v2.html`

Keep this terminal window open while you work.

---

## 2) Every time you start working

Open Terminal in your project folder and run:

```bash
cd lastMile
git checkout v2-nia
git pull origin v2-nia
npm start
```

If your folder is somewhere else, just `cd` into that folder first.

---

## 3) Use Claude in the web browser with this project

If you want to use Claude on claude.ai (not Cursor), do this:

1. Open [https://claude.ai](https://claude.ai) and start a new chat.
2. In your `lastMile` folder, drag in the file(s) you want Claude to edit (for example `README.md`, `passage-v2.html`, or files inside `js/`).
3. Ask Claude for the exact changes you want.
4. Copy Claude's updated code back into the same local file in your project.
5. Save the file, run `npm start` (or refresh if already running), and test in the browser.
6. If it looks good, commit and push to `v2-nia`.

Important:

- Claude web does not directly edit your local files automatically.
- You still need to paste changes into your local project and test before pushing.
- For big changes, do one file at a time so it's easier to verify.

---

## 4) Save and push your changes

When your edits look good:

```bash
git add .
git commit -m "Update onboarding copy and flow"
git push origin v2-nia
```

Then tell Sosa to pull `v2-nia` (or open a PR later if needed).

---

## 5) If something breaks

Try these in order:

1. Stop server (`Ctrl + C`) and run `npm start` again
2. Refresh browser (`Cmd + Shift + R` on Mac, `Ctrl + Shift + R` on Windows)
3. Reset app state in browser console:

```js
localStorage.clear(); location.reload();
```

4. Ask Claude in Cursor:
   - "I got this error. Explain in simple terms and fix it."
   - Paste the exact error text.

---

## 6) Super short daily routine

```bash
cd lastMile
git checkout v2-nia
git pull origin v2-nia
npm start
```

Then build with Claude, test, commit, and push.

---

## 7) Important safety notes

- Work on `v2-nia`, not `main`
- Pull before you start
- Push often with clear commit messages
- If Git asks about conflicts, pause and ask for help

