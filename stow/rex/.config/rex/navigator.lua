-- The Rex half of vim-rex-navigator ships inside the Neovim plugin, so load it
-- from where lazy.nvim installs it. A fresh machine has no copy until Neovim
-- runs once; skip it instead of failing the whole configuration.
local plugin_dir = os.getenv("HOME") .. "/.local/share/nvim/lazy/vim-rex-navigator/rex/?.lua"
package.path = plugin_dir .. ";" .. package.path

local ok, navigator = pcall(require, "vim-rex-navigator")
if not ok then
  rex.log("warn", "vim-rex-navigator is not installed; open Neovim once to install it")
  return
end

-- Only the vim_rex_* actions that Neovim calls at a split's edge come from the
-- plugin. Its own focus keys unbind alt+cmd+arrow defaults this client doesn't
-- have, which leaves warnings in `rex keymap`, so the keys are bound below.
navigator.setup({
  focus = false,
  move = false,
  resize = false,
  close = false,
})

local in_editor = require("editor")

local function focus(direction)
  return function(ctx)
    if in_editor(ctx) then
      return false
    end
    rex.session.focus_direction({ direction = direction })
    return true
  end
end

rex.bind("ctrl+h", focus("left"))
rex.bind("ctrl+j", focus("down"))
rex.bind("ctrl+k", focus("up"))
rex.bind("ctrl+l", focus("right"))
