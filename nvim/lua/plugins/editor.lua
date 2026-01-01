return {
  -- Auto pairs
  {
    "windwp/nvim-autopairs",
    event = "InsertEnter",
    config = function()
      require("nvim-autopairs").setup({
        check_ts = true,
      })
      local cmp_autopairs = require("nvim-autopairs.completion.cmp")
      require("cmp").event:on("confirm_done", cmp_autopairs.on_confirm_done())
    end,
  },

  -- Comments
  {
    "numToStr/Comment.nvim",
    event = { "BufReadPost", "BufNewFile" },
    config = function()
      require("Comment").setup()
    end,
  },

  -- Surround
  {
    "kylechui/nvim-surround",
    version = "*",
    event = "VeryLazy",
    config = function()
      require("nvim-surround").setup()
    end,
  },

  -- Indent guides
  {
    "lukas-reineke/indent-blankline.nvim",
    main = "ibl",
    event = { "BufReadPost", "BufNewFile" },
    config = function()
      require("ibl").setup({
        indent = { char = "▏" },
        scope = { enabled = true },
        exclude = {
          filetypes = { "help", "alpha", "dashboard", "neo-tree", "Trouble", "lazy" },
        },
      })
    end,
  },

  -- Better buffer delete
  { "moll/vim-bbye", cmd = { "Bdelete", "Bwipeout" } },

  -- Plenary (dependency)
  { "nvim-lua/plenary.nvim", lazy = true },
}
