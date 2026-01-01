-- Debugging support with nvim-dap
-- Supports: Go, Python
-- TODO: Add JavaScript/TypeScript debugging (requires vscode-js-debug build)
--       See: https://github.com/mxsdev/nvim-dap-vscode-js
-- TODO: Add C++ debugging with codelldb when needed
--       See: https://github.com/mfussenegger/nvim-dap/wiki/C-C---Rust-(via--codelldb)

return {
  "mfussenegger/nvim-dap",
  dependencies = {
    -- UI
    "rcarriga/nvim-dap-ui",
    "nvim-neotest/nvim-nio",

    -- Virtual text (inline variable values)
    "theHamsta/nvim-dap-virtual-text",

    -- Mason integration for auto-installing adapters
    "williamboman/mason.nvim",
    "jay-babu/mason-nvim-dap.nvim",

    -- Language-specific
    "leoluz/nvim-dap-go",
    "mfussenegger/nvim-dap-python",
  },
  config = function()
    local dap = require("dap")
    local dapui = require("dapui")

    -- Mason-DAP setup (auto-install debug adapters)
    require("mason-nvim-dap").setup({
      ensure_installed = { "delve", "debugpy" },
      automatic_installation = true,
      handlers = {},
    })

    -- DAP UI setup
    dapui.setup({
      icons = { expanded = "▾", collapsed = "▸", current_frame = "●" },
      controls = {
        icons = {
          pause = "⏸",
          play = "▶",
          step_into = "⏎",
          step_over = "⏭",
          step_out = "⏮",
          step_back = "◁",
          run_last = "▶▶",
          terminate = "⏹",
          disconnect = "⏏",
        },
      },
    })

    -- Virtual text setup
    require("nvim-dap-virtual-text").setup({
      commented = true,
    })

    -- Breakpoint signs (simple style)
    vim.fn.sign_define("DapBreakpoint", { text = "●", texthl = "DiagnosticError", linehl = "", numhl = "" })
    vim.fn.sign_define("DapBreakpointCondition", { text = "●", texthl = "DiagnosticWarn", linehl = "", numhl = "" })
    vim.fn.sign_define("DapLogPoint", { text = "◆", texthl = "DiagnosticInfo", linehl = "", numhl = "" })
    vim.fn.sign_define("DapStopped", { text = "→", texthl = "DiagnosticOk", linehl = "DapStoppedLine", numhl = "" })
    vim.fn.sign_define("DapBreakpointRejected", { text = "●", texthl = "DiagnosticHint", linehl = "", numhl = "" })

    -- Highlight for stopped line
    vim.api.nvim_set_hl(0, "DapStoppedLine", { bg = "#3b4261" })

    -- Auto open/close UI
    dap.listeners.after.event_initialized["dapui_config"] = function()
      dapui.open()
    end
    dap.listeners.before.event_terminated["dapui_config"] = function()
      dapui.close()
    end
    dap.listeners.before.event_exited["dapui_config"] = function()
      dapui.close()
    end

    -- Go setup
    require("dap-go").setup()

    -- Python setup (uses debugpy from Mason)
    -- Use direct path to avoid issues when package isn't installed yet
    local debugpy_path = vim.fn.stdpath("data") .. "/mason/packages/debugpy/venv/bin/python"
    require("dap-python").setup(debugpy_path)
    require("dap-python").test_runner = "pytest"

    -- Keymaps
    vim.keymap.set("n", "<leader>dc", dap.continue, { desc = "Continue / Start" })
    vim.keymap.set("n", "<leader>db", dap.toggle_breakpoint, { desc = "Toggle Breakpoint" })
    vim.keymap.set("n", "<leader>dB", function()
      dap.set_breakpoint(vim.fn.input("Breakpoint condition: "))
    end, { desc = "Conditional Breakpoint" })
    vim.keymap.set("n", "<leader>di", dap.step_into, { desc = "Step Into" })
    vim.keymap.set("n", "<leader>do", dap.step_over, { desc = "Step Over" })
    vim.keymap.set("n", "<leader>dO", dap.step_out, { desc = "Step Out" })
    vim.keymap.set("n", "<leader>dr", dap.repl.toggle, { desc = "Toggle REPL" })
    vim.keymap.set("n", "<leader>dl", dap.run_last, { desc = "Run Last" })
    vim.keymap.set("n", "<leader>du", dapui.toggle, { desc = "Toggle UI" })
    vim.keymap.set("n", "<leader>dx", dap.terminate, { desc = "Terminate" })
    vim.keymap.set({ "n", "v" }, "<leader>de", dapui.eval, { desc = "Eval Expression" })
  end,
}
