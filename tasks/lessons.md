# Lessons Learned

- When adding UI counters tied to chip/tag interactions, do not rely on deprecated mutation events like `DOMSubtreeModified`; use explicit refresh calls in add/remove handlers and/or `MutationObserver` for reliable cross-browser updates.
- For chip-removal logic, always normalize chip label text (`replace("×", "").trim()`) before matching against backing arrays to avoid stale chip state.
- When adjusting layout for accessibility, preserve existing typography by inheriting the original font stack instead of introducing new font families.
- Keep primary action buttons (like calculate/submit) above long lists/tables or sticky within the viewport so they remain discoverable without extra scrolling.
- Any UI style change must include dark-mode contrast verification (panel backgrounds, body text, links, tags, and table content) before merging.
- When adding empty-state UIs, wire visibility updates into all data mutation paths (`add`, `remove`, and initial load) so placeholders never show alongside populated data.
- If multiple empty states belong to the same visual section, define and use one shared toggle rule so they disappear together when any qualifying data exists.
