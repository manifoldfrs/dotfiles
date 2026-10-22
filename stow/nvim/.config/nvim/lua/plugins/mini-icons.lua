return {
  "nvim-mini/mini.icons",
  lazy = true,
  opts = {},
  init = function()
    -- Plugins that ask for nvim-web-devicons get mini.icons instead.
    package.preload["nvim-web-devicons"] = function()
      require("mini.icons").mock_nvim_web_devicons()
      return package.loaded["nvim-web-devicons"]
    end
  end,
}
