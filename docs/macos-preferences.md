# macOS preferences

Use this checklist after setting up a new Mac.
The table captures selected settings observed on the MacBook on November 27, 2026, running macOS 27.2.1.
It records current values, including some that may match a clean install.

## New Mac checklist

| Where | Restore these settings |
| --- | --- |
| System Settings → Appearance | Dark appearance. |
| System Settings → Desktop & Dock → Dock | Automatically hide the Dock. Turn off suggested and recent apps. Dock size was 52. |
| System Settings → Desktop & Dock → Desktop & Stage Manager | Hide desktop items and widgets. Set wallpaper clicks to show the desktop only in Stage Manager. Leave Stage Manager off. |
| System Settings → Desktop & Dock → Windows | Turn off tiling by dragging to the side or top of the screen and turn off tiled-window margins. |
| Finder | Set new windows to open the home folder under Settings → General. Under Settings → Advanced, show all filename extensions. Use View → as List and View → Show Path Bar. |
| System Settings → Keyboard → Text Input → Edit | Turn off automatic spelling correction, capitalization, and period insertion. Turn off inline predictions and smart quotes and dashes. |
| System Settings → Trackpad | Under Point & Click, turn off Force Click and haptic feedback. Under Scroll & Zoom, turn off natural scrolling, zoom in or out, smart zoom, and rotate. |
| System Settings → Privacy & Security → Apple Advertising | Turn off personalized ads. |
| System Settings → General → Software Update → Automatic Updates | Download and install macOS updates automatically. Keep automatic security responses and system files enabled. |
| App Store → Settings | Keep Automatic Updates enabled. |

See Apple's guides for [Desktop & Dock](https://support.apple.com/guide/mac-help/change-desktop-dock-settings-mchlp1119/mac), [Finder](https://support.apple.com/guide/mac-help/change-finder-settings-on-mac-mchlp2803/mac), [text input](https://support.apple.com/guide/mac-help/typing-suggestions-correct-mistakes-mac-mchlp2299/mac), [Software Update](https://support.apple.com/guide/mac-help/software-update-settings-on-mac-mchla7037245/mac), and [App Store settings](https://support.apple.com/guide/app-store/change-app-store-settings-mchlp2257/mac).

## Mac App Store utilities

Reinstall these from the Mac App Store when setting up a new Mac.

- **Magnet** snaps windows into layouts by dragging or using keyboard shortcuts. Launch it and grant access under System Settings → Privacy & Security → Accessibility. [Magnet on the Mac App Store](https://apps.apple.com/app/magnet/id441258766)
- **Caffeine Utility** by Yakov Manshin temporarily keeps the Mac awake from the menu bar. [Caffeine Utility on the Mac App Store](https://apps.apple.com/us/app/caffeine-utility/id1642185952)

## Stop Dock icons from bouncing for attention

This is the intended setting for background apps that request attention, including apps that use a Dock bounce to announce an update.
The preference was absent when the MacBook was checked, and the attention animation has yet to be tested on this macOS version.

```bash
defaults write com.apple.dock no-bouncing -bool true && killall Dock
defaults read com.apple.dock no-bouncing
```

The read should print `1`.
To return this preference to the system default, run `defaults delete com.apple.dock no-bouncing && killall Dock`.
The Dock's “Animate opening applications” setting controls the launch animation. [Apple Desktop & Dock settings](https://support.apple.com/guide/mac-help/change-desktop-dock-settings-mchlp1119/mac)

## Repeat keys when held down

The MacBook has `ApplePressAndHoldEnabled` set to false, which enables held-key repeat in apps that otherwise open the accent picker.
Reopen affected apps after setting it.

```bash
defaults write -g ApplePressAndHoldEnabled -bool false
defaults read -g ApplePressAndHoldEnabled
```

## Shell history

Fish history contained two writes to `com.apple.loginwindow DisableScreenLockImmediate` and a `pmset` reset.
The lock preference currently reads false.
Keep those commands out of the new Mac checklist until the desired lock and power behavior is confirmed.
System Settings changes can be recovered from live preferences even when shell history has no matching command.
