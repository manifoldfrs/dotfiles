# Queries and performance

Use this reference when queries, scopes, eager loading, indexes, counters, or caches change.

- Filter, sort, aggregate, and paginate in SQL when the database owns that work.
- Use `pluck` when only stored column values are needed, and `exists?` rather than loading records to test presence.
- Eager-load associations with `includes`, `preload`, or `eager_load` when rendering would otherwise cause N+1 queries, and follow the project's `strict_loading` setting.
- Iterate large tables with `find_each` or `in_batches` rather than loading them whole.
- Add indexes for actual access patterns, and verify expensive query claims with measurements or query plans such as `explain`.
- Add counter caches or precomputed values only with a clear update and invalidation strategy.
- Add caching only with a measured cost and a named invalidation path, such as a key that includes `updated_at` and touches from children.
- Name reusable query conditions as scopes on the owning model.

**Complete when:** changed queries run in SQL where the database owns the work, rendering paths have no new N+1 queries, and every performance claim is backed by a measurement or query plan.
