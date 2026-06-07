return {
  "mfussenegger/nvim-lint",
  event = { "BufReadPost" },  -- Load after buffer is read (slightly delayed for performance)
  config = function()
    local lint = require("lint")
    
    lint.linters_by_ft = {
      python = { "ruff" },
      go = { "golangcilint" },
    }
    
    -- Lint on save only (async, non-blocking)
    -- Removed BufEnter to improve file loading performance
    vim.api.nvim_create_autocmd({ "BufWritePost" }, {
      callback = function()
        require("lint").try_lint()
      end,
    })
    
    -- Optional: Uncomment to also lint on buffer enter (adds ~100ms to file loading)
    -- vim.api.nvim_create_autocmd({ "BufEnter" }, {
    --   callback = function()
    --     require("lint").try_lint()
    --   end,
    -- })
  end,
}
