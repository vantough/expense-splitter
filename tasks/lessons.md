# Lessons Learned

- When adding UI counters tied to chip/tag interactions, do not rely on deprecated mutation events like `DOMSubtreeModified`; use explicit refresh calls in add/remove handlers and/or `MutationObserver` for reliable cross-browser updates.
- For chip-removal logic, always normalize chip label text (`replace("×", "").trim()`) before matching against backing arrays to avoid stale chip state.
