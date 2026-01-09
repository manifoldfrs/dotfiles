-- Leader key (must be set before lazy)
vim.g.mapleader = " "
vim.g.maplocalleader = " "

-- Disable providers for faster startup (unless you use Python/Ruby/Perl/Node plugins in nvim)
vim.g.loaded_python3_provider = 0  -- Saves ~1.2s on Python file load
vim.g.loaded_ruby_provider = 0
vim.g.loaded_perl_provider = 0
vim.g.loaded_node_provider = 0

-- UI
vim.opt.number = true
vim.opt.relativenumber = true
vim.opt.cursorline = true
vim.opt.signcolumn = "yes"
vim.opt.showmode = false
vim.opt.termguicolors = true
vim.opt.pumheight = 10
vim.opt.showtabline = 2

-- Editing
vim.opt.expandtab = true
vim.opt.smartindent = true

-- Language-specific indentation
vim.api.nvim_create_autocmd("FileType", {
  pattern = {"go", "python"},
  callback = function()
    vim.opt_local.shiftwidth = 4
    vim.opt_local.tabstop = 4
    vim.opt_local.softtabstop = 4
  end,
})

vim.api.nvim_create_autocmd("FileType", {
  pattern = {"javascript", "typescript"},
  callback = function()
    vim.opt_local.shiftwidth = 2
    vim.opt_local.tabstop = 2
    vim.opt_local.softtabstop = 2
  end,
})
vim.opt.wrap = false
vim.opt.scrolloff = 8
vim.opt.sidescrolloff = 8

-- Search
vim.opt.hlsearch = true
vim.opt.ignorecase = true
vim.opt.smartcase = true

-- Files
vim.opt.backup = false
vim.opt.swapfile = false
vim.opt.undofile = true

-- Splits
vim.opt.splitbelow = true
vim.opt.splitright = true

-- Performance
vim.opt.updatetime = 300
vim.opt.timeoutlen = 300

-- Clipboard
vim.opt.clipboard = "unnamedplus"

-- Mouse
vim.opt.mouse = "a"

-- Completion
vim.opt.completeopt = { "menuone", "noselect" }

-- Basic keymaps (not plugin-specific)
vim.keymap.set("n", ";", ":")
vim.keymap.set("i", "jk", "<ESC>")
vim.keymap.set("n", "<leader>h", ":nohlsearch<CR>")

-- Resize with arrows
vim.keymap.set("n", "<C-Up>", ":resize -2<CR>")
vim.keymap.set("n", "<C-Down>", ":resize +2<CR>")
vim.keymap.set("n", "<C-Left>", ":vertical resize -2<CR>")
vim.keymap.set("n", "<C-Right>", ":vertical resize +2<CR>")

-- Navigate buffers
vim.keymap.set("n", "<S-l>", ":bnext<CR>")
vim.keymap.set("n", "<S-h>", ":bprevious<CR>")

-- Stay in indent mode (visual)
vim.keymap.set("v", "<", "<gv")
vim.keymap.set("v", ">", ">gv")

-- Move text up/down
vim.keymap.set("n", "<A-j>", ":m .+1<CR>==")
vim.keymap.set("n", "<A-k>", ":m .-2<CR>==")
vim.keymap.set("v", "<A-j>", ":m '>+1<CR>gv=gv")
vim.keymap.set("v", "<A-k>", ":m '<-2<CR>gv=gv")

-- Paste without yanking replaced text
vim.keymap.set("v", "p", '"_dP')
