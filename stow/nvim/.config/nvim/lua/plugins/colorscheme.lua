return {
  {
    "folke/tokyonight.nvim",
    lazy = false,
    priority = 1000,
    config = function()
      require("tokyonight").setup({
        style = "night",
        transparent = true,
        styles = {
          sidebars = "transparent",
          floats = "transparent",
        },
        on_colors = function(colors)
          local palette = {
            bg = "#14101f",
            bg_dark = "#211a33",
            bg_dark1 = "#181422",
            bg_highlight = "#24202f",
            bg_popup = "#211a33",
            bg_search = "#3a2b5c",
            bg_visual = "#3a2b5c",
            bg_statusline = colors.none,
            black = "#14101f",
            blue = "#7a9bf5",
            blue0 = "#3a2b5c",
            blue1 = "#5fd0e5",
            blue2 = "#82e0ef",
            blue5 = "#97b2f8",
            blue6 = "#82e0ef",
            blue7 = "#3a2b5c",
            border = "#353042",
            border_highlight = "#7a9bf5",
            comment = "#8d859d",
            cyan = "#5fd0e5",
            dark3 = "#6a5f85",
            dark5 = "#8d859d",
            fg = "#dcd2ee",
            fg_dark = "#b6abd0",
            fg_float = "#dcd2ee",
            fg_gutter = "#4a4458",
            fg_sidebar = "#b6abd0",
            green = "#72e0aa",
            green1 = "#92edc0",
            green2 = "#72e0aa",
            magenta = "#c980f2",
            magenta2 = "#ff7edb",
            orange = "#fed98c",
            purple = "#da9ff6",
            red = "#f66e93",
            red1 = "#fa8cab",
            teal = "#82e0ef",
            terminal_black = "#6a5f85",
            yellow = "#fdca6a",
            error = "#f66e93",
            todo = "#7a9bf5",
            warning = "#fdca6a",
            info = "#97b2f8",
            hint = "#82e0ef",
          }
          for name, color in pairs(palette) do
            colors[name] = color
          end
          -- Tokyo Night sets the blend colors before calling on_colors.
          local blend = require("tokyonight.util")
          blend.bg = colors.bg
          blend.fg = colors.fg
          colors.diff = { add = "#232c33", delete = "#331e30", change = "#23233c", text = "#3a2b5c" }
          colors.git = { add = colors.green, change = colors.blue, delete = colors.red, ignore = colors.dark3 }
          colors.rainbow = {
            colors.blue,
            colors.yellow,
            colors.green,
            colors.teal,
            colors.magenta,
            colors.purple,
            colors.orange,
            colors.red,
          }
          colors.terminal = {
            black = "#211a33",
            red = colors.red,
            green = colors.green,
            yellow = colors.yellow,
            blue = colors.blue,
            magenta = colors.magenta,
            cyan = colors.cyan,
            white = colors.fg_dark,
            black_bright = colors.terminal_black,
            red_bright = colors.red1,
            green_bright = colors.green1,
            yellow_bright = colors.orange,
            blue_bright = colors.blue5,
            magenta_bright = colors.purple,
            cyan_bright = colors.teal,
            white_bright = "#f0eaf9",
          }
        end,
        on_highlights = function(hl, colors)
          hl.TabLineFill = { bg = colors.none }
          hl.SnacksDashboardHeader = { fg = colors.fg }
        end,
      })

      vim.cmd.colorscheme("tokyonight")

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
