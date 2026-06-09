return {
        {
                "lewis6991/gitsigns.nvim",
                event = { "BufReadPre", "BufNewFile" },
                config = function()
                        require("gitsigns").setup({
                                signs = {
                                        add = { text = "│" },
                                        change = { text = "│" },
                                        delete = { text = "_" },
                                        topdelete = { text = "‾" },
                                        changedelete = { text = "~" },
                                },
                                on_attach = function(bufnr)
                                        local gs = package.loaded.gitsigns
                                        local opts = { buffer = bufnr }

                                        vim.keymap.set("n", "<leader>gp", gs.preview_hunk,
                                                vim.tbl_extend("force", opts, { desc = "Preview hunk" }))
                                        vim.keymap.set("n", "<leader>gt", function()
                                                for _, win in ipairs(vim.api.nvim_list_wins()) do
                                                        local buf = vim.api.nvim_win_get_buf(win)
                                                        if vim.bo[buf].filetype == "fugitiveblame" then
                                                                vim.api.nvim_win_close(win, false)
                                                                return
                                                        end
                                                end
                                                vim.cmd("Git blame")
                                        end, vim.tbl_extend("force", opts, { desc = "Toggle Git blame" }))
                                        vim.keymap.set("n", "]h", gs.next_hunk,
                                                vim.tbl_extend("force", opts, { desc = "Next hunk" }))
                                        vim.keymap.set("n", "[h", gs.prev_hunk,
                                                vim.tbl_extend("force", opts, { desc = "Prev hunk" }))
                                end,
                        })
                end,
        },
        {
                "tpope/vim-fugitive",
        },
        {
                "akinsho/git-conflict.nvim",
                version = "*",
                config = true
        }
}
