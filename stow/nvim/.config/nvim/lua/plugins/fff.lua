return {
  "dmtrKovalenko/fff",
  build = function()
    -- Downloads a prebuilt binary, or builds it with cargo when none matches.
    require("fff.download").download_or_build_binary()
  end,
  lazy = false, -- fff initializes itself lazily
  opts = {},
  keys = {
    { "<D-p>", function() require("fff").find_files() end, desc = "Find Files (fff)" },
    { "<D-S-f>", function() require("fff").live_grep() end, desc = "Search in Files (fff)" },
  },
}
