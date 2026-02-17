return {
        "folke/flash.nvim",
        event = "VeryLazy",
        ---@type Flash.Config
        opts = {},
        keys = {
                {
                        "<leader>jj",
                        function()
                                require("flash").jump()
                        end,
                        desc = "Jump to character",
                },
                {
                        "<leader>jw",
                        function()
                                require("flash").jump({
                                        search = { mode = "search", max_length = 0 },
                                        pattern = [[\<]],
                                })
                        end,
                        desc = "Jump to word",
                },
                {
                        "<leader>jl",
                        function()
                                require("flash").jump({
                                        search = { mode = "search", max_length = 0 },
                                        label = { after = { 0, 0 } },
                                        pattern = "^",
                                })
                        end,
                        desc = "Jump to line",
                },
        },
}
