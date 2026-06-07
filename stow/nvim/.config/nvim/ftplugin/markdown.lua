vim.opt_local.wrap = true
vim.opt_local.linebreak = true
vim.opt_local.spell = true
vim.opt_local.conceallevel = 0

local function preview_with_glow()
  if vim.fn.executable("glow") == 0 then
    vim.notify("glow is not installed. Run: brew install glow", vim.log.levels.WARN)
    return
  end

  local path = vim.api.nvim_buf_get_name(0)
  if path == "" then
    vim.notify("Save the markdown buffer before previewing with glow", vim.log.levels.WARN)
    return
  end

  vim.cmd.write()
  vim.cmd("botright 20split")
  vim.cmd("terminal glow " .. vim.fn.shellescape(path))
  vim.cmd.startinsert()
end

vim.keymap.set("n", "<leader>mp", preview_with_glow, { buffer = true, desc = "Preview Markdown with glow" })
vim.keymap.set("n", "<localleader>p", preview_with_glow, { buffer = true, desc = "Preview Markdown with glow" })
