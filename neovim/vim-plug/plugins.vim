" auto-install vim-plug
if empty(glob('~/.config/nvim/autoload/plug.vim'))
  silent !curl -fLo ~/.config/nvim/autoload/plug.vim --create-dirs
    \ https://raw.githubusercontent.com/junegunn/vim-plug/master/plug.vim
  "autocmd VimEnter * PlugInstall
  "autocmd VimEnter * PlugInstall | source $MYVIMRC
endif

call plug#begin('~/.config/nvim/autoload/plugged')
    " Dracula theme
    Plug 'dracula/vim', { 'as': 'dracula' }
    " Intellisense
    Plug 'neoclide/coc.nvim', {'branch': 'release'}
    " NerdTree
    Plug 'scrooloose/nerdtree'
    " Tmux Navigator
    Plug 'christoomey/vim-tmux-navigator'
    " Better Syntax Support
    Plug 'sheerun/vim-polyglot'
    " Command Line Fuzzy Finder
    Plug 'junegunn/fzf', { 'do': { -> fzf#install() } }
    Plug 'junegunn/fzf.vim'
    " Auto pairs for '(' '[' '{'
    Plug 'jiangmiao/auto-pairs'
    " Rainbow Brackets
    Plug 'luochen1990/rainbow'
    let g:rainbow_active = 1 "set to 0 if you want to enable it later via :RainbowToggle
    Plug 'prettier/vim-prettier', { 'do': 'yarn install' }
    " Status line
    Plug 'vim-airline/vim-airline'
    Plug 'vim-airline/vim-airline-themes'
    " Git integration
    Plug 'tpope/vim-fugitive'
    Plug 'tpope/vim-rhubarb'
    " Codi
    Plug 'metakirby5/codi.vim'
call plug#end()

" Automatically install missing plugins on startup
autocmd VimEnter *
  \  if len(filter(values(g:plugs), '!isdirectory(v:val.dir)'))
  \|   PlugInstall --sync | q
  \| endif

