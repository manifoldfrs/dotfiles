return {
  {
    "Shatur/neovim-ayu",
    lazy = false,
    priority = 1000,
    config = function()
      vim.o.background = "dark"

      local colors = require("ayu.colors")
      colors.generate()

      require("ayu").setup({
        overrides = {
          WinSeparator = { fg = colors.guide_active },
          -- Upstream uses a guide color for line numbers, which is nearly invisible on the dark background.
          LineNr = { fg = colors.gutter_normal },
        },
      })

      vim.cmd.colorscheme("ayu-dark")

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
