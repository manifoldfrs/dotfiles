return {
        "NickvanDyke/opencode.nvim",
        event = "VeryLazy",
        dependencies = {
                "folke/snacks.nvim",
        },
        config = function()
                -- REQUIRED: Enable autoread for file reload feature
                vim.o.autoread = true

                local opencode_cmd = "opencode --port 40999"
                local tmux_state_file = vim.fn.stdpath("state") .. "/opencode_tmux_pane"

                local function in_tmux()
                        return vim.env.TMUX ~= nil and vim.env.TMUX ~= ""
                end

                local function read_tmux_pane()
                        if vim.fn.filereadable(tmux_state_file) == 0 then
                                return nil
                        end
                        local lines = vim.fn.readfile(tmux_state_file)
                        local pane = lines[1]
                        if pane and pane ~= "" then
                                return pane
                        end
                        return nil
                end

                local function write_tmux_pane(pane)
                        if pane and pane ~= "" then
                                vim.fn.writefile({ pane }, tmux_state_file)
                        end
                end

                local function clear_tmux_pane()
                        if vim.fn.filereadable(tmux_state_file) == 1 then
                                vim.fn.delete(tmux_state_file)
                        end
                end

                local function tmux_pane_exists(pane)
                        if not pane or pane == "" then
                                return false
                        end
                        vim.fn.system({ "tmux", "display-message", "-p", "-t", pane, "#{pane_id}" })
                        return vim.v.shell_error == 0
                end

                local function tmux_start()
                        local pane = read_tmux_pane()
                        if pane and tmux_pane_exists(pane) then
                                return
                        end

                        local new_pane = vim.fn.system({ "tmux", "split-window", "-h", "-P", "-F", "#{pane_id}",
                                opencode_cmd })
                        if vim.v.shell_error ~= 0 then
                                vim.notify("Failed to start opencode tmux split", vim.log.levels.ERROR,
                                        { title = "opencode" })
                                return
                        end

                        new_pane = vim.trim(new_pane)
                        write_tmux_pane(new_pane)
                        vim.fn.system({ "tmux", "last-pane" })
                end

                local function tmux_stop()
                        local pane = read_tmux_pane()
                        if pane and tmux_pane_exists(pane) then
                                vim.fn.system({ "tmux", "kill-pane", "-t", pane })
                        end
                        clear_tmux_pane()
                end

                local function tmux_toggle()
                        local pane = read_tmux_pane()
                        if pane and tmux_pane_exists(pane) then
                                tmux_stop()
                        else
                                tmux_start()
                        end
                end

                -- Configuration via global variable for faster startup
                vim.g.opencode_opts = {
                        server = {
                                port = 40999,
                                start = function()
                                        if in_tmux() then
                                                tmux_start()
                                        else
                                                require("opencode.terminal").start(opencode_cmd)
                                        end
                                end,
                                stop = function()
                                        if in_tmux() then
                                                tmux_stop()
                                        else
                                                require("opencode.terminal").stop()
                                        end
                                end,
                                toggle = function()
                                        if in_tmux() then
                                                tmux_toggle()
                                        else
                                                require("opencode.terminal").toggle(opencode_cmd)
                                        end
                                end,
                        },
                        -- Enable blink.cmp in ask() input
                        ask = {
                                blink_cmp_sources = { "opencode", "buffer" },
                        },
                }

                -- Keymaps with <leader>o prefix
                vim.keymap.set({ "n", "x" }, "<leader>oa", function()
                        require("opencode").ask("@this: ", { submit = true })
                end, { desc = "Ask opencode about this" })

                vim.keymap.set({ "n", "x" }, "<leader>os", function()
                        require("opencode").select()
                end, { desc = "Select opencode action" })

                vim.keymap.set({ "n", "t" }, "<leader>ot", function()
                        require("opencode").toggle()
                end, { desc = "Toggle opencode" })

                vim.keymap.set({ "n", "x" }, "<leader>oo", function()
                        return require("opencode").operator("@this ")
                end, { desc = "Add range to opencode", expr = true })

                vim.keymap.set("n", "<leader>og", function()
                        return require("opencode").operator("@this ") .. "_"
                end, { desc = "Add line to opencode", expr = true })
        end,
}
