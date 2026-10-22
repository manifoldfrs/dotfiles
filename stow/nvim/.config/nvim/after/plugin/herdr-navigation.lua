local function navigate_split(wincmd, direction)
  local previous_window = vim.api.nvim_get_current_win()
  vim.cmd("wincmd " .. wincmd)
  if vim.api.nvim_get_current_win() ~= previous_window then
    return
  end

  if vim.env.HERDR_PANE_ID and vim.env.HERDR_PANE_ID ~= "" then
    local herdr = vim.env.HERDR_BIN_PATH or "herdr"
    if vim.fn.executable(herdr) == 1 then
      vim.fn.system({ herdr, "pane", "focus", "--direction", direction, "--current" })
    end
    return
  end

  -- vim_rex_focus comes from vim-rex-navigator's Rex half, loaded by ~/.config/rex/navigator.lua.
  if vim.env.REX_SESSION and vim.env.REX_SESSION ~= "" and vim.fn.executable("rex") == 1 then
    vim.system({ "rex", "do", "vim_rex_focus", "direction=" .. direction })
  end
end

for key, direction in pairs({ h = "left", j = "down", k = "up", l = "right" }) do
  vim.keymap.set("n", "<C-" .. key .. ">", function()
    navigate_split(key, direction)
  end, { silent = true, desc = "Navigate " .. direction .. " (Vim/Herdr/Rex)" })
end
