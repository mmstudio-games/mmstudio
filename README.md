# MMStudio Website

Official website for MeaninglessMeaningStudio（妄言真意）and its current production, Deadpan（积案拂尘）.

## Development

```bash
bun install
bun run dev
```

## Quality checks

```bash
bun run lint
bun run build
```

The production build is written to `dist/`. A matching `404.html` is generated for clean client-side routes on GitHub Pages.

## Deployment

Pushes to `main` run `.github/workflows/deploy.yml` and publish the site to GitHub Pages. The custom domain is configured through `public/CNAME` as `mmstdio.games`.
