# Deploy Boxing Coach to GitHub + Netlify

## 1. Push to GitHub

### Option A: Create repo on GitHub, then push

1. **Create a new repository** on [GitHub](https://github.com/new):
   - Name: `boxing-coach` (or any name you prefer)
   - Leave it **empty** (no README, .gitignore, or license)
   - Choose public or private

2. **Add the remote and push** (replace `YOUR_USERNAME` with your GitHub username):

   ```bash
   cd /Users/karanbangia/go/src/github.com/boxing-coach
   git remote add origin https://github.com/YOUR_USERNAME/boxing-coach.git
   git branch -M main
   git push -u origin main
   ```

   If you use SSH instead:

   ```bash
   git remote add origin git@github.com:YOUR_USERNAME/boxing-coach.git
   git branch -M main
   git push -u origin main
   ```

### Option B: Use GitHub CLI

If you have [GitHub CLI](https://cli.github.com/) installed:

```bash
cd /Users/karanbangia/go/src/github.com/boxing-coach
gh repo create boxing-coach --private --source=. --remote=origin --push
```

Use `--public` instead of `--private` if you want a public repo.

---

## 2. Deploy on Netlify

1. **Sign in** at [netlify.com](https://www.netlify.com/) (GitHub login is easiest).

2. **Add new site → Import an existing project** and choose **GitHub**.

3. **Select the repository** (e.g. `boxing-coach`).

4. **Build settings** (Netlify will use `netlify.toml` in the repo):
   - **Build command:** `pnpm build`
   - **Publish directory:** `apps/web/dist`
   - **Base directory:** leave empty (build from repo root)

   If you don’t rely on `netlify.toml`, enter the above in the Netlify UI.

5. **Deploy.** Netlify will install deps (pnpm is auto-detected), run `pnpm build`, and serve `apps/web/dist`. Later pushes to `main` will trigger new deploys.

---

## Notes

- The repo uses **pnpm** and a **Turborepo** monorepo; building from the root runs the web app and its `@boxing-coach/core` dependency.
- `netlify.toml` is already in the repo with the correct build and publish settings.
