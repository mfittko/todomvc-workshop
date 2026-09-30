# Undo a deleted todo

Builds on `PLAN.md` (persisted todos). Stacked on branch `workshop/persist-todos` (PR #1).

## Status

draft

## Objective

A person managing todos in one browser tab can reverse a delete. Deleting a todo (the `x` button, clearing an edit to empty, or "Clear completed") is immediate today and cannot be reversed. After this phase, an Undo control and the `Ctrl+Z` / `Cmd+Z` shortcut restore the most recent delete with the original id, title, completed state, and list position.

## In scope

- The controller keeps an in-memory undo stack. Each delete pushes one entry that holds the removed todos with their list positions. "Clear completed" pushes one entry for all removed todos.
- `Store.restore(entries)` re-inserts todos at their positions, skips ids that already exist, raises `uniqueID` above every restored id, and persists like any other write. `Model.restore` wraps it. The Store public API stays additive.
- One status region below the list (class `undo`, `role="status"`, `aria-live="polite"`). It shows a message (`Deleted "<title>"` or `Deleted N todos`, set with `textContent`) and a native button (class `undo-button`) labeled Undo. It is visible only while the stack is non-empty and shows the newest entry.
- Keyboard: `Ctrl+Z` and `Cmd+Z` trigger undo. The shortcut is ignored while focus is in a text input (`.new-todo`, `.edit`). The Undo button works with `Tab` then `Enter` or `Space`.
- Touches `src/controller.js`, `src/model.js`, `src/store.js`, `src/view.js`, `index.html`, and a little CSS. The existing `view.render(cmd, param)` and `view.bindCallback(event, handler)` pattern is reused.
- Playwright (`@playwright/test`, Chromium) end-to-end tests in `e2e/`, `playwright.config.js` with a `webServer` running `npm run dev` on 127.0.0.1:5173 (`reuseExistingServer`), and a `test:e2e` script. Each test gets a fresh browser context, so `localStorage` starts empty.

## Explicit non-goals

- No redo.
- No undo for edits or toggles.
- No persisted undo stack. A reload clears it.
- No new keyboard shortcut for deleting.
- No time-based auto-hide of the undo region.
- No stack size limit.

## Validation approach

Tests come first and are seen failing. Unit tests (vitest, jsdom) cover `Store.restore`. Playwright tests cover each acceptance criterion in a real browser. Then `npx vp test run`, `npx vp check src tests e2e`, `npx vp build`, and `npm run test:e2e` must pass at the final head. A browser check through the ui-review route records a video of the feature.

## Durable decisions

- The undo stack lives in the controller and is session-only.
- Restoring goes through `Store.restore`, so it persists like any other write.
- The undo region is one status element that always shows the newest entry.
- The shortcut is ignored inside text inputs so native text undo keeps working.
- No CI exists in the fork. `gates.*.requireCi` is false through an untracked local `.devloops`.

## Open questions

None. The approach was decided and grilled before this plan was written.

## Acceptance criteria

- Deleting a todo and pressing Undo restores it at its original position with its original completed state.
- "Clear completed" is undone in one step.
- `Ctrl+Z` and `Cmd+Z` undo a delete when focus is not in a text input.
- The Undo button works from the keyboard.
- Multiple deletes undo in reverse order, and the region hides when the stack is empty.
- A restored todo survives a reload, and the undo stack does not.
- Restored ids never collide with new ids.
- Existing behavior is unchanged.
- Repo checks pass.

## Definition of done

- Unit test on `Store.restore` and a Playwright test: create three todos, complete the second, delete it, click Undo; list order and completed state match.
- Playwright test: complete two todos, clear completed, one Undo restores both.
- Playwright test presses `Control+Z` after a delete and asserts the todo returns; it also asserts `Control+Z` inside the new-todo input does not restore.
- Playwright test focuses the button with `Tab` and activates it with `Enter`.
- Playwright test deletes two todos, undoes twice in reverse order, and asserts the region is hidden.
- Playwright test: delete, undo, reload, todo present. Second test: delete, reload, region hidden and todo absent.
- Unit test: restore an entry, save a new todo, ids differ.
- `npm test` passes, including every earlier test.
- `npx vp check src tests e2e`, `npx vp build`, and `npm run test:e2e` pass.
- The PR body carries the browser-check result and validation results for the final head.

## Size estimate

- Estimated logic LOC: 150
- Tier: default
- Oversize: n/a (within default tier's softLoc budget of 400)

## Coverage matrix

| Item | Type | Status | Evidence | Notes |
|---|---|---|---|---|
| Undo restores position and completed state | AC | Unverified | unit + Playwright test | |
| Clear completed undone in one step | AC | Unverified | Playwright test | |
| Ctrl+Z / Cmd+Z undo outside text inputs | AC | Unverified | Playwright test | |
| Undo button keyboard operable | AC | Unverified | Playwright test | |
| Multiple deletes undo in reverse; region hides | AC | Unverified | Playwright test | |
| Restored todo survives reload; stack does not | AC | Unverified | 2 Playwright tests | |
| Restored ids never collide | AC | Unverified | unit test | |
| Existing behavior unchanged | AC | Unverified | npm test | |
| Repo checks pass | AC | Unverified | vp check, vp build, test:e2e | |
| No redo, edit/toggle undo, persisted stack, delete shortcut, auto-hide, stack limit | Non-goal | Unverified | scope boundary | |

## Docs-grill findings

- None recorded; the docs-grill step ran and surfaced no findings.
