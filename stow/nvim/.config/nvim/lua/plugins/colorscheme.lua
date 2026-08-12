return {
  {
    "catppuccin/nvim",
    name = "catppuccin",
    lazy = false,
    priority = 1000,
    config = function()
      require("catppuccin").setup({
        flavour = "macchiato",
        transparent_background = false,
        float = {
          transparent = false,
          solid = true,
        },
        integrations = {
          blink_cmp = true,
          diffview = true,
          gitsigns = true,
          mason = true,
          native_lsp = { enabled = true },
          neo_tree = true,
          noice = true,
          notify = true,
          render_markdown = true,
          snacks = {
            enabled = true,
            indent_scope_color = "mauve",
          },
          treesitter = true,
          treesitter_context = true,
          which_key = true,
        },
        custom_highlights = function(colors)
          return {
            NormalFloat = { bg = colors.base },
            FloatBorder = { fg = colors.blue, bg = colors.base },
            Pmenu = { bg = colors.surface0 },
            PmenuSel = { fg = colors.text, bg = colors.surface1, bold = true },
            TelescopeNormal = { bg = colors.base },
            TelescopeBorder = { fg = colors.blue, bg = colors.base },
            TelescopePromptNormal = { bg = colors.base },
            TelescopePromptBorder = { fg = colors.blue, bg = colors.base },
            TelescopeResultsNormal = { bg = colors.base },
            TelescopeResultsBorder = { fg = colors.blue, bg = colors.base },
            TelescopePreviewNormal = { bg = colors.base },
            TelescopePreviewBorder = { fg = colors.blue, bg = colors.base },
            TelescopeTitle = { fg = colors.mauve, bg = colors.base },
            TelescopePromptTitle = { fg = colors.mauve, bg = colors.base },
            TelescopeResultsTitle = { fg = colors.mauve, bg = colors.base },
            TelescopePreviewTitle = { fg = colors.mauve, bg = colors.base },
          }
        end,
      })

      vim.cmd.colorscheme("catppuccin-macchiato")

      local diagnostic_underline_colors = {
        Error = "DiagnosticError",
        Warn = "DiagnosticWarn",
        Info = "DiagnosticInfo",
        Hint = "DiagnosticHint",
      }

      for severity, base_group in pairs(diagnostic_underline_colors) do
        local base_hl = vim.api.nvim_get_hl(0, { name = base_group })
        vim.api.nvim_set_hl(0, "DiagnosticUnderline" .. severity, {
          underline = true,
          undercurl = false,
          sp = base_hl.fg,
        })
      end

      local spell_underline_groups = {
        "SpellBad",
        "SpellCap",
        "SpellRare",
        "SpellLocal",
      }

      for _, group in ipairs(spell_underline_groups) do
        local base_hl = vim.api.nvim_get_hl(0, { name = group })
        vim.api.nvim_set_hl(0, group, {
          underline = true,
          undercurl = false,
          sp = base_hl.sp,
        })
      end
    end,
  },
}
