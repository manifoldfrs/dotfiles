# Persistence and migrations

Use this reference when behavior reads or writes the database, or when a migration, constraint, index, or backfill changes.

## The database protects persisted invariants

- Use model validations for useful feedback and database constraints for invariants that must survive concurrent writes or alternate write paths.
- Back uniqueness validation with a unique index matching its scope and intended null semantics.
- Use foreign keys, nullability, and check constraints where they express required persisted relationships or values.
- Guard concurrent state transitions with an atomic update, constraint, or appropriate lock rather than a read-then-write check.
- Group writes that must succeed together in a transaction, with network calls outside that transaction.
- Check whether bulk operations bypass validations and callbacks before using them, including `update_all`, `update_columns`, `insert_all`, and `delete_all`.

## Migrations

- Write a new migration for every schema change.
  Never edit an applied migration or the schema dump; the agent guardrails block both.
- Prefer reversible `change` methods, and write `up` and `down` when Rails cannot infer the reversal.
- Avoid depending on application model classes in migrations, since the model can change after the migration ships; use SQL or a minimal model class defined inside the migration.
- When adding constraints or changing populated columns, inspect existing data and deployment compatibility before choosing migration and backfill steps.
- Follow the project's existing safety tooling, such as `strong_migrations`, when it is installed.

## Changing populated tables on PostgreSQL

- Add a column as nullable, backfill it, then add the `NOT NULL` constraint, so old and new code can both run during deploy.
- Add check constraints and foreign keys with `validate: false`, then validate them in a separate migration with `validate_check_constraint` or `validate_foreign_key`.
- Add indexes to large tables with `algorithm: :concurrently` and `disable_ddl_transaction!`.
- Before removing a column, stop the application from reading it with `self.ignored_columns` and deploy that first.
- Run large backfills in batches, such as `in_batches`, and outside the schema-changing migration when they could hold locks for long.

**Complete when:** every persisted invariant is enforced by the database where concurrency or alternate writers could break it, each migration is new and reversible or explicitly irreversible, and changes to populated tables are safe to deploy.
