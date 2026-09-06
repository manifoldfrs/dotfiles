vim.keymap.set("x", "<leader>a", function()
  local herdr = vim.env.HERDR_BIN_PATH or "herdr"
  if not vim.env.HERDR_PANE_ID or vim.env.HERDR_PANE_ID == "" or vim.fn.executable(herdr) ~= 1 then
    vim.notify("Herdr Annotate requires Neovim inside Herdr", vim.log.levels.WARN)
    return
  end

  local register = vim.fn.getreginfo("z")
  vim.cmd('normal! "zy')
  local selection = vim.fn.getreg("z")
  vim.fn.setreg("z", register)
  local runtime_dir = vim.env.XDG_RUNTIME_DIR
  if not runtime_dir or runtime_dir == "" then
    runtime_dir = vim.uv.os_tmpdir()
  end
  -- The plugin consumes this fixed handoff path and removes the selection file.
  local directory = runtime_dir .. "/herdr-annotate-" .. vim.uv.getuid()
  vim.fn.mkdir(directory, "p", "0700")
  local path = directory .. "/selection"
  vim.fn.writefile(vim.split(selection, "\n"), path)
  vim.fn.setfperm(path, "rw-------")
  vim.system({ herdr, "plugin", "action", "invoke", "annotate.capture" }, {}, function(result)
    if result.code ~= 0 then
      vim.schedule(function()
        vim.fn.delete(path)
        vim.notify("Herdr Annotate failed: " .. result.stderr, vim.log.levels.ERROR)
      end)
    end
  end)
end, { desc = "Annotate selection in Herdr" })
