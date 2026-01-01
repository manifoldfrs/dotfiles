return {
  "vim-test/vim-test",
  dependencies = { "preservim/vimux" },
  config = function()
    vim.g["test#strategy"] = "vimux"
    vim.g["test#python#runner"] = "pytest"
    vim.g["test#javascript#runner"] = "jest"
    vim.g["test#typescript#runner"] = "jest"

    vim.keymap.set("n", "<leader>tt", ":TestNearest<CR>", { desc = "Test nearest" })
    vim.keymap.set("n", "<leader>tf", ":TestFile<CR>", { desc = "Test file" })
    vim.keymap.set("n", "<leader>ts", ":TestSuite<CR>", { desc = "Test suite" })
    vim.keymap.set("n", "<leader>tl", ":TestLast<CR>", { desc = "Test last" })
    vim.keymap.set("n", "<leader>tv", ":TestVisit<CR>", { desc = "Test visit" })
  end,
}
