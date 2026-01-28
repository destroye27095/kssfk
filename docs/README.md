# KSFP Docs (GitHub Pages)

This `docs/` folder contains a lightweight UX demo site for the KSFP project. Use this page to share the payment methods demo and other UX pages via GitHub Pages.

How to publish
1. Push the repo to GitHub (main branch).
2. In GitHub repo → Settings → Pages, set Source to `main` branch and folder `/docs`.
3. After ~30–60s the site will be available at `https://<your-username>.github.io/<your-repo>/`.

Local preview

```powershell
cd docs
python -m http.server 8000
# open http://localhost:8000/payment-demo.html
```

Notes
- Keep links relative (they are already relative).
- Update `docs/payment-demo.html` or add new pages for other demos.
