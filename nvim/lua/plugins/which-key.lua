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
      { "<leader>g", group = "Git" },
      { "<leader>t", group = "Test" },
      { "<leader>b", group = "Buffer" },
      { "<leader>d", group = "Debug" },
      { "<leader>o", group = "opencode" },
      { "<leader>s", group = "Search" },
      { "<leader>u", group = "Toggle" },
      { "<leader>gD", desc = "Diffview Open" },
      { "<leader>gC", desc = "Diffview Close" },
      { "<leader>gh", desc = "File History (Current)" },
      { "<leader>gH", desc = "File History (Repo)" },
      { "<leader>sg", desc = "Grep" },
      { "<leader>sn", desc = "Notification History" },
      { "<leader>ss", desc = "LSP Symbols" },
      { "<leader>sR", desc = "Replace in Project" },
      { "<leader>sw", desc = "Search Current Word" },
      { "<leader>sW", desc = "Search Current File" },
    })
  end,
}
