return {
  "nvim-neo-tree/neo-tree.nvim",
  branch = "v3.x",
  dependencies = {
    "nvim-lua/plenary.nvim",
    "nvim-tree/nvim-web-devicons",
    "MunifTanjim/nui.nvim",
  },
  config = function()
    require("neo-tree").setup({
      filesystem = {
        follow_current_file = {
          enabled = true,
          leave_dirs_open = true,
        },
        filtered_items = {
          visible = true,
          hide_dotfiles = false,
          hide_gitignored = false,
        },
      },
    })
    vim.keymap.set("n", "<C-n>", ":Neotree filesystem toggle left<CR>", { desc = "File tree" })
    vim.keymap.set("n", "<leader>bf", ":Neotree buffers reveal float<CR>", { desc = "Buffer explorer" })
  end,
}
