return {
        {
                "folke/tokyonight.nvim",
                lazy = false,
                priority = 1000,
                config = function()
                        require("tokyonight").setup({
                                style = "night",
                        })
                        vim.cmd.colorscheme("tokyonight")

                        local diagnostic_underline_colors = {
                                Error = "DiagnosticError",
                                Warn = "DiagnosticWarn",
                                Info = "DiagnosticInfo",
                                Hint = "DiagnosticHint",
                        }

                        for severity, base_group in pairs(diagnostic_underline_colors) do
                                local base_hl = vim.api.nvim_get_hl(0, { name = base_group })
                                vim.api.nvim_set_hl(0, "DiagnosticUnderline" .. severity, {
                                        underline = true,
                                        undercurl = false,
                                        sp = base_hl.fg,
                                })
                        end

                        local spell_underline_groups = {
                                "SpellBad",
                                "SpellCap",
                                "SpellRare",
                                "SpellLocal",
                        }

                        for _, group in ipairs(spell_underline_groups) do
                                local base_hl = vim.api.nvim_get_hl(0, { name = group })
                                vim.api.nvim_set_hl(0, group, {
                                        underline = true,
                                        undercurl = false,
                                        sp = base_hl.sp,
                                })
                        end
                end,
        },
}
