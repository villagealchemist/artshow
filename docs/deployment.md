# Deployment and rollback

## Release boundary

This repository owns the standalone art site and its dedicated Worker,
`villagealchemist-art`. Never deploy it under the name `villagealchemist`.
The latter serves the separate `.com` website.

The allowlisted build contains exactly 11 files: four HTML documents, two
stylesheets, and five original WebP comic pages. It contains no private photo
archive, manifests, README screenshot, build tools, or API code.

## Before release

1. Run `npm ci`, `npm run check`, and `npm run deploy -- --dry-run`.
2. Inspect `/`, `/hereeesjohnnyson/`, and `/hereeesjohnnyson/issue-01/` at desktop
   and mobile sizes. Read all five pages in order and test the text disclosures.
3. Verify the account with `npx wrangler whoami`, then inspect the existing
   Worker's domains and deployments. Record the current art Worker version
   before an update with `npx wrangler deployments list`.
4. Deploy using `npm run deploy`. Verify the returned URL and every comic asset.

## Custom domain

Domain routing is intentionally absent from the initial config. After explicit
approval, attach **only** the apex `villagealchemist.art` as a custom domain to
`villagealchemist-art`. Review any existing apex DNS record before replacement.
Do not change email records, `www`, the `.com` domain, or another Worker.

Once configured, commit the approved route so subsequent deployments agree with
the dashboard:

```jsonc
"routes": [
  { "pattern": "villagealchemist.art", "custom_domain": true }
]
```

The intended public URLs are `/hereeesjohnnyson/` and
`/hereeesjohnnyson/issue-01/` on that domain. They are not live merely because
this file names them.

## Rollback

For later releases, restore the recorded previous art Worker version:

```sh
npx wrangler rollback PREVIOUS_VERSION_ID
```

Then revert the corresponding Git commit and run checks before the next deploy.
For the first release there is no earlier art-site version. If its custom domain
has just been enabled, reversing that first cutover requires restoring the
record captured before the change and removing that custom domain, with explicit
approval. The `.com` Worker remains independent throughout.
