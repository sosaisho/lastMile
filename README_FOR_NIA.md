# Last Mile — Simple Guide for Nia

This is a quick guide to help you pull the latest code and keep building with Claude in Cursor.

## 1) First-time setup

Open Terminal and run:

```bash
cd /Users/sosaisho/lastMile
npm start
```

What this does:
- Installs anything needed
- Starts the app server
- Opens the app at `http://localhost:8787/passage-v2.html`

Keep this terminal window open while working.

---

## 2) Every time you start working

### Step A — Open project
Open Cursor with this folder:

`/Users/sosaisho/lastMile`

### Step B — Go to your branch
In Terminal:

```bash
cd /Users/sosaisho/lastMile
git checkout v2-nia
```

### Step C — Pull latest changes
In Terminal:

```bash
git pull origin v2-nia
```

If you also want the newest changes from `main`, ask Sosa first, then:

```bash
git pull origin main
```

### Step D — Run app

```bash
npm start
```

---

## 3) How to "vibe code" with Claude in Cursor

Use simple prompts like:
- "Update onboarding wording to feel friendlier."
- "Make this button text clearer for non-technical users."
- "Add a new section to the dashboard with a simple explanation."
- "Fix this error: [paste error message]."

Best practice:
- Ask for one small change at a time
- Test after each change
- Keep prompts plain English

---

## 4) Save and push your changes

When your edits look good:

```bash
cd /Users/sosaisho/lastMile
git add .
git commit -m "Update onboarding copy and flow"
git push origin v2-nia
```

Then tell Sosa to pull `v2-nia` (or open a PR later if needed).

---

## 5) If something breaks

Try these in order:

1. Stop server (`Ctrl + C`) and run `npm start` again
2. Refresh browser with `Cmd + Shift + R`
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
cd /Users/sosaisho/lastMile
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

