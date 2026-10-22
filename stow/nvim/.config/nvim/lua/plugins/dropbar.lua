return {
  "Bekaboo/dropbar.nvim",
  event = { "BufReadPost", "BufNewFile" },
  opts = {},
  keys = {
    { "<leader>;", function() require("dropbar.api").pick() end, desc = "Pick Breadcrumb" },
  },
}
