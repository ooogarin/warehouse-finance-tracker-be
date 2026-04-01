# Documentation Index

This folder is the active documentation source for the project.

## Source of Truth

The fixed source of truth is:

1. `docs/data/DATABASE_SCHEMA.md`
2. `docs/engineering/screen-lists/`

If any supporting document conflicts with those files, follow the schema and screen lists.

## Folder Map

- `docs/product/`: Product direction and feature summaries.
- `docs/engineering/`: Architecture and coding guidance.
- `docs/engineering/screen-lists/`: Screen-level behavior reference (source of truth).
- `docs/data/`: Data and migration references.
- `docs/BUSINESS_RULES.md`: Cross-module business rules.

## Reading Order

Recommended order for implementation work:

1. `docs/README.md`
2. `docs/product/PROJECT_OVERVIEW.md`
3. `docs/product/FEATURE_OVERVIEW.md`
4. `docs/engineering/screen-lists/`
5. `docs/data/DATABASE_SCHEMA.md`
6. `docs/BUSINESS_RULES.md`
7. Other engineering docs in `docs/engineering/`

## Language Rule

- Engineering docs use full English.
- Product docs may mix English and Bahasa Indonesia when it improves team clarity.

## Guidance for AI Assistants

- Do not invent business rules beyond schema and screen lists.
- Do not override screen-list behavior using overview docs.
- Treat product overview docs as summaries, not detailed technical specs.
- Treat non-source examples as illustrative only.
- Keep naming consistent with schema fields and screen-list behavior.

## Engineering References

- `docs/engineering/ARCHITECTURE_OVERVIEW.md`
- `docs/engineering/CODING_RULES.md`
- `docs/engineering/FOLDER_STRUCTURE.md`
- `docs/engineering/MODULE_BOUNDARIES.md`
- `docs/engineering/REQUEST_FLOW.md`
- `docs/engineering/TESTING_STRATEGY.md`
