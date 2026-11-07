# Authorization and tenancy

Use this reference when record lookup, access rules, tenants, nested resources, or actor context change.

- Resolve records through the authorized tenant or user scope before reading or mutating them, such as `Current.account.cards.find(params[:id])` rather than `Card.find(params[:id])`.
- Verify nested resources belong to their authorized parent, and derive ownership attributes from trusted context rather than submitted IDs.
- Use the application's existing permission mechanism, with explicit actor-aware domain predicates where appropriate, such as `card.editable_by?(user)`.
- Strong parameters restrict assignment, not authorization.
- Keep one source of truth for a permission; duplicated checks drift.
- Pass required actor or tenant context into jobs and restore it using the project's scoped context mechanism, rather than assuming request-local `Current` values survive enqueueing.
- Treat every new lookup, endpoint, job, and Turbo Stream broadcast as a possible cross-tenant leak until its scope is traced.

**Complete when:** every changed read and write resolves through an authorized scope, nested records are checked against their parent, and jobs and broadcasts carry explicit actor or tenant context.
