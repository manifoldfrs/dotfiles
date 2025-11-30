-- Neovim configuration
-- Bootstrap lazy.nvim and load modules

-- Set leader key before lazy
vim.g.mapleader = " "
vim.g.maplocalleader = " "

-- Load core modules
require("user.options")
require("user.keymaps")
require("user.lazy")
