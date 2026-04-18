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

## 3) Set up Cursor on your laptop (beginner steps)

### A) Open the project in Cursor

1. Open Cursor.
2. Click **File -> Open Folder**.
3. Choose your `lastMile` folder.
4. In the left file list, you should see files like `README.md`, `passage-v2.html`, and the `js` folder.

### B) Open the built-in chat

1. In Cursor, open the AI chat panel (right side).
2. Start a new chat.
3. Keep your request simple, like:
   - "Update the onboarding text to be friendlier."
   - "Fix this error in `js/chat.js`."

### C) Apply changes safely

1. Let Cursor make the change.
2. Read the changed file quickly.
3. Test in browser at `http://localhost:8787/passage-v2.html`.
4. If good, keep it. If not, ask Cursor to revise.

## 4) Save and push your changes

When your edits look good:

```bash
git add .
git commit -m "Update onboarding copy and flow"
git push origin v2-nia
```

Then tell Sosai to pull `v2-nia` (or open a PR later if needed).

---

## 5) Cursor prompt guide for safe pull + push

Copy/paste these prompts into Cursor chat when needed.

### A) Before you start coding (pull latest)

```text
Please help me safely update my branch before coding.
1) Confirm I am on branch v2-nia
2) Pull latest from origin/v2-nia
3) Show me git status and confirm I am up to date
Do not change any code files in this step.
```

### B) After you finish changes (commit + push)

```text
Please help me safely commit and push my changes on v2-nia.
1) Show git status and git diff summary first
2) Propose a clear commit message
3) Commit my current changes
4) Push to origin/v2-nia
5) Show final git status so I know it worked
```

### C) If there is a merge conflict

```text
I got a merge conflict. Please explain what happened in simple words and guide me step by step.
Do not run destructive commands.
```

---

## 6) If something breaks

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

## 7) Important safety notes

- Work on `v2-nia`, not `main`
- Pull before you start
- Push often with clear commit messages
- If Git asks about conflicts, pause and ask for help

