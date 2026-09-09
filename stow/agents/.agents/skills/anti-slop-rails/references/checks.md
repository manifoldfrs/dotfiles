# Rails anti-slop candidates

Use these checks during step 2 of the skill.
Apply only the checks relevant to the scoped behavior.
Each row names a search lead, the evidence required to call it a problem, and a legitimate reason to retain it.
The linked [Rails standards](../../coding-standards-rails/SKILL.md) remain authoritative.

| Candidate | Evidence required | Repair direction and legitimate exceptions |
| --- | --- | --- |
| Pass-through services, repositories, or result objects | Trace the caller chain and show that a layer adds no policy, translation, coordination, or used contract | Call the owning model directly when that removes only indirection. Keep real external boundaries, form validation, and useful orchestration. |
| Speculative options and fallback branches | Search callers, configuration, public contracts, and supported versions to establish that a branch has no supported use | Remove internal unused flexibility. Preserve public APIs and compatibility obligations even if local callers do not exercise them. |
| Nil/default laundering with `&.`, `try`, `dig`, `to_i`, `presence`, or `||` | Show that malformed or missing data becomes plausible success, or that false, zero, blank, and absent values are incorrectly merged | Validate at the owning boundary and preserve meaning. Keep defaults and optional associations that the contract explicitly allows. |
| Rescue-to-success, `rescue nil`, empty rescue, or broad `rescue_from` | Identify an unexpected exception that is hidden, a partial operation reported as success, or a failure removed from reporting | Recover from specific expected failures and preserve reporting for the rest. A top-level reporter that re-raises is a valid boundary. |
| Duplicated authorization or tenant policy | Trace record lookup, parent ownership, and the existing authorization mechanism to identify an actual bypass or conflicting rule | Resolve through the authorized scope and reuse its policy. Strong parameters alone do not establish access. Keep proven global/admin access paths. |
| Unchecked persistence or validation bypass | Show how a failed `save`/`update`, `update_columns`, `update_all`, or raw write violates the caller's contract | Check recoverable failures or use raising writes where failure must abort. Keep intentional bulk writes after verifying constraints and skipped callbacks. |
| Claimed uniqueness, atomicity, or idempotency without enforcement | Inspect schema, transaction scope, locks, and replay behavior to construct the conflicting or repeated operation | Enforce the invariant at the database or delivery boundary. A uniqueness validator, transaction alone, or early `exists?` check is not a concurrency proof. |
| Callback chains or retries hiding side effects | Trace when external effects occur relative to commit and how a retry or rollback changes the result | Make business transitions explicit and verify delivery behavior. Keep cohesive lifecycle callbacks and adapters whose semantics are tested. |
| Ruby-side query work, N+1 access, or speculative caches | Establish collection size, executed queries, or a measured cost and inspect ordering and invalidation requirements | Use appropriate SQL or eager loading. Keep small bounded in-memory collections and justified caches. Do not claim a performance win without evidence. |
| Tests that manufacture the guarantee | Show that stubs bypass the constraint, permission check, transaction, or job behavior the assertion claims to test | Exercise that real boundary and assert observable state. Keep external-service replacements and focused unit isolation where they preserve the tested contract. |
| Generic hash protocols or metaprogramming | Trace a finite domain operation obscured by string keys, `send`, dynamic constants, or magic registration with no concrete need | Prefer named domain methods or small Ruby objects when clearer. Keep supported plugin protocols and Rails conventions rather than imitating static typing. |
| Explanatory noise | Show that a comment only narrates syntax or makes an unsupported safety claim | Remove the narration or verify the claim. Preserve comments explaining constraints, non-obvious tradeoffs, or external requirements. |

## Calibration examples

These are reasoning fixtures, not executable application tests.
Use them to check that the skill distinguishes a suspicious expression from a proven defect.

### Missing input disguised as valid data

```ruby
quantity = params[:quantity].to_i
```

**Flag when:** the endpoint requires a supplied positive integer, but missing or nonnumeric input reaches persistence as zero without rejection.
**Retain when:** the documented input contract intentionally maps those values to zero and tests verify that behavior.
**Verify:** request tests for missing, malformed, zero, and valid input, using the endpoint's actual contract.

### Optional association

```ruby
invoice.cancelled_by&.name
```

**Retain when:** an invoice can be uncancelled or its actor optional, and the view deliberately renders no name.
**Flag when:** the caller requires an actor and the expression hides a broken ownership or persistence invariant.
**Verify:** inspect the association, schema, lifecycle, and caller before changing optionality.

### A layer with no responsibility

```ruby
class FindInvoice
  def self.call(account, id)
    account.invoices.find(id)
  end
end
```

**Candidate:** direct authorized association lookup may be clearer at the caller.
**Flag only after:** verifying the object has no required interface, instrumentation, policy, or compatibility obligation.
**Preserve:** the `account.invoices` scope when removing the wrapper.
Replacing it with `Invoice.find(id)` would remove an access boundary.

### Retry without an idempotency guarantee

```ruby
return if payment.charged?
gateway.charge(payment.amount)
payment.update!(charged: true)
```

**Flag when:** concurrent execution or a crash after the gateway call can charge twice.
**Verify:** gateway idempotency support, durable keys, and the real retry boundary.
**Repair direction:** reuse a durable operation key at the provider boundary or the application's established delivery protocol.
A database transaction around the network call does not make the external charge roll back.

### Mocking the claimed property away

A test that stubs `invoice.save!` cannot establish that a uniqueness index rejects conflicting writes.
Keep mocks for external services, but verify database guarantees against the real test database and inspect whether it matches the production adapter for the claim being made.
