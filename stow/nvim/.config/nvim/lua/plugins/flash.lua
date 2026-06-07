return {
  "folke/flash.nvim",
  event = "VeryLazy",
  opts = {},
  keys = {
    {
      "<leader>jj",
      function()
        require("flash").jump()
      end,
      mode = { "n", "x", "o" },
      desc = "Jump to character",
    },
    {
      "<leader>jw",
      function()
        require("flash").jump({
          pattern = [[\<]],
          search = { mode = "search" },
        })
      end,
      mode = { "n", "x", "o" },
      desc = "Jump to word",
    },
    {
      "<leader>jl",
      function()
        require("flash").jump({
          search = { mode = "search", max_length = 0 },
          label = { after = { 0, 0 } },
          pattern = "^",
        })
      end,
      mode = { "n", "x", "o" },
      desc = "Jump to line",
    },
  },
}
