# Digital Cafe Operating Protocols

## WORKFLOW LOOP

For any new feature or change, strictly follow this sequence:

`study => plan => execute plan => rendezvous => sync docs`

## STUDY

Analyze the request and write a Markdown file in `doc/study/` (for example,
`feature-name-study.md`). Discuss feasibility, tradeoffs, and architecture.

## PLAN

Write a checklist Markdown file in `doc/plan/` (for example,
`feature-name-plan.md`) detailing the concrete CLI and coding steps required.

## EXECUTE PLAN

Create and checkout a new Git branch from `main` (for example,
`feat/feature-name`). Execute the steps in the plan.

## RENDEZVOUS

Ensure the code builds and works. Merge the branch back to `main`.

## SYNC DOCS

Update the living manual in `doc/wiki/` (for example, `architecture.md` or
`setup.md`) to reflect the new codebase state.

## COMMIT STANDARDS

All commits must use Conventional Commits, such as `feat:`, `fix:`, `chore:`,
or `build:`.
