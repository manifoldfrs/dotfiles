return {
  "laytan/cloak.nvim",
  lazy = false,
  keys = {
    { "<leader>uC", "<cmd>CloakToggle<cr>", desc = "Toggle secret masking" },
  },
  opts = {
    patterns = {
      {
        file_pattern = { ".env", ".env.*", "*.env", "*.env.*", ".dev.vars", ".dev.vars.*", "*.vars" },
        cloak_pattern = "=.+",
      },
      {
        file_pattern = { "local.fish", "secrets.fish" },
        cloak_pattern = "^(%s*set%s+%-[%w]+%s+[%w_]+%s+).+",
        replace = "%1",
      },
      {
        file_pattern = "config.toml",
        cloak_pattern = "(token%s*=%s*).+",
        replace = "%1",
      },
    },
  },
}
