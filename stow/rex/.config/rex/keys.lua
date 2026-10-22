-- Herdr's ctrl+a prefix as key sequences. Keys are written unshifted, so `%` is
-- shift+5 and `"` is shift+'.
local prefix = "ctrl+a>"

local function bind(key, action, args)
  rex.bind(prefix .. key, action, args)
end

bind("ctrl+a", "pane.send_key", { key = "ctrl+a" })

bind("s", "session.switch")
bind("w", "session.switch")
bind("shift+n", "session.new")
bind("shift+4", "session.rename")
bind("shift+9", "session.previous")
bind("shift+0", "session.next")
-- Herdr's prefix+d closed a workspace after a confirmation. Rex has no
-- confirmation and closing destroys the session, so it stays unbound.

bind("c", "client.tab.new")
bind("n", "client.tab.next")
bind("p", "client.tab.previous")
for index = 1, 9 do
  bind(tostring(index), "client.tab.goto", { index = index })
end
bind(",", "client.tab.rename")
bind("shift+7", "client.tab.close")

bind("shift+5", "pane.split", { direction = "right" })
bind("shift+'", "pane.split", { direction = "down" })
bind("h", "pane.focus.left")
bind("j", "pane.focus.down")
bind("k", "pane.focus.up")
bind("l", "pane.focus.right")
bind("z", "pane.zoom")

bind("b", "client.sidebar.toggle")
bind("r", "client.config.reload")
bind("shift+/", "client.palette.toggle")

rex.mode("resize", { exclusive = true })
bind("shift+r", "client.mode.enter", { name = "resize" })

local resize_keys = {
  { "h", "left" },
  { "j", "down" },
  { "k", "up" },
  { "l", "right" },
  { "left", "left" },
  { "down", "down" },
  { "up", "up" },
  { "right", "right" },
}
for _, pair in ipairs(resize_keys) do
  local key, direction = pair[1], pair[2]
  rex.bind("resize/" .. key, "pane.resize", { direction = direction })
  rex.bind("resize/shift+" .. key, "pane.resize", { direction = direction, amount = 15 })
end
rex.bind("resize/=", "pane.balance")
rex.bind("resize/enter", "client.mode.exit")
