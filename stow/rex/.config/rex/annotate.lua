-- Ports of the Herdr annotate plugin (prefix+a, prefix+shift+a, prefix+m).
-- Herdr opened these as popups; Rex opens them in a floating layer over the
-- current window.
local TERMINAL = "com.superlogical.terminal"
local SHELL = "com.superlogical.terminal.shell"
local ANNOTATE = os.getenv("HOME") .. "/.local/bin/rex-annotate"

local function foreground(ctx)
  local process, err = rex.block.call(TERMINAL, "process", { block_id = ctx.block_id })
  if process == nil then error(err, 0) end
  return process.foreground or {}
end

local function open_popup(command, cwd)
  local _, err = rex.session.new_layer({
    bounds = { 0.05, 0.075, 0.9, 0.85 },
    focus = true,
    layout = rex.layout.block({
      flavor = SHELL,
      options = { command = command, cwd = cwd },
    }),
  })
  if err ~= nil then error(err, 0) end
end

local function run_annotate(subcommand)
  local result, err = rex.exec({ ANNOTATE, subcommand }, { timeout = 20 })
  if result == nil then error(err, 0) end
  if not result.ok then error(result.stderr, 0) end
end

rex.action({
  name = "annotate_capture",
  title = "Annotate: Selected Text",
  description = "Comment on the given text, or on the copied terminal selection (copy on select puts it on the clipboard).",
  category = "Annotate",
  args = { text = "string?" },
  run = function(ctx, args)
    local text = args.text
    if text == nil then
      local clipboard, err = rex.exec({ "pbpaste" })
      if clipboard == nil then error(err, 0) end
      text = clipboard.stdout
    end
    if text:match("^%s*$") then error("Nothing to annotate: select or copy text first", 0) end

    local cwd = foreground(ctx).cwd
    local invocation = rex.json.encode({
      selected_text = text,
      focused_pane_cwd = cwd,
    })
    open_popup({ "env", "HERDR_PLUGIN_CONTEXT_JSON=" .. invocation, ANNOTATE, "editor" }, cwd)
  end,
})

rex.action({
  name = "annotate_copy_context",
  title = "Annotate: Copy Annotations as Context",
  category = "Annotate",
  run = function(ctx, args)
    run_annotate("copy-context")
  end,
})

rex.action({
  name = "annotate_copy_archive",
  title = "Annotate: Copy Annotations as Context and Archive",
  category = "Annotate",
  run = function(ctx, args)
    run_annotate("copy-archive")
  end,
})

rex.action({
  name = "annotate_manage",
  title = "Annotate: Manage Annotations",
  category = "Annotate",
  run = function(ctx, args)
    open_popup({ ANNOTATE, "manager" }, nil)
  end,
})

rex.bind("ctrl+a>a", "annotate_capture")
rex.bind("ctrl+a>shift+a", "annotate_copy_context")
rex.bind("ctrl+a>m", "annotate_manage")
