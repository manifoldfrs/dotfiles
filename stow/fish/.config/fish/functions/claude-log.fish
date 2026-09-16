function claude-log -d "Run Claude Code with Anthropic request logging enabled"
  node "$HOME/.claude/request-logger/claude-log.mjs" $argv
end
