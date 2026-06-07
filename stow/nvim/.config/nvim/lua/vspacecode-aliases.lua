local map = vim.keymap.set

local opts = { noremap = true, silent = true }

local function snack(fn)
  return function()
    Snacks[fn]()
  end
end

local function picker(fn)
  return function()
    Snacks.picker[fn]()
  end
end

local function copy_current_file_path()
  local path = vim.fn.expand("%:p")
  if path == "" then
    vim.notify("No file path for current buffer", vim.log.levels.WARN)
    return
  end
  vim.fn.setreg("+", path)
  vim.notify("Copied: " .. path)
end

-- VSpaceCode-style aliases. These intentionally sit alongside the existing
-- mnemonic mappings so Cursor muscle memory works without replacing the setup.

-- File / project actions
map("n", "<leader>ff", picker("files"), { desc = "Find Files" })
map("n", "<leader>fr", picker("recent"), { desc = "Recent Files" })
map("n", "<leader>fs", "<cmd>write<cr>", { desc = "Save File" })
map("n", "<leader>fS", "<cmd>wall<cr>", { desc = "Save All" })
map("n", "<leader>ft", snack("explorer"), { desc = "File Tree" })
map("n", "<leader>fT", "<cmd>Neotree reveal<cr>", { desc = "Reveal In Tree" })
map("n", "<leader>fy", copy_current_file_path, { desc = "Copy File Path" })
map("n", "<leader>fe", function()
  vim.cmd.edit(vim.fn.stdpath("config") .. "/init.lua")
end, { desc = "Edit Nvim Config" })

map("n", "<leader>pf", picker("files"), { desc = "Project Files" })
map("n", "<leader>pp", picker("recent"), { desc = "Recent Projects/Files" })
map("n", "<leader>pt", snack("explorer"), { desc = "Project Tree" })

-- Buffer actions. Keep <leader>bp available for bufferline pinning.
map("n", "<leader>bb", picker("buffers"), { desc = "Buffers" })
map("n", "<leader>bn", "<cmd>bnext<cr>", { desc = "Next Buffer" })
map("n", "<leader>bN", "<cmd>bprevious<cr>", { desc = "Previous Buffer" })
map("n", "<leader>bu", "<cmd>edit #<cr>", { desc = "Alternate Buffer" })

-- Search / symbol aliases from the VSpaceCode shape.
map("n", "<leader>se", vim.lsp.buf.rename, { desc = "Rename Symbol" })
map("n", "<leader>sj", picker("lsp_symbols"), { desc = "Document Symbols" })
map("n", "<leader>sJ", picker("jumps"), { desc = "Jumps" })
map("n", "<leader>sp", picker("grep"), { desc = "Search Project" })
map("n", "<leader>sP", function()
  require("spectre").open_visual({ select_word = true })
end, { desc = "Search Word In Project" })
map("v", "<leader>sP", function()
  require("spectre").open_visual()
end, { desc = "Search Selection In Project" })

-- Window actions mirror VSpaceCode's <leader>w group.
map("n", "<leader>wh", "<C-w>h", vim.tbl_extend("force", opts, { desc = "Window Left" }))
map("n", "<leader>wj", "<C-w>j", vim.tbl_extend("force", opts, { desc = "Window Down" }))
map("n", "<leader>wk", "<C-w>k", vim.tbl_extend("force", opts, { desc = "Window Up" }))
map("n", "<leader>wl", "<C-w>l", vim.tbl_extend("force", opts, { desc = "Window Right" }))
map("n", "<leader>ww", "<C-w>w", vim.tbl_extend("force", opts, { desc = "Next Window" }))
map("n", "<leader>wW", "<C-w>W", vim.tbl_extend("force", opts, { desc = "Previous Window" }))
map("n", "<leader>w/", "<cmd>vsplit<cr>", { desc = "Split Right" })
map("n", "<leader>wv", "<cmd>vsplit<cr>", { desc = "Split Right" })
map("n", "<leader>w-", "<cmd>split<cr>", { desc = "Split Below" })
map("n", "<leader>ws", "<cmd>split<cr>", { desc = "Split Below" })
map("n", "<leader>wd", "<C-w>c", vim.tbl_extend("force", opts, { desc = "Close Window" }))
map("n", "<leader>w=", "<C-w>=", vim.tbl_extend("force", opts, { desc = "Balance Windows" }))

-- Quit / reload actions.
map("n", "<leader>qq", "<cmd>quitall<cr>", { desc = "Quit All" })
map("n", "<leader>qf", "<cmd>quit<cr>", { desc = "Close Window" })
map("n", "<leader>qr", function()
  vim.cmd.source(vim.fn.stdpath("config") .. "/init.lua")
end, { desc = "Reload Nvim Config" })

-- Major-mode/localleader aliases. Cursor uses comma for VSpaceCode major mode;
-- in Neovim this becomes quick buffer-local-ish actions.
map("n", "<localleader>f", function()
  vim.lsp.buf.format({ async = true })
end, { desc = "Format Buffer" })
map("n", "<localleader>t", "<cmd>TestNearest<cr>", { desc = "Test Nearest" })
map("n", "<localleader>T", "<cmd>TestFile<cr>", { desc = "Test File" })
map("n", "<localleader>r", vim.lsp.buf.rename, { desc = "Rename Symbol" })
map("n", "<localleader>a", vim.lsp.buf.code_action, { desc = "Code Action" })
map("n", "<localleader>d", vim.diagnostic.open_float, { desc = "Line Diagnostics" })
map("n", "<localleader>s", picker("lsp_symbols"), { desc = "Document Symbols" })
