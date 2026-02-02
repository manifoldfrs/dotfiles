return {
  {
    "lewis6991/gitsigns.nvim",
    event = { "BufReadPre", "BufNewFile" },
    config = function()
      require("gitsigns").setup({
        signs = {
          add = { text = "│" },
          change = { text = "│" },
          delete = { text = "_" },
          topdelete = { text = "‾" },
          changedelete = { text = "~" },
        },
        on_attach = function(bufnr)
          local gs = package.loaded.gitsigns
          local opts = { buffer = bufnr }

          vim.keymap.set("n", "<leader>gp", gs.preview_hunk, vim.tbl_extend("force", opts, { desc = "Preview hunk" }))
          vim.keymap.set("n", "<leader>gt", gs.toggle_current_line_blame, vim.tbl_extend("force", opts, { desc = "Toggle blame" }))
          vim.keymap.set("n", "]h", gs.next_hunk, vim.tbl_extend("force", opts, { desc = "Next hunk" }))
          vim.keymap.set("n", "[h", gs.prev_hunk, vim.tbl_extend("force", opts, { desc = "Prev hunk" }))
        end,
      })
    end,
  },
  {
    "tpope/vim-fugitive",
    cmd = { "Git", "Gstatus", "Gblame", "Gpush", "Gpull" },
  },
  {
    "akinsho/git-conflict.nvim",
    version = "*",
    config = true
  }
}
