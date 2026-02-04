return {
  "NickvanDyke/opencode.nvim",
  dependencies = {
    "folke/snacks.nvim",
  },
  config = function()
    -- REQUIRED: Enable autoread for file reload feature
    vim.o.autoread = true

    -- Configuration via global variable for faster startup
    vim.g.opencode_opts = {
      -- Use tmux provider for running opencode in tmux split
      provider = {
        enabled = "tmux",
        tmux = {
          options = "-h",
          focus = false,
        },
      },
      -- Enable blink.cmp in ask() input
      ask = {
        blink_cmp_sources = { "opencode", "buffer" },
      },
    }

    -- Keymaps with <leader>o prefix
    vim.keymap.set({ "n", "x" }, "<leader>oa", function()
      require("opencode").ask("@this: ", { submit = true })
    end, { desc = "Ask opencode about this" })

    vim.keymap.set({ "n", "x" }, "<leader>os", function()
      require("opencode").select()
    end, { desc = "Select opencode action" })

    vim.keymap.set({ "n", "t" }, "<leader>ot", function()
      require("opencode").toggle()
    end, { desc = "Toggle opencode" })

    vim.keymap.set({ "n", "x" }, "<leader>oo", function()
      return require("opencode").operator("@this ")
    end, { desc = "Add range to opencode", expr = true })

    vim.keymap.set("n", "<leader>og", function()
      return require("opencode").operator("@this ") .. "_"
    end, { desc = "Add line to opencode", expr = true })
  end,
}
