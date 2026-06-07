return {
  "sindrets/diffview.nvim",
  cmd = { "DiffviewOpen", "DiffviewFileHistory", "DiffviewClose" },
  keys = {
    { "<leader>gD", "<cmd>DiffviewOpen<CR>", desc = "Diffview Open" },
    { "<leader>gC", "<cmd>DiffviewClose<CR>", desc = "Diffview Close" },
    { "<leader>gh", "<cmd>DiffviewFileHistory %<CR>", desc = "File History (Current)" },
    { "<leader>gH", "<cmd>DiffviewFileHistory<CR>", desc = "File History (Repo)" },
  },
  config = function()
    require("diffview").setup({
      enhanced_diff_hl = true,
      show_help_hints = false,
      file_panel = {
        listing_style = "tree",
      },
    })
  end,
}
