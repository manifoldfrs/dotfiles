# Upstream source

The unmodified `plugin/` tree is copied from `skills/install-anti-slop/assets/anti-slop/` in [dmmulroy/anti-slop](https://github.com/dmmulroy/anti-slop/tree/13909c9e07590f5a85d93c62712259fe14a883f7).
The pinned commit is `13909c9e07590f5a85d93c62712259fe14a883f7`.
The root MIT license and the plugin's nested licenses are retained.

The launcher, package manifest, and two Oxlint configurations are dotfiles-owned integration, not changes to the upstream rules.
Oxlint and `@oxlint/plugins` use the upstream repository's matching `1.78.0` versions.
The generic configuration enables every generic rule listed by the pinned upstream skill, including the native companion rule.
The Effect configuration adds the five upstream Effect rules only when explicitly selected with `anti-slop --effect`.

To update, review a pinned upstream revision, replace the plugin tree without modifying its source, update this record and the matching dependency versions, and run `bash test/global_anti_slop_test.sh`.
