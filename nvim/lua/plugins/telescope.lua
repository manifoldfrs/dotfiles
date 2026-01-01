return {
  "nvim-telescope/telescope.nvim",
  branch = "0.1.x",
  dependencies = {
    "nvim-lua/plenary.nvim",
    { "nvim-telescope/telescope-fzf-native.nvim", build = "make" },
  },
  config = function()
    local telescope = require("telescope")
    telescope.setup({
      defaults = {
        prompt_prefix = " ",
        selection_caret = " ",
        path_display = { "smart" },
        file_ignore_patterns = { "node_modules", ".git/" },
      },
      pickers = {
        find_files = { hidden = true },
      },
    })
    telescope.load_extension("fzf")

    local builtin = require("telescope.builtin")
    vim.keymap.set("n", "<C-p>", builtin.find_files, {})
    vim.keymap.set("n", "<leader>ff", builtin.find_files, { desc = "Find files" })
    vim.keymap.set("n", "<leader>fg", builtin.live_grep, { desc = "Live grep" })
    vim.keymap.set("n", "<leader>fb", builtin.buffers, { desc = "Buffers" })
    vim.keymap.set("n", "<leader>fh", builtin.help_tags, { desc = "Help tags" })
    vim.keymap.set("n", "<leader>fr", builtin.oldfiles, { desc = "Recent files" })
    vim.keymap.set("n", "<leader>fc", builtin.colorscheme, { desc = "Colorschemes" })
    vim.keymap.set("n", "<leader>fk", builtin.keymaps, { desc = "Keymaps" })
    vim.keymap.set("n", "<leader><leader>", builtin.oldfiles, { desc = "Recent files" })
  end,
}
