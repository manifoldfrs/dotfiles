set termguicolors

" auto-install vim-plug
if empty(glob('~/.config/nvim/autoload/plug.vim'))
  silent !curl -fLo ~/.config/nvim/autoload/plug.vim --create-dirs
    \ https://raw.githubusercontent.com/junegunn/vim-plug/master/plug.vim
  "autocmd VimEnter * PlugInstall
  "autocmd VimEnter * PlugInstall | source $MYVIMRC
endif

call plug#begin('~/.config/nvim/autoload/plugged')
    " Startify
    Plug 'mhinz/vim-startify'
    " Better Comments
    Plug 'tpope/vim-commentary'
    " Convert binary, hex, etc..
    Plug 'glts/vim-radical'
    " Repeat stuff
    Plug 'tpope/vim-repeat'
    " Text Navigation
    Plug 'unblevable/quick-scope'
    " Useful for React Commenting 
    Plug 'suy/vim-context-commentstring'
    " vim which key
    Plug 'liuchengxu/vim-which-key'
    " vim devicons
    Plug 'ryanoasis/vim-devicons'
    " NERD Commenter
    Plug 'preservim/nerdcommenter'
    " Dracula theme
    Plug 'dracula/vim', { 'as': 'dracula' }
    " Intellisense
    Plug 'neoclide/coc.nvim', {'branch': 'release'}
    " Coc plugin manager
    Plug 'neoclide/coc-tsserver', {'do': 'yarn install --frozen-lockfile'}
    " NerdTree
    Plug 'scrooloose/nerdtree'
    " Tmux Navigator
    Plug 'christoomey/vim-tmux-navigator'
    " Better Syntax Support
    Plug 'sheerun/vim-polyglot'
    " Command Line Fuzzy Finder
    Plug 'junegunn/fzf', { 'do': { -> fzf#install() } }
    Plug 'junegunn/fzf.vim'
    " Preview window on the upper side of the window with 40% height,
    " hidden by default, ctrl-/ to toggle
    let g:fzf_preview_window = ['up:50%', 'ctrl-/']
    " Auto pairs for '(' '[' '{'
    Plug 'rstacruz/vim-closer'
    " Rainbow Brackets
    Plug 'luochen1990/rainbow'
    let g:rainbow_active = 1 "set to 0 if you want to enable it later via :RainbowToggle
    " vim-prettier for all formats
    Plug 'prettier/vim-prettier', { 'do': 'yarn install --frozen-lockfile --production' }
    " Status line
    Plug 'vim-airline/vim-airline'
    Plug 'vim-airline/vim-airline-themes'
    " Git integration
    Plug 'tpope/vim-fugitive'
    Plug 'tpope/vim-rhubarb'
    " Codi
    Plug 'metakirby5/codi.vim'
    " Lightspeed
    Plug 'ggandor/lightspeed.nvim'
call plug#end()

" Automatically install missing plugins on startup
autocmd VimEnter *
  \  if len(filter(values(g:plugs), '!isdirectory(v:val.dir)'))
  \|   PlugInstall --sync | q
  \| endif

