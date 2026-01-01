-- Leader key (must be set before lazy)
vim.g.mapleader = " "
vim.g.maplocalleader = " "

-- UI
vim.opt.number = true
vim.opt.relativenumber = false
vim.opt.cursorline = true
vim.opt.signcolumn = "yes"
vim.opt.showmode = false
vim.opt.termguicolors = true
vim.opt.pumheight = 10
vim.opt.showtabline = 2

-- Editing
vim.opt.expandtab = true
vim.opt.shiftwidth = 2
vim.opt.tabstop = 2
vim.opt.softtabstop = 2
vim.opt.smartindent = true
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
