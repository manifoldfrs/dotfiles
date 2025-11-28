-- Reload config with Cmd+Alt+Ctrl+R
hs.hotkey.bind({"cmd", "alt", "ctrl"}, "R", function()
  hs.reload()
end)
hs.alert.show("Hammerspoon config loaded")

-- 1. Tab + hjkl for vim-style arrow keys
local tabMode = hs.hotkey.modal.new()

-- Enter tab mode when Tab is pressed
tabWatcher = hs.eventtap.new({hs.eventtap.event.types.keyDown, hs.eventtap.event.types.keyUp}, function(e)
  local keyCode = e:getKeyCode()
  local tabKeyCode = 48  -- Tab key
  
  if keyCode == tabKeyCode then
    if e:getType() == hs.eventtap.event.types.keyDown then
      tabMode:enter()
    else
      tabMode:exit()
    end
    return true  -- Suppress the Tab key
  end
  return false
end)
tabWatcher:start()

-- Bind hjkl to arrow keys in tab mode
tabMode:bind({}, 'h', function() hs.eventtap.keyStroke({}, "left", 0) end, nil, function() hs.eventtap.keyStroke({}, "left", 0) end)
tabMode:bind({}, 'j', function() hs.eventtap.keyStroke({}, "down", 0) end, nil, function() hs.eventtap.keyStroke({}, "down", 0) end)
tabMode:bind({}, 'k', function() hs.eventtap.keyStroke({}, "up", 0) end, nil, function() hs.eventtap.keyStroke({}, "up", 0) end)
tabMode:bind({}, 'l', function() hs.eventtap.keyStroke({}, "right", 0) end, nil, function() hs.eventtap.keyStroke({}, "right", 0) end)

-- 2. Ctrl + Tab to toggle Caps Lock
-- Note: hs.hotkey.bind cannot capture Ctrl+Tab, so we use eventtap
ctrlTabWatcher = hs.eventtap.new({hs.eventtap.event.types.keyDown}, function(e)
  local keyCode = e:getKeyCode()
  local flags = e:getFlags()
  local tabKeyCode = 48  -- Tab key
  
  -- Check for Ctrl+Tab (but not when in tabMode for hjkl navigation)
  if keyCode == tabKeyCode and flags.ctrl and not flags.cmd and not flags.alt and not flags.shift then
    hs.hid.capslock.toggle()
    local state = hs.hid.capslock.get() and "ON" or "OFF"
    hs.alert.show("Caps Lock: " .. state)
    return true  -- Suppress the key event
  end
  return false
end)
ctrlTabWatcher:start()
