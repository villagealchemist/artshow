<p align="center">
  <img src="/ASSets/tinydeskiknow.png" alt="Artshow">
</p>

# villagealchemist / Artshow

An independent home for illustrated sagas and other experiments by MJ.
Plain HTML and CSS, served by Cloudflare Workers Static Assets.

- `/`: the art collection
- `/heresjohnnyson/`: page 1 and the continuous reader for free Issue #001
- `/heeresjohnnyson/` through `/heeeeeresjohnnyson/`: pages 2 through 5
- `/heresjohnnyson/about/`: introduction, future issues, and dedication

The five approved comic pages are preserved byte for byte. The reader uses
continuous scrolling, native page links, full-size image links, and expandable
page descriptions and dialogue. A small TypeScript enhancement updates the URL
as you scroll: one e before the r for page 1, two for page 2, through five for
page 5. The e-count is the entire page address: no issue suffix or page fragment.
Each spelling also works as a direct link, including on refresh. Legacy issue
paths and page fragments continue to open the matching page, then become clean
addresses.
The comic remains readable without scripts. There are no third-party fonts,
tracking, or runtime dependencies.

## Develop

Use Node 26 and npm.

```sh
npm ci
npm run check
npm run dev
```

The local site runs at `http://localhost:42069`. Rebuild after editing HTML or
CSS. `npm run check` runs the source policy, strict TypeScript, ESLint, Prettier,
build-guard tests, and the deterministic static build.

`scripts/site.ts` defines the explicit public-file allowlist. `npm run build`
cleans `dist`, copies only those files, compiles the reader enhancement, creates
the four extra reader addresses, verifies artwork hashes and page order,
and checks local links and anchors. The README image in `ASSets/` is repository
material, not a deployed site asset. Private photographs and source archives
must stay outside this repository.

## Change fonts and type sizes

Edit the first `:root` block in `styles.css`, the site's only stylesheet.
`--font-body` controls prose, `--font-heading` inherits it by default, and
`--font-detail` controls small navigation and issue labels. `--text-title`,
`--text-heading`, `--text-body`, and `--text-small` define the complete type scale.
There are no per-page font overrides. Layout rules live below the shared type
rules, so changing fonts does not require editing component styles.

## Publish

The production branch is `mainframe`. The dedicated Worker is
`villagealchemist-art`. This project does not deploy or alter the existing
`villagealchemist` Worker or `villagealchemist.com`.

```sh
npm run check
npm run deploy -- --dry-run
npx wrangler whoami
npm run deploy
```

Verify the intended Cloudflare account before deploying. `wrangler.jsonc`
binds the approved apex custom domain `villagealchemist.art` to the dedicated
art Worker. The earlier `/hereeesjohnnyson/` links redirect permanently to
`/heresjohnnyson/`. Earlier issue links resolve to clean page addresses, and
image links keep working. See
[deployment notes](docs/deployment.md).

GitHub Actions runs checks and a deployment dry run on pull requests and pushes.
Cloudflare Builds is connected to this repo using `mainframe`, Node 26, build
command `npm run check`, and deploy command `npm run deploy`. Feature-branch
preview builds are enabled separately.

The primary site address is [villagealchemist.art](https://villagealchemist.art/).
The [workers.dev address](https://villagealchemist-art.mjohnson1307.workers.dev/)
also remains available.

## Add an issue

Keep issue numbers in the publication's copy and metadata. Public page addresses
use the e-count alone. Add only approved public artwork to the build allowlist,
preserve its proportions, and keep the reader usable without scripts. Update
the reader's page list and saga overview when the next issue is ready.
