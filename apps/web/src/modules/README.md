# Modules

One module per product pillar. Module names match the vocabulary in
`docs/bible/` deliberately — the codebase and the product speak the same words.

Rules:

- A module owns its domain's data, logic and components.
- Modules expose a public surface via `index.ts`. Never import from another
  module's internals.
- `src/app/` composes modules into routes. Domain logic does not live in route
  files.
- `intelligence` and `learning` read academic context. They never own it.
