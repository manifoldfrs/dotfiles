return {
  "nvim-treesitter/nvim-treesitter",
  branch = "main",
  lazy = false,
  build = ":TSUpdate",
  config = function()
    local ts = require("nvim-treesitter")

    ts.setup({})

    local languages = {
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
      "query",
    }

    pcall(ts.install, languages, { summary = false })

    local group = vim.api.nvim_create_augroup("dotfiles_treesitter", { clear = true })
    vim.api.nvim_create_autocmd("FileType", {
      group = group,
      pattern = "*",
      callback = function(args)
        local ok = pcall(vim.treesitter.start, args.buf)
        if ok then
          vim.bo[args.buf].indentexpr = "v:lua.require'nvim-treesitter'.indentexpr()"
        end
      end,
    })
  end,
}
