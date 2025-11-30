-- Neovim options

local opt = vim.opt

-- UI
opt.number = true
opt.relativenumber = false
opt.cursorline = true
opt.signcolumn = "yes"
opt.showmode = false
opt.cmdheight = 1
opt.pumheight = 10
opt.showtabline = 2
opt.termguicolors = true
opt.conceallevel = 0

-- Editing
opt.expandtab = true
opt.shiftwidth = 2
opt.tabstop = 2
opt.smartindent = true
opt.wrap = false
opt.scrolloff = 8
opt.sidescrolloff = 8

-- Search
opt.hlsearch = true
opt.ignorecase = true
opt.smartcase = true

-- Files
opt.backup = false
opt.swapfile = false
opt.undofile = true
opt.fileencoding = "utf-8"
opt.writebackup = false

-- Splits
opt.splitbelow = true
opt.splitright = true

-- Performance
opt.updatetime = 300
opt.timeoutlen = 300

-- Clipboard
opt.clipboard = "unnamedplus"

-- Mouse
opt.mouse = "a"

-- Completion
opt.completeopt = { "menuone", "noselect" }

-- Misc
opt.shortmess:append("c")
vim.cmd([[set iskeyword+=-]])
vim.cmd([[set formatoptions-=cro]])
