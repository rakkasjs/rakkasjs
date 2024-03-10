# Client-Side Navigation

Navigation can be triggered in two ways:

- By calling the `navigate` function (`Link` also uses this function)
  - `location.href` contains the old URL
  - If there's a blocker, return
  - Save current scroll position to memory+session storage
  - If `scoll` is set to `false`,
  - Call `history.pushState` or `history.replaceState` with a new entry ID
  - Wait for the render to complete
  - Scroll to the top or to hash if the `scroll` option was not set to `false`
  - Update last rendered entry ID
- By clicking the browser's back/forward buttons (popstate event)
  - If a cancelation is underway, mark it as finished and ignore
  - If there's a blocker, cancel the navigation
  - `location.href` already contains the new URL
  - Wait for the render to complete
  - Restore the scroll position from memory+session storage
  - Update last rendered entry ID

## Canceling navigation

## No scroll navigation

Sometimes scroll restoration/scroll to top is not desired. The typical example is a tabbed interface.

- A `noScroll` navigation from an entry with no group ID gives both the current and the target entry a unique group ID
- A `noScroll` navigation from an entry with a group ID gives the target entry the same group ID as the current entry
- popState between entries with the same group ID doesn't scroll
- popState between entries with different group IDs or no group ID does scroll
