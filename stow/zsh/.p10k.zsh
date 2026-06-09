# Powerlevel10k config — Pure style.
# Adapted from cb-zsh default-theme. Run `p10k configure` to regenerate.

# Temporarily change options.
'builtin' 'local' '-a' 'p10k_config_opts'
[[ ! -o 'aliases'         ]] || p10k_config_opts+=('aliases')
[[ ! -o 'sh_glob'         ]] || p10k_config_opts+=('sh_glob')
[[ ! -o 'no_brace_expand' ]] || p10k_config_opts+=('no_brace_expand')
'builtin' 'setopt' 'no_aliases' 'no_sh_glob' 'brace_expand'

() {
  emulate -L zsh -o extended_glob

  unset -m '(POWERLEVEL9K_*|DEFAULT_USER)~POWERLEVEL9K_GITSTATUS_DIR'

  autoload -Uz is-at-least && is-at-least 5.1 || return

  local grey=242
  local red=1
  local yellow=3
  local blue=4
  local magenta=5
  local cyan=6
  local white=7

  typeset -g POWERLEVEL9K_LEFT_PROMPT_ELEMENTS=(
    context
    dir
    vcs
    command_execution_time
    newline
    virtualenv
    background_jobs
    prompt_char
  )

  typeset -g POWERLEVEL9K_RIGHT_PROMPT_ELEMENTS=(
    newline
  )

  typeset -g POWERLEVEL9K_BACKGROUND=
  typeset -g POWERLEVEL9K_{LEFT,RIGHT}_{LEFT,RIGHT}_WHITESPACE=
  typeset -g POWERLEVEL9K_{LEFT,RIGHT}_SUBSEGMENT_SEPARATOR=' '
  typeset -g POWERLEVEL9K_{LEFT,RIGHT}_SEGMENT_SEPARATOR=
  typeset -g POWERLEVEL9K_VISUAL_IDENTIFIER_EXPANSION=

  typeset -g POWERLEVEL9K_PROMPT_ADD_NEWLINE=true

  typeset -g POWERLEVEL9K_PROMPT_CHAR_OK_{VIINS,VICMD,VIVIS}_FOREGROUND=$blue
  typeset -g POWERLEVEL9K_PROMPT_CHAR_ERROR_{VIINS,VICMD,VIVIS}_FOREGROUND=$red
  typeset -g POWERLEVEL9K_PROMPT_CHAR_{OK,ERROR}_VIINS_CONTENT_EXPANSION='❯'
  typeset -g POWERLEVEL9K_PROMPT_CHAR_{OK,ERROR}_VICMD_CONTENT_EXPANSION='❮'
  typeset -g POWERLEVEL9K_PROMPT_CHAR_{OK,ERROR}_VIVIS_CONTENT_EXPANSION='❮'
  typeset -g POWERLEVEL9K_PROMPT_CHAR_OVERWRITE_STATE=false

  typeset -g POWERLEVEL9K_VIRTUALENV_FOREGROUND=$grey
  typeset -g POWERLEVEL9K_VIRTUALENV_SHOW_PYTHON_VERSION=false
  typeset -g POWERLEVEL9K_VIRTUALENV_{LEFT,RIGHT}_DELIMITER=

  typeset -g POWERLEVEL9K_DIR_FOREGROUND=$yellow

  typeset -g POWERLEVEL9K_CONTEXT_ROOT_TEMPLATE="%F{$white}%n%f%F{$grey}@%m%f"
  typeset -g POWERLEVEL9K_CONTEXT_TEMPLATE="%F{$grey}%n@%m%f"
  typeset -g POWERLEVEL9K_CONTEXT_{DEFAULT,SUDO}_CONTENT_EXPANSION=

  typeset -g POWERLEVEL9K_COMMAND_EXECUTION_TIME_THRESHOLD=5
  typeset -g POWERLEVEL9K_COMMAND_EXECUTION_TIME_PRECISION=0
  typeset -g POWERLEVEL9K_COMMAND_EXECUTION_TIME_FORMAT='d h m s'
  typeset -g POWERLEVEL9K_COMMAND_EXECUTION_TIME_FOREGROUND=$cyan

  typeset -g POWERLEVEL9K_VCS_BRANCH_ICON=
  typeset -g POWERLEVEL9K_VCS_UNTRACKED_ICON='?'

  function my_git_formatter() {
    emulate -L zsh
    typeset -g  GITSTATUS_PROMPT=''
    typeset -gi GITSTATUS_PROMPT_LEN=0

    local       name=$BLUE
    local      clean=$MAGENTA
    local   modified=$GREEN
    local  untracked=$GREEN
    local conflicted=$RED
    local        num=${PROMPT_DISPLAY_STATS_NUM:-0}
    local     prefix
    if [ $PROMPT_PREFIX ]; then
      prefix=$PROMPT_PREFIX
    fi

    local p="$prefix"

    local where
    if [[ -n $VCS_STATUS_LOCAL_BRANCH ]]; then
      where=$VCS_STATUS_LOCAL_BRANCH
    elif [[ -n $VCS_STATUS_TAG ]]; then
      p+="%f${PROMPT_TAG_PREFIX}"
      where=$VCS_STATUS_TAG
    else
      p+="%f${PROMPT_COMMIT_PREFIX}"
      where=${VCS_STATUS_COMMIT[1,8]}
    fi

    local git_truncate_length=50
    if [ $CB_ZSH_GIT_TRUNCATE_LENGTH ]; then
      git_truncate_length=$CB_ZSH_GIT_TRUNCATE_LENGTH
    fi
    (( $#where > $git_truncate_length )) && where[13,-13]="…"
    p+="${name}$PROMPT_WHERE_COLOR${where//\%/%%}"

    local COMMITS_BEHIND=$VCS_STATUS_COMMITS_BEHIND
    local COMMITS_AHEAD=$VCS_STATUS_COMMITS_AHEAD
    local PUSH_COMMITS_BEHIND=$VCS_STATUS_PUSH_COMMITS_BEHIND
    local PUSH_COMMITS_AHEAD=$VCS_STATUS_PUSH_COMMITS_AHEAD
    local STASHES=$VCS_STATUS_STASHES
    local NUM_CONFLICTED=$VCS_STATUS_NUM_CONFLICTED
    local NUM_STAGED=$VCS_STATUS_NUM_STAGED
    local NUM_UNSTAGED=$VCS_STATUS_NUM_UNSTAGED
    local NUM_UNTRACKED=$VCS_STATUS_NUM_UNTRACKED
    local SPACE=' '
    if [ "$num" = "0" ]; then
      COMMITS_BEHIND=''
      COMMITS_AHEAD=''
      PUSH_COMMITS_BEHIND=''
      PUSH_COMMITS_AHEAD=''
      STASHES=''
      NUM_CONFLICTED=''
      NUM_STAGED=''
      NUM_UNSTAGED=''
      NUM_UNTRACKED=''
      SPACE=''
    fi

    local SPACE_MOD=$(( VCS_STATUS_NUM_CONFLICTED || VCS_STATUS_NUM_STAGED || VCS_STATUS_NUM_UNSTAGED || VCS_STATUS_NUM_UNTRACKED ))
    local IS_CHANGE=$SPACE_MOD

    local DISPLAY_STATS_REMOTE=${PROMPT_DISPLAY_STATS_REMOTE:=1}
    local DISPLAY_STATS_STASH=${PROMPT_DISPLAY_STATS_STASH:=1}
    local DISPLAY_STATS_ACTION=${PROMPT_DISPLAY_STATS_ACTION:=1}
    local UNI_CHANGE_MODE=${PROMPT_UNI_CHANGE_MODE:=0}

    if [ $DISPLAY_STATS_REMOTE = 1 ]; then
      (( VCS_STATUS_COMMITS_BEHIND )) && p+=" ${clean}⇣${COMMITS_BEHIND}"
      (( VCS_STATUS_COMMITS_AHEAD && !VCS_STATUS_COMMITS_BEHIND )) && p+=" "
      (( VCS_STATUS_COMMITS_AHEAD  )) && p+="${clean}⇡${COMMITS_AHEAD}"
      (( VCS_STATUS_PUSH_COMMITS_BEHIND )) && p+=" ${clean}⇠${PUSH_COMMITS_BEHIND}"
      (( VCS_STATUS_PUSH_COMMITS_AHEAD && !VCS_STATUS_PUSH_COMMITS_BEHIND )) && p+=" "
      (( VCS_STATUS_PUSH_COMMITS_AHEAD  )) && p+="${clean}⇢${PUSH_COMMITS_AHEAD}"
    fi

    if [ $DISPLAY_STATS_STASH = 1 ]; then
      (( VCS_STATUS_STASHES )) && p+=" ${clean}*${STASHES}"
    fi

    if [ $DISPLAY_STATS_ACTION = 1 ]; then
      [[ -n $VCS_STATUS_ACTION ]] && p+=" ${conflicted}${VCS_STATUS_ACTION}"
    fi

    if [ $UNI_CHANGE_MODE = 1 ] && [ $IS_CHANGE = 1 ]; then
      UNI_CHAR=${PROMPT_UNI_MODE_CHAR:-"*"}
      [ ! $PROMPT_UNI_MODE_EMPTY = 1 ] && p+="$UNI_CHAR"
    else
      (( SPACE_MOD && !num         )) && p+=" "
      (( VCS_STATUS_NUM_CONFLICTED )) && p+="${SPACE}${conflicted}${PROMPT_ICON_CONFLICTED:=~}${NUM_CONFLICTED}"
      (( VCS_STATUS_NUM_STAGED     )) && p+="${SPACE}${modified}${PROMPT_ICON_STAGED:=+}${NUM_STAGED}"
      (( VCS_STATUS_NUM_UNSTAGED   )) && p+="${SPACE}${modified}${PROMPT_ICON_UNSTAGED:=!}${NUM_UNSTAGED}"
      (( VCS_STATUS_NUM_UNTRACKED  )) && p+="${SPACE}${untracked}${PROMPT_ICON_UNTRACKED:=?}${NUM_UNTRACKED}"
    fi

    GITSTATUS_PROMPT="${p}%f${PROMPT_POSTFIX}"
    GITSTATUS_PROMPT_LEN="${(m)#${${GITSTATUS_PROMPT//\%\%/x}//\%(f|<->F)}}"
    typeset -g my_git_format=$GITSTATUS_PROMPT
  }
  functions -M my_git_formatter 2>/dev/null

  typeset -g POWERLEVEL9K_VCS_MAX_INDEX_SIZE_DIRTY=-1
  typeset -g POWERLEVEL9K_VCS_DISABLED_WORKDIR_PATTERN='~'
  typeset -g POWERLEVEL9K_VCS_DISABLE_GITSTATUS_FORMATTING=true
  typeset -g POWERLEVEL9K_VCS_CONTENT_EXPANSION='${$((my_git_formatter()))+${my_git_format}}'
  typeset -g POWERLEVEL9K_VCS_{STASHES,STAGED,UNSTAGED,UNTRACKED,CONFLICTED,COMMITS_AHEAD,COMMITS_BEHIND}_MAX_NUM=1
  typeset -g POWERLEVEL9K_VCS_PREFIX='%fon '
  typeset -g POWERLEVEL9K_VCS_BACKENDS=(git)

  typeset -g POWERLEVEL9K_TIME_FOREGROUND=$grey
  typeset -g POWERLEVEL9K_TIME_FORMAT='%D{%H:%M:%S}'
  typeset -g POWERLEVEL9K_TIME_UPDATE_ON_COMMAND=false

  typeset -g POWERLEVEL9K_TRANSIENT_PROMPT=off
  typeset -g POWERLEVEL9K_INSTANT_PROMPT=verbose
  typeset -g POWERLEVEL9K_DISABLE_HOT_RELOAD=true

  (( ! $+functions[p10k] )) || p10k reload
}

typeset -g POWERLEVEL9K_CONFIG_FILE=${${(%):-%x}:a}

(( ${#p10k_config_opts} )) && setopt ${p10k_config_opts[@]}
'builtin' 'unset' 'p10k_config_opts'
