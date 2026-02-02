return {
  "nvim-treesitter/nvim-treesitter",
  build = ":TSUpdate",
  config = function()
    require("nvim-treesitter.configs").setup({
      ensure_installed = {
        "lua",
        "javascript",
        "typescript",
        "tsx",
        "python",
        "go",
        "c",
        "cpp",
        "json",
        "yaml",
        "html",
        "css",
        "markdown",
        "markdown_inline",
        "vim",
        "vimdoc",
      },
      auto_install = true,
      highlight = { enable = true },
      indent = { enable = true },
    })
  end,
}
