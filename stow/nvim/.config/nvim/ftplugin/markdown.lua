vim.opt_local.wrap = true
vim.opt_local.linebreak = true
vim.opt_local.spell = false
vim.opt_local.conceallevel = 0

local spell_float_win

local function close_spell_float()
  if spell_float_win and vim.api.nvim_win_is_valid(spell_float_win) then
    vim.api.nvim_win_close(spell_float_win, true)
  end
  spell_float_win = nil
end

local function show_spell_float()
  close_spell_float()

  if not vim.opt_local.spell:get() then
    return
  end

  local word = vim.fn.expand("<cword>")
  if word == "" then
    return
  end

  local spell_result = vim.fn.spellbadword(word)
  if spell_result[1] ~= word or spell_result[2] == "" then
    return
  end

  local suggestions = vim.fn.spellsuggest(word, 5)
  local lines = { "Spelling: " .. word }

  if #suggestions > 0 then
    table.insert(lines, "")
    vim.list_extend(lines, suggestions)
  end

  local _, win = vim.lsp.util.open_floating_preview(lines, "markdown", {
    border = "rounded",
    close_events = { "BufLeave", "CursorMoved", "InsertEnter", "FocusLost" },
    focusable = false,
  })

  spell_float_win = win
end

vim.api.nvim_create_autocmd({ "CursorHold", "CursorHoldI" }, {
  buffer = 0,
  callback = show_spell_float,
})

vim.api.nvim_create_autocmd({ "CursorMoved", "InsertEnter", "BufLeave" }, {
  buffer = 0,
  callback = close_spell_float,
})

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
