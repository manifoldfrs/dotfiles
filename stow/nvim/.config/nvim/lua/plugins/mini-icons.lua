return {
  "nvim-mini/mini.icons",
  lazy = true,
  opts = {
    default = {
      directory = { glyph = "\u{f0256}" },
    },
  },
  config = function(_, opts)
    local mini_icons = require("mini.icons")
    mini_icons.setup(opts)

    -- Solid nf-md-folder* glyph -> its *_outline variant, to match Cursor's outlined folders.
    local outline_glyphs = {
      ["\u{f024b}"] = "\u{f0256}", -- folder
      ["\u{f024c}"] = "\u{f0b9c}", -- folder_account
      ["\u{f024d}"] = "\u{f10e9}", -- folder_download
      ["\u{f0253}"] = "\u{f0255}", -- folder_multiple
      ["\u{f0257}"] = "\u{f0b9d}", -- folder_plus
      ["\u{f069d}"] = "\u{f0b9f}", -- folder_star
      ["\u{f0870}"] = "\u{f0c81}", -- folder_network
      ["\u{f08ac}"] = "\u{f10ec}", -- folder_key
      ["\u{f0aba}"] = "\u{f0abb}", -- folder_clock
      ["\u{f0c82}"] = "\u{f0c83}", -- folder_text
      ["\u{f0d09}"] = "\u{f0d0a}", -- folder_pound
      ["\u{f0d0b}"] = "\u{f0d0c}", -- folder_sync
      ["\u{f0dcc}"] = "\u{f0dcd}", -- folder_alert
      ["\u{f107d}"] = "\u{f107e}", -- folder_settings
      ["\u{f107f}"] = "\u{f1080}", -- folder_cog
      ["\u{f10b5}"] = "\u{f10b6}", -- folder_home
      ["\u{f10b7}"] = "\u{f10b8}", -- folder_information
      ["\u{f10ea}"] = "\u{f10eb}", -- folder_heart
      ["\u{f12e3}"] = "\u{f12e4}", -- folder_table
      ["\u{f1359}"] = "\u{f135a}", -- folder_music
      ["\u{f178a}"] = "\u{f178b}", -- folder_eye
      ["\u{f19f0}"] = "\u{f19f3}", -- folder_arrow_up
      ["\u{f19f4}"] = "\u{f19f5}", -- folder_cancel
      ["\u{f19f6}"] = "\u{f19f7}", -- folder_file
      ["\u{f19fa}"] = "\u{f19fb}", -- folder_play
      ["\u{f19fc}"] = "\u{f19fd}", -- folder_wrench
    }

    local directory = vim.deepcopy(opts.directory or {})
    for _, name in ipairs(mini_icons.list("directory")) do
      local glyph, hl = mini_icons.get("directory", name)
      local outline = outline_glyphs[glyph]
      if outline and not directory[name] then
        directory[name] = { glyph = outline, hl = hl }
      end
    end

    mini_icons.setup(vim.tbl_extend("force", opts, { directory = directory }))
  end,
  init = function()
    -- Catppuccin Macchiato, to match Cursor's catppuccin-macchiato icon theme.
    local icon_colors = {
      MiniIconsAzure = "#7dc4e4",
      MiniIconsBlue = "#8aadf4",
      MiniIconsCyan = "#8bd5ca",
      MiniIconsGreen = "#a6da95",
      MiniIconsGrey = "#cad3f5",
      MiniIconsOrange = "#f5a97f",
      MiniIconsPurple = "#c6a0f6",
      MiniIconsRed = "#ed8796",
      MiniIconsYellow = "#eed49f",
    }

    local function apply_icon_colors()
      for group, fg in pairs(icon_colors) do
        vim.api.nvim_set_hl(0, group, { fg = fg })
      end
    end

    apply_icon_colors()
    vim.api.nvim_create_autocmd("ColorScheme", {
      group = vim.api.nvim_create_augroup("mini_icons_catppuccin", { clear = true }),
      callback = apply_icon_colors,
    })

    -- Plugins that ask for nvim-web-devicons get mini.icons instead.
    package.preload["nvim-web-devicons"] = function()
      require("mini.icons").mock_nvim_web_devicons()
      return package.loaded["nvim-web-devicons"]
    end
  end,
}
