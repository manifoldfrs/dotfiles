-- Shared by navigator.lua and cmd-keys.lua: is Vim or Neovim the focused
-- terminal's foreground program?
local TERMINAL = "com.superlogical.terminal"
local EDITORS = { vim = true, nvim = true }

return function(ctx)
  local process = rex.block.call(TERMINAL, "process", { block_id = ctx.block_id })
  local foreground = process and process.foreground
  return foreground ~= nil and EDITORS[foreground.name] == true
end
