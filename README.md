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
bun run lint:fix
bun run format
bun run build
```

Biome handles formatting and linting. Its configuration uses two-space indentation and enables Tailwind CSS v4 directive parsing. The production build is written to `dist/`.

## Continuous integration

Pushes to `main` and pull requests run `.github/workflows/ci.yml`. The workflow installs dependencies with Bun canary, runs Biome checks, and creates a production build. It does not deploy the website; the hosting platform remains undecided.
