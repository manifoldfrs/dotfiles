return {
  "folke/snacks.nvim",
  priority = 1000,
  lazy = false,
  ---@type snacks.Config
  opts = {
    -- REQUIRED for opencode.nvim
    input = { enabled = true },
    picker = { enabled = true },
    
    -- DISABLED: using tmux for opencode instead of snacks.terminal
    terminal = { enabled = false },
    
    -- REPLACEMENTS for existing plugins
    bufdelete = { enabled = true },
    indent = { enabled = true },
    scope = { enabled = true },
    
    -- NEW FEATURES
    bigfile = { enabled = true },
    dashboard = { enabled = true },
    lazygit = { enabled = true },
    notifier = { enabled = true },
    quickfile = { enabled = true },
    scratch = { enabled = true },
    words = { enabled = true },
    git = { enabled = true },
    zen = { enabled = true },
    toggle = { enabled = true },
  },
  keys = {
    -- Buffer management (replaces vim-bbye)
    { "<leader>bd", function() Snacks.bufdelete() end, desc = "Delete Buffer" },
    
    -- Git integration
    { "<leader>gg", function() Snacks.lazygit() end, desc = "Lazygit" },
    
    -- New features
    { "<leader>z", function() Snacks.zen() end, desc = "Zen Mode" },
    { "<leader>.", function() Snacks.scratch() end, desc = "Scratch Buffer" },
    { "<leader>S", function() Snacks.scratch.select() end, desc = "Select Scratch Buffer" },
    { "]]", function() Snacks.words.jump(vim.v.count1) end, desc = "Next Reference", mode = { "n", "t" } },
    { "[[", function() Snacks.words.jump(-vim.v.count1) end, desc = "Prev Reference", mode = { "n", "t" } },
    
    -- Picker keymaps (replaces telescope, using <leader>s prefix)
    { "<leader><space>", function() Snacks.picker.smart() end, desc = "Smart Find Files" },
    { "<leader>,", function() Snacks.picker.buffers() end, desc = "Buffers" },
    { "<leader>/", function() Snacks.picker.grep() end, desc = "Grep" },
    { "<C-p>", function() Snacks.picker.files() end, desc = "Find Files" },
    { "<leader>sf", function() Snacks.picker.files() end, desc = "Find Files" },
    { "<leader>sg", function() Snacks.picker.grep() end, desc = "Grep" },
    { "<leader>sb", function() Snacks.picker.buffers() end, desc = "Buffers" },
    { "<leader>sh", function() Snacks.picker.help() end, desc = "Help Pages" },
    { "<leader>sr", function() Snacks.picker.recent() end, desc = "Recent Files" },
    { "<leader>sc", function() Snacks.picker.colorschemes() end, desc = "Colorschemes" },
    { "<leader>sk", function() Snacks.picker.keymaps() end, desc = "Keymaps" },
    { "<leader>sn", function() Snacks.picker.notifications() end, desc = "Notification History" },
    
    -- Git pickers
    { "<leader>gb", function() Snacks.picker.git_branches() end, desc = "Git Branches" },
    { "<leader>gl", function() Snacks.picker.git_log() end, desc = "Git Log" },
    { "<leader>gs", function() Snacks.picker.git_status() end, desc = "Git Status" },
    { "<leader>gd", function() Snacks.picker.git_diff() end, desc = "Git Diff" },
    
    -- Search pickers
    { "<leader>ss", function() Snacks.picker.lsp_symbols() end, desc = "LSP Symbols" },
    { "<leader>sS", function() Snacks.picker.lsp_workspace_symbols() end, desc = "LSP Workspace Symbols" },
    { "<leader>sd", function() Snacks.picker.diagnostics() end, desc = "Diagnostics" },
    { "<leader>sD", function() Snacks.picker.diagnostics_buffer() end, desc = "Buffer Diagnostics" },
    { "<leader>sj", function() Snacks.picker.jumps() end, desc = "Jumps" },
    { "<leader>sm", function() Snacks.picker.marks() end, desc = "Marks" },
    { "<leader>sq", function() Snacks.picker.qflist() end, desc = "Quickfix List" },
    { "<leader>su", function() Snacks.picker.undo() end, desc = "Undo History" },
    
    -- LSP pickers (will override the basic gd/gr from lsp-config)
    { "gd", function() Snacks.picker.lsp_definitions() end, desc = "Goto Definition" },
    { "gD", function() Snacks.picker.lsp_declarations() end, desc = "Goto Declaration" },
    { "gr", function() Snacks.picker.lsp_references() end, nowait = true, desc = "References" },
    { "gI", function() Snacks.picker.lsp_implementations() end, desc = "Goto Implementation" },
    { "gy", function() Snacks.picker.lsp_type_definitions() end, desc = "Goto Type Definition" },
    
    -- Explorer
    { "<leader>e", function() Snacks.explorer() end, desc = "File Explorer" },
    
    -- Notifications
    { "<leader>un", function() Snacks.notifier.hide() end, desc = "Dismiss All Notifications" },
    { "<leader>n", function() Snacks.notifier.show_history() end, desc = "Notification History" },
    
    -- File operations
    { "<leader>cR", function() Snacks.rename.rename_file() end, desc = "Rename File" },
    { "<leader>gB", function() Snacks.gitbrowse() end, desc = "Git Browse", mode = { "n", "v" } },
  },
  init = function()
    vim.api.nvim_create_autocmd("User", {
      pattern = "VeryLazy",
      callback = function()
        -- Create toggle mappings integrated with which-key
        Snacks.toggle.option("spell", { name = "Spelling" }):map("<leader>us")
        Snacks.toggle.option("wrap", { name = "Wrap" }):map("<leader>uw")
        Snacks.toggle.option("relativenumber", { name = "Relative Number" }):map("<leader>uL")
        Snacks.toggle.diagnostics():map("<leader>ud")
        Snacks.toggle.line_number():map("<leader>ul")
        Snacks.toggle.option("conceallevel", { off = 0, on = vim.o.conceallevel > 0 and vim.o.conceallevel or 2 }):map("<leader>uc")
        Snacks.toggle.treesitter():map("<leader>uT")
        Snacks.toggle.option("background", { off = "light", on = "dark", name = "Dark Background" }):map("<leader>ub")
        Snacks.toggle.inlay_hints():map("<leader>uh")
        Snacks.toggle.indent():map("<leader>ug")
        Snacks.toggle.dim():map("<leader>uD")
      end,
    })
  end,
}
