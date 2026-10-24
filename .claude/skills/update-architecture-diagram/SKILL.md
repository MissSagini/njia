---
name: update-architecture-diagram
description: Update Njia's architecture diagram in docs/architecture/ so it matches the current code, then commit it and push it to git. Use when asked to update, refresh or regenerate the architecture diagram, or after changes that add, remove or rewire a part of the system (a new route group, API route, external service, scheduled job or data path).
---

# Update the architecture diagram

The diagram lives in `docs/architecture/`:

- `njia-architecture.json`: the source (Archify JSON). Edit this, never the HTML.
- `njia-architecture.html`: the rendered page. Regenerated from the JSON on every run.

Archify's check receipts (`*.finalize.json`, `*.browser-check.json` and so on) are ignored by `docs/architecture/.gitignore` because they contain local paths. Never commit them.

## Before you start

1. **Archify must be installed.** It's a global skill: `npx skills add tt-a1i/archify -g`. Load the `archify` skill and follow its rules for Architecture diagrams and repository evidence. This skill only adds Njia's file locations and the git steps.
2. **Look at the working tree.** Run `git status --short` and `git branch --show-current`. Leave other people's uncommitted changes alone: you will stage only the two diagram files. Source links in the diagram point at a commit, so code the diagram cites must already be committed. If the change you're documenting isn't committed yet, say so and stop.

## Update the diagram

1. Read `docs/architecture/njia-architecture.json` and note `meta.repository.revision`.
2. See what changed since then: `git diff --stat <revision>..HEAD -- src vercel.json package.json`. If nothing there changed, tell the user the diagram is already current and stop without committing.
3. Read the changed files and trace each affected part to its real call site (Archify's repository-authoring rules). Update the components, connections, `sources` (path and line ranges at HEAD) and cards so every claim matches the code. Keep the existing layout where possible and place new boxes using Archify's layout defaults.
4. Set `meta.repository.revision` to the full `git rev-parse HEAD`. Keep `meta.output` as `docs/architecture/njia-architecture.html`.
5. Render and check it:

   ```bash
   node ~/.claude/skills/archify/bin/archify.mjs finalize architecture docs/architecture/njia-architecture.json docs/architecture/njia-architecture.html --repo-root . --quality showcase --json
   ```

   A non-zero exit is a failure. Repair it the way the Archify skill describes and run the same command again. If it still fails after Archify's repair limit, stop and report it. Don't commit a failing diagram.

## Commit and push

1. Stage only the diagram files:

   ```bash
   git add docs/architecture/njia-architecture.json docs/architecture/njia-architecture.html docs/architecture/.gitignore
   ```

2. Commit with a message that says what changed in the system, for example `Update architecture diagram: add the chat assistant`. End the message with the attribution lines your instructions give for commits.
3. Push to the current branch's remote: `git push` (use `git push -u origin <branch>` if it has no upstream yet). If the branch is `main`, mention that Vercel may start a new deployment, even though only docs changed.

## Report back

Reply with:

- a link to `docs/architecture/njia-architecture.html`;
- one or two lines on what changed in the diagram;
- the commit hash and the branch it went to.
