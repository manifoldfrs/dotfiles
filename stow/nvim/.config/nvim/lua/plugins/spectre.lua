return {
  "nvim-pack/nvim-spectre",
  cmd = { "Spectre" },
  dependencies = { "nvim-lua/plenary.nvim" },
  keys = {
    {
      "<leader>sR",
      function()
        require("spectre").toggle()
      end,
      desc = "Replace in Project",
    },
    {
      "<leader>sw",
      function()
        require("spectre").open_visual({ select_word = true })
      end,
      desc = "Search Current Word",
    },
    {
      "<leader>sw",
      function()
        require("spectre").open_visual()
      end,
      mode = "v",
      desc = "Search Selection",
    },
    {
      "<leader>sW",
      function()
        require("spectre").open_file_search({ select_word = true })
      end,
      desc = "Search Current File",
    },
  },
  config = function()
    require("spectre").setup()
  end,
}
