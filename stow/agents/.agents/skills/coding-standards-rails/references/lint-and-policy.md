# Lint and policy

Use this reference when changing RuboCop configuration, writing a custom cop, adding security or static-analysis tooling, or claiming a rule is enforced.

## Establish actual enforcement

- Read the active `.rubocop.yml`, its `inherit_from` and `inherit_gem` sources, such as `rubocop-rails-omakase`, and the project's `bin/` scripts and CI workflow.
- A rule is enforced only if a command that runs in CI checks it.
  Prose in a skill, a style guide, or a proposed cop is a request, not enforcement.
- Read `.rubocop_todo.yml` as the list of existing violations the project tolerates, not as approval for new ones.
- Treat `rubocop:disable` comments as exceptions that need a stated reason.
- Run security checks the project ships, such as `bin/brakeman`, and type checks, such as Sorbet or Steep, when present.

## Choose the mechanism

| Problem | Appropriate enforcement |
| --- | --- |
| A syntactic pattern, such as `rescue nil` or `Card.find` in controllers | A custom RuboCop cop with clear limits on what its AST match can prove |
| A security class, such as SQL injection or unsafe redirects | Brakeman, reviewed rather than silenced |
| A data invariant, such as uniqueness | A database constraint, not a cop |
| An architectural boundary, such as no model calls from views | Review and the anti-slop-rails skill, unless a cop can match it precisely |
| A dangerous agent action, such as editing `db/schema.rb` | The shared agent guardrails, not instructions |

## Verify custom cops

- Test every custom cop with `expect_offense` and `expect_no_offense` cases from RuboCop's RSpec support, including legitimate look-alikes it must accept.
- Run the cop through the project's real configuration, not a copied approximation.
- State what the cop cannot see, such as dynamic dispatch or code outside its matched node.

**Complete when:** every enforcement claim names the configuration and command that runs it, each custom cop has passing positive and negative cases, and rules that are only proposed are labeled as such.
