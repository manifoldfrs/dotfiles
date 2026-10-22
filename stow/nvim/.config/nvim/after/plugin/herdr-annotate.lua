local function annotate_in_rex(selection)
  -- --args keeps the selection a string even when it looks like a number or boolean.
  local args = vim.json.encode({ text = selection })
  vim.system({ "rex", "do", "annotate_capture", "--args", args }, {}, function(result)
    if result.code ~= 0 then
      vim.schedule(function()
        vim.notify("Rex Annotate failed: " .. result.stderr, vim.log.levels.ERROR)
      end)
    end
  end)
end

vim.keymap.set("x", "<leader>a", function()
  local herdr = vim.env.HERDR_BIN_PATH or "herdr"
  local in_herdr = vim.env.HERDR_PANE_ID and vim.env.HERDR_PANE_ID ~= "" and vim.fn.executable(herdr) == 1
  local in_rex = vim.env.REX_SESSION and vim.env.REX_SESSION ~= "" and vim.fn.executable("rex") == 1
  if not in_herdr and not in_rex then
    vim.notify("Annotate requires Neovim inside Herdr or Rex", vim.log.levels.WARN)
    return
  end

  local register = vim.fn.getreginfo("z")
  vim.cmd('normal! "zy')
  local selection = vim.fn.getreg("z")
  vim.fn.setreg("z", register)
  if not in_herdr then
    annotate_in_rex(selection)
    return
  end
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
end, { desc = "Annotate selection in Herdr or Rex" })
