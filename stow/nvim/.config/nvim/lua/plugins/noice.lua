return {
        "folke/noice.nvim",
        event = "VeryLazy",
        dependencies = { "MunifTanjim/nui.nvim" },
        opts = {
                cmdline = {
                        enabled = true,
                        view = "cmdline_popup",
                },
                messages = {
                        enabled = true,
                        view = "mini",
                        view_error = "mini",
                        view_warn = "mini",
                        view_history = "messages",
                        view_search = "virtualtext",
                },
                popupmenu = {
                        enabled = true,
                        backend = "nui",
                },
                notify = {
                        enabled = false,
                },
                lsp = {
                        override = {
                                ["vim.lsp.util.convert_input_to_markdown_lines"] = true,
                                ["vim.lsp.util.stylize_markdown"] = true,
                        },
                        progress = {
                                enabled = true,
                                view = "mini",
                        },
                },
                presets = {
                        bottom_search = true,
                        command_palette = true,
                        long_message_to_split = true,
                        lsp_doc_border = true,
                },
        },
        keys = {
                { "<leader>nh", "<cmd>Noice history<CR>", desc = "Noice History" },
                { "<leader>nd", "<cmd>Noice dismiss<CR>", desc = "Dismiss Messages" },
                { "<leader>nl", "<cmd>Noice last<CR>",    desc = "Last Message" },
        },
}
