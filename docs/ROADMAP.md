# Eight-week engineering improvement roadmap

Start with DineFlow POS, then apply relevant lessons to Velora. This is a future work plan, not a claim that work has already happened. Schedule week 1 when implementation starts; extend the schedule if work takes longer.

| Week | Work | Evidence of completion |
| --- | --- | --- |
| 1 | Reproduce a clean install, database setup, seed, and build. Fix inaccurate setup instructions. | Recorded runtime versions, successful commands, and reproducible README steps. |
| 2 | Inspect existing tests; fill meaningful gaps in pricing, payment allocation, and state transitions. Add CI for supported checks. | Passing checks with tests demonstrating failures before relevant fixes. |
| 3 | Review authentication and authorization, especially cross-branch access and restricted financial fields. | Regression tests for identified permission defects and documented fixes. |
| 4 | Check duplicate submissions, concurrent stock changes, transaction rollback, and payment retries. | Integration tests that demonstrate consistent persisted data. |
| 5 | Measure representative slow workflows; optimize the largest verified bottleneck. | Before/after measurements under the same conditions and an explanation of tradeoffs. |
| 6 | Review keyboard navigation, labels, focus behavior, error messages, and mobile layouts. | Documented manual checks and automated checks where useful. |
| 7 | Verify deployment configuration, demo data boundaries, health checks, and operational limitations. | Working deployment and repeatable deployment instructions; no live customer data in demos. |
| 8 | Re-run release checks, capture real screenshots, document decisions, and prepare a versioned release. | Release notes, verified check results, screenshots, and an explicit limitations section. |

## Work item template

- Problem: a specific observed behavior or missing capability.
- Evidence: reproduction steps or a measurable baseline.
- Scope: the smallest useful improvement.
- Acceptance criteria: observable behavior that establishes completion.
- Verification: command or manual procedure and actual result.
- Decision: approach chosen and any relevant tradeoff.

## Commit practice

Make commits when a coherent change is complete. Some days may have several; others may have none. Keep fixes and their regression tests together. Separate independent documentation and infrastructure changes when that helps review. Do not create empty commits or choose an artificial activity target.

Example messages, only after doing the described work:

- docs: clarify replica-set setup for local development
- fix: reject cross-branch order access
- test: cover duplicate payment submissions
- ci: run verified checks on pull requests

## Review record

For each completed week, record the actual dates, change references, commands run, results, unresolved limitations, and what you learned. Explain AI assistance and your own review accurately when discussing the work. Be ready to demonstrate a workflow and explain a design decision in an interview.
