# Docs New

This folder is the active documentation workspace for the project.

It is intended for:

- Internal team documentation
- Implementation reference
- AI assistant context during project work

Older docs in `docs/` may still be useful as reference, but they are not the primary source for current decisions.

## Source of Truth

The current source of truth is:

1. `docs-new/data/DATABASE_SCHEMA.md`
2. `docs-new/engineering/screen-lists/`

If another document conflicts with either of the two sources above, follow the database schema and screen lists.

## Document Status

These are currently treated as the most stable documents:

- `docs-new/data/DATABASE_SCHEMA.md`
- `docs-new/engineering/screen-lists/`

These documents are supporting docs and may still evolve:

- `docs-new/product/`
- `docs-new/engineering/` except `screen-lists`
- `docs-new/data/MIGRATION_GUIDE.md`

## How To Read These Docs

Recommended reading order:

1. `docs-new/product/PROJECT_OVERVIEW.md`
2. `docs-new/product/FEATURE_OVERVIEW.md`
3. `docs-new/engineering/screen-lists/`
4. `docs-new/data/DATABASE_SCHEMA.md`
5. Other engineering docs in `docs-new/engineering/`

For implementation work, do not stop at the product overview. Always confirm behavior against the screen lists and database schema.

## Language Rules

- Engineering docs should use full English.
- Product docs may use mixed English and Bahasa Indonesia when that improves clarity for the team.

## Guidance For AI Assistants

When using this folder as implementation context:

- Do not invent business rules beyond the schema and screen lists
- Do not override screen-list behavior using overview docs
- Treat product overview docs as summaries, not detailed specs
- Treat examples in non-source-of-truth docs as illustrative only
- Prefer explicit consistency with table names, field names, and screen flows

## Planned Additions

The following documents are expected to be added or refined later:

- Business rules summary
- Refactored architecture overview
- Implementation mapping between screens, modules, and persistence
