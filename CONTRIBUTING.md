# Contributing to Weatherly

Thanks for helping improve Weatherly. The project is intentionally approachable, and contributions do not need to be large to matter. A clear bug report, thoughtful feedback, documentation improvement, accessibility fix, or small visual polish can make the dashboard better for everyone.

## Ways to help

- Fix a bug or improve an issue that is already open.
- Improve the responsive layout, accessibility, or keyboard experience.
- Add tests, clarify documentation, or improve the developer setup.
- Suggest weather, air quality, map, or gardening features with a clear user need.
- Try the dashboard in a different browser, device, or location and report what you learn.

Look for issues labelled `good first issue` or `help wanted` when you want a focused starting point. If you have an idea that is not covered by an issue, open one before doing substantial work so we can agree on the direction.

## Local setup

1. Install Node.js 20 or newer.
2. Run `npm install`.
3. Run `npm run dev`.
4. Run `npm run build` before opening a pull request.

## Pull requests

Keep changes focused and describe the user-facing result in the pull request. Include screenshots or a short recording for visual changes, and call out any live-data or browser-specific behaviour that reviewers should check.

Before opening a pull request:

1. Run `npm run build`.
2. Check the changed flow on desktop and mobile widths.
3. Update documentation when behaviour or setup changes.
4. Remove debug output and confirm that no secrets or private data are included.

Please do not commit `node_modules`, `dist`, or local environment files. Pull requests are reviewed for clarity, accessibility, maintainability, and fit with Weatherly's calm, useful experience. Feedback is part of collaboration, not a judgement of the person who opened the pull request.

Weather data comes from the public Open-Meteo API. Keep API requests browser-safe and avoid adding private credentials to the repository.
