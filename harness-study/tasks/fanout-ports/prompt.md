Each directory under `services/` has a `config.toml`.
Sum the `port` values of every service whose `env` is `"prod"`.
Only count the top-level `port` key; ignore commented-out lines and other keys such as `admin_port`.
End your reply with a final line `ANSWER: <integer>`.
