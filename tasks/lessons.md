# Lessons Learned

- When adding UI counters tied to chip/tag interactions, do not rely on deprecated mutation events like `DOMSubtreeModified`; use explicit refresh calls in add/remove handlers and/or `MutationObserver` for reliable cross-browser updates.
- For chip-removal logic, always normalize chip label text (`replace("×", "").trim()`) before matching against backing arrays to avoid stale chip state.
- When adjusting layout for accessibility, preserve existing typography by inheriting the original font stack instead of introducing new font families.
- Keep primary action buttons (like calculate/submit) above long lists/tables or sticky within the viewport so they remain discoverable without extra scrolling.
