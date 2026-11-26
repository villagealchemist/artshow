# Deployment and rollback

## Initial release

Published on November 26, 2026 through Cloudflare Builds from `mainframe`.
The first serving version is `89424173-6e84-41bf-a015-cf365d0fec67`.
The saga and all five comic pages were verified in the live browser at
[the original Worker URL](https://villagealchemist-art.mjohnson1307.workers.dev/hereeesjohnnyson/).

At release, the `.art` apex remained a proxied A record pointing to
`162.255.119.85`, with no Worker routes. No DNS changes were made in that release.
MJ subsequently removed that parking record and approved `villagealchemist.art`
as the host, with `/heresjohnnyson/` as the comic's permanent path. The route
in `wrangler.jsonc` records that approved apex-only binding. The existing `www`
and email records remain outside this site's scope.

## Release boundary

This repository owns the standalone art site and its dedicated Worker,
`villagealchemist-art`. Never deploy it under the name `villagealchemist`.
The latter serves the separate `.com` website.

The allowlisted build contains exactly 16 files: eight HTML documents (including
four copies for the page addresses), one stylesheet, five original WebP comic
pages, the redirect rules, and one compiled reader script. It contains no
private photo archive, manifests, README screenshot, build tools, or API code.

## Before release

1. Run `npm ci`, `npm run check`, and `npm run deploy -- --dry-run`.
2. Inspect `/`, `/heresjohnnyson/`, and `/heresjohnnyson/issue-01/` at desktop
   and mobile sizes. Read all five pages in order and test the text disclosures.
3. Verify the account with `npx wrangler whoami`, then inspect the existing
   Worker's domains and deployments. Record the current art Worker version
   before an update with `npx wrangler deployments list`.
4. Deploy using `npm run deploy`. Verify the returned URL and every comic asset.

## Custom domain

The approved domain binding connects **only** the apex `villagealchemist.art`
to `villagealchemist-art`. Do not recreate the old parking A record or change
email records, `www`, the `.com` domain, or another Worker.

The committed route keeps subsequent deployments aligned with the dashboard:

```jsonc
"routes": [
  { "pattern": "villagealchemist.art", "custom_domain": true }
]
```

The public URLs are `/heresjohnnyson/` and `/heresjohnnyson/issue-01/` on that
domain. `_redirects` preserves the earlier `/hereeesjohnnyson/` spelling,
including nested issue and image URLs. Verify HTTPS and both new URLs after
every domain or routing change.

The reader adds one e before the r for each illustrated page, from
`/heresjohnnyson/issue-01/#page-01` to
`/heeeeeresjohnnyson/issue-01/#page-05`. It replaces the current history entry as
the reader scrolls. Every spelling serves the same complete issue, so refresh
and shared links work. The shorter page 2-5 root addresses redirect to their
matching reader pages. The one-e root remains the saga homepage.

Before this domain and reader update, the serving art Worker version was
`f5e84341-e1c3-40ad-a033-b9f76cd6fe87`.

## Rollback

For later releases, restore the recorded previous art Worker version:

```sh
npx wrangler rollback PREVIOUS_VERSION_ID
```

Then revert the corresponding Git commit and run checks before the next deploy.
Worker version rollback restores content, not the custom-domain binding. Any
domain rollback requires separate approval. Do not automatically restore the
parking record that MJ removed. The `.com` Worker remains independent throughout.
