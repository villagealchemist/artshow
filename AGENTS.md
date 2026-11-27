# Artshow

The independent villagealchemist art site. Production branch: `mainframe`.

- The name is exactly `villagealchemist`: one word, all lowercase, everywhere,
  including page titles, metadata, accessible labels, copy, and documentation.
- Keep this a lightweight static HTML/CSS site. Executable source is TypeScript.
- Preserve the plum, lilac, silver, serif, and monospace design language.
- Keep typography in the first section of `styles.css`, the single stylesheet.
  Use its shared font and size variables; do not add component or page-specific
  font overrides, forced uppercase titles, or decorative title treatments.
- Comic page URLs use only the e-count slug and trailing slash. Keep issue
  numbers in the copy, without appending issue paths or page fragments.
- The comic opens directly as a viewport-fitted, horizontally swipeable gallery.
  Keep zoom and dialogue inside the reader, with keyboard and touch navigation.
- Preserve the five approved comic images byte for byte and in order.
- Never add private photographs, source archives, or lore manifests to this repo.
- Do not inspect, import, or modify `sites/jux` in any related checkout.
- Do not add authored JavaScript, U+2014, or type/lint suppression comments.
- Update the explicit asset allowlist when adding public files. Never copy the
  repository or an entire asset directory to `dist`.
- Run `npm run check` and `npm run deploy -- --dry-run` before publishing.
- The deployment target is `villagealchemist-art`, never `villagealchemist`.
- Domain and DNS changes need explicit approval. Do not change the `.com` site.
- Keep commits focused and omit AI co-author attribution.
