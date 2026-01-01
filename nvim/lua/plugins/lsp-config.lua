return {
  {
    "williamboman/mason.nvim",
    lazy = false,
    config = function()
      require("mason").setup()
    end,
  },
  {
    "williamboman/mason-lspconfig.nvim",
    lazy = false,
    dependencies = {
      "williamboman/mason.nvim",
      "neovim/nvim-lspconfig",
    },
    config = function()
      vim.lsp.config("lua_ls", {
        settings = {
          Lua = {
            diagnostics = { globals = { "vim" } },
            workspace = { checkThirdParty = false },
            telemetry = { enable = false },
          },
        },
      })

      require("mason-lspconfig").setup({
        ensure_installed = {
          "lua_ls",
          "ts_ls",
          "pyright",
          "gopls",
          "clangd",
        },
        automatic_enable = true,
      })
    end,
  },
  {
    "neovim/nvim-lspconfig",
    lazy = false,
    dependencies = {
      "hrsh7th/cmp-nvim-lsp",
    },
    config = function()
      local lspconfig = require("lspconfig")

      lspconfig.util.default_config = vim.tbl_deep_extend(
        "force",
        lspconfig.util.default_config,
        { capabilities = require("cmp_nvim_lsp").default_capabilities() }
      )

      vim.diagnostic.config({
        virtual_text = false,
        signs = true,
        underline = true,
        update_in_insert = false,
        float = {
          border = "rounded",
          source = "always",
        },
      })

      local signs = { Error = " ", Warn = " ", Hint = " ", Info = " " }
      for type, icon in pairs(signs) do
        local hl = "DiagnosticSign" .. type
        vim.fn.sign_define(hl, { text = icon, texthl = hl })
      end

      vim.api.nvim_create_autocmd("LspAttach", {
        callback = function(args)
          local opts = { buffer = args.buf }
          vim.keymap.set("n", "K", vim.lsp.buf.hover, opts)
          vim.keymap.set("n", "gd", vim.lsp.buf.definition, opts)
          vim.keymap.set("n", "gD", vim.lsp.buf.declaration, opts)
          vim.keymap.set("n", "gi", vim.lsp.buf.implementation, opts)
          vim.keymap.set("n", "gr", vim.lsp.buf.references, opts)
          vim.keymap.set("n", "gl", vim.diagnostic.open_float, opts)
          vim.keymap.set("n", "<leader>rn", vim.lsp.buf.rename, opts)
          vim.keymap.set("n", "<leader>ca", vim.lsp.buf.code_action, opts)
          vim.keymap.set("n", "[d", vim.diagnostic.goto_prev, opts)
          vim.keymap.set("n", "]d", vim.diagnostic.goto_next, opts)
        end,
      })
    end,
  },
}
