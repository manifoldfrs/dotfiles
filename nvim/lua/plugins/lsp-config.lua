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
          -- "pyright",  -- Disabled: using ty for Python instead (installed as fallback)
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

      -- Configure ty type checker for Python (Neovim 0.11+)
      -- NOTE: ty is in BETA (Dec 2025) but production-ready per Astral
      vim.lsp.config('ty', {
        cmd = { 'ty', 'server' },
        filetypes = { 'python' },
        root_dir = vim.fs.root(0, {'pyproject.toml', 'setup.py', 'setup.cfg', 'requirements.txt', '.git'}),
        settings = {
          ty = {}
        }
      })
      
      -- Enable ty language server
      vim.lsp.enable('ty')

      vim.diagnostic.config({
        virtual_text = false,
        virtual_lines = { current_line = true },
        signs = {
          text = {
            [vim.diagnostic.severity.ERROR] = " ",
            [vim.diagnostic.severity.WARN] = " ",
            [vim.diagnostic.severity.HINT] = " ",
            [vim.diagnostic.severity.INFO] = " ",
          },
        },
        underline = true,
        update_in_insert = false,
        float = {
          border = "rounded",
          source = "always",
        },
      })

      vim.api.nvim_create_autocmd("LspAttach", {
        callback = function(args)
          local buf = args.buf
          vim.keymap.set("n", "K", vim.lsp.buf.hover, { buffer = buf, desc = "Hover documentation" })
          vim.keymap.set("n", "gd", vim.lsp.buf.definition, { buffer = buf, desc = "Go to definition" })
          vim.keymap.set("n", "gD", vim.lsp.buf.declaration, { buffer = buf, desc = "Go to declaration" })
          vim.keymap.set("n", "gi", vim.lsp.buf.implementation, { buffer = buf, desc = "Go to implementation" })
          vim.keymap.set("n", "gr", vim.lsp.buf.references, { buffer = buf, desc = "Go to references" })
          vim.keymap.set("n", "gl", vim.diagnostic.open_float, { buffer = buf, desc = "Show diagnostics" })
          vim.keymap.set("n", "<leader>rn", vim.lsp.buf.rename, { buffer = buf, desc = "Rename symbol" })
          vim.keymap.set("n", "<leader>ca", vim.lsp.buf.code_action, { buffer = buf, desc = "Code action" })
          vim.keymap.set("n", "[d", vim.diagnostic.goto_prev, { buffer = buf, desc = "Previous diagnostic" })
          vim.keymap.set("n", "]d", vim.diagnostic.goto_next, { buffer = buf, desc = "Next diagnostic" })
        end,
      })
    end,
  },
}
