return {
  "stevearc/conform.nvim",
  event = { "BufWritePre" },
  cmd = { "ConformInfo" },
  opts = {
    formatters_by_ft = {
      lua = { "stylua" },
      python = { "ruff_organize_imports", "ruff_format" },
      javascript = { "biome" },
      typescript = { "biome" },
      javascriptreact = { "biome" },
      typescriptreact = { "biome" },
      go = { "goimports", "gofmt" },
      eruby = { "erb_format" },
    },
    formatters = {
      erb_format = {
        command = "bundle",
        prepend_args = { "exec", "erb-format" },
        cwd = function(self, ctx)
          return require("conform.util").root_file({ "Gemfile" })(self, ctx)
        end,
        require_cwd = true,
      },
    },
    format_on_save = function(bufnr)
      local filetype = vim.bo[bufnr].filetype
      return {
        timeout_ms = (filetype == "ruby" or filetype == "eruby") and 3000 or 500,
        lsp_format = filetype == "eruby" and "never" or "fallback",
      }
    end,
  },
}
