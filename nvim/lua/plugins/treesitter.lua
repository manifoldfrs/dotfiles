return {
  "nvim-treesitter/nvim-treesitter",
  branch = "main",
  lazy = false,
  build = ":TSUpdate",
  config = function()
    local ts = require("nvim-treesitter")

    -- Install parsers (async, no-op if already installed)
    ts.install({
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
    })

    -- Enable highlighting and indentation for all filetypes
    vim.api.nvim_create_autocmd("FileType", {
      group = vim.api.nvim_create_augroup("treesitter_setup", { clear = true }),
      pattern = "*",
      callback = function(args)
        -- Enable treesitter highlighting
        pcall(vim.treesitter.start, args.buf)
        -- Enable treesitter-based indentation
        vim.bo[args.buf].indentexpr = "v:lua.require'nvim-treesitter'.indentexpr()"
      end,
    })

    -- Enable treesitter-based folding
    vim.opt.foldmethod = "expr"
    vim.opt.foldexpr = "v:lua.vim.treesitter.foldexpr()"
    vim.opt.foldenable = false
  end,
}
