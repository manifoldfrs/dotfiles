return {
  "folke/which-key.nvim",
  event = "VeryLazy",
  config = function()
    local wk = require("which-key")
    wk.setup({
      plugins = {
        marks = true,
        registers = true,
        spelling = { enabled = true, suggestions = 20 },
      },
      win = {
        border = "rounded",
      },
      icons = {
        rules = false, -- Disable filetype icon fallback (fixes blue squares)
      },
    })

    wk.add({
      { "<leader>f", group = "Find" },
      { "<leader>g", group = "Git" },
      { "<leader>l", group = "LSP" },
      { "<leader>t", group = "Test" },
      { "<leader>b", group = "Buffer" },
      { "<leader>d", group = "Debug" },
      { "<leader>o", group = "opencode" },
      { "<leader>s", group = "Search" },
      { "<leader>u", group = "Toggle" },
      { "<leader>sn", group = "Notifications" },
      { "<leader>ss", group = "LSP Symbols" },
      { "<leader>sg", group = "Git Search" },
    })
  end,
}
