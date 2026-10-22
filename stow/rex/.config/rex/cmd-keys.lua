-- Rex passes Cmd keys it doesn't use to Neovim as <D-…>, so Neovim's Cursor-style
-- keys need nothing here unless the app claims one; then add rex.unbind(key).
-- Cmd-Shift-P is Rex's command palette, so it goes to Neovim only when Neovim
-- is focused. Key functions can't open the palette, so this is an action.
local in_editor = require("editor")

rex.action({
  name = "palette_or_editor",
  title = "Command Palette (or Neovim's)",
  run = function(ctx, args)
    if not in_editor(ctx) then
      rex.client.queue("client.palette.toggle")
      return
    end
    local _, err = rex.call("client.key", {
      session_id = ctx.session_id,
      block_id = ctx.block_id,
      key = {
        key = "key_p",
        mods = "shift+super",
        consumed_mods = "shift",
        text = "P",
        unshifted_codepoint = 112,
        action = "press",
        composing = false,
      },
    })
    if err ~= nil then error(err, 0) end
  end,
})

rex.bind("cmd+shift+p", "palette_or_editor")
