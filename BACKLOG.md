# Betterboxd polish backlog

Post-launch UX / product fixes, captured tab by tab.

---

## Feed

- [x] Empty / no-friends state: from Feed, let users find and add friends without leaving the tab
- [x] Add a friends control on Feed (filter, settings entry, and/or search) to search people and friend them from here

---

## Search (Explore)

- [x] Add from search results: each result gets an **Add** / **+** action that opens the Add flow for that item (search → add without re-finding it)
- [x] Improve result relevance: current recommendations feel obscure / unfamiliar; prefer well-known, popular, or more sensible defaults even with sparse personal/social data

---

## Add

- [x] Search ranking: exact / close name matches should rank first (e.g. correctly spelled artist should not appear ~6th)
- [x] Apply the same ranking fix across media types: movies, shows, books, songs, artists
- [x] Shows — season/episode pickers must match the selected title:
  - season count accurate for that show
  - episode count accurate per selected season (varies by season)
- [x] Shows — keep clear choices for whole-show vs season vs specific episode ratings

---

## Profile

### Stats / shortcuts
- [x] Keep **Friends**, **Comments**, and **Logged**
- [x] Relocate **Queues** — lists alone aren’t useful as a top stat; move or rethink that entry

### Top five
- [x] Move Top Five **edit** out of Settings; place edit near the Top Five type controls on Profile
- [x] Treat Top Five modes as separate lists (not derived from each other):
  - Movies
  - Shows
  - Books
  - Music
  - **Mixed / all-time entertainment** — its own curated top five, not a merge of the type lists

### Timeline
- [x] Remove delete from the Profile timeline list (too easy to hit by accident)
- [x] Delete only after opening the item; put delete in a less accidental spot on that detail view

### Avatar
- [x] Support profile pictures on profiles
- [x] Add a Settings control to change / upload the avatar

---

## Notes

- Search relevance may be weak partly because the product has little usage/social signal yet — still worth improving popularity / exact-match ranking and defaults.
