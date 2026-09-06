local function navigate_split(wincmd, direction)
  local previous_window = vim.api.nvim_get_current_win()
  vim.cmd("wincmd " .. wincmd)
  if vim.api.nvim_get_current_win() ~= previous_window then
    return
  end

  if not vim.env.HERDR_PANE_ID or vim.env.HERDR_PANE_ID == "" then
    return
  end
  local herdr = vim.env.HERDR_BIN_PATH or "herdr"
  if vim.fn.executable(herdr) == 1 then
    vim.fn.system({ herdr, "pane", "focus", "--direction", direction, "--current" })
  end
end

for key, direction in pairs({ h = "left", j = "down", k = "up", l = "right" }) do
  vim.keymap.set("n", "<C-" .. key .. ">", function()
    navigate_split(key, direction)
  end, { silent = true, desc = "Navigate " .. direction .. " (Vim/Herdr)" })
end
