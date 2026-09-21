import assert from "node:assert/strict"
import test from "node:test"
import { countUnstagedFiles, skillLoadedMessage } from "./tui.tsx"

test("countUnstagedFiles counts worktree changes and untracked files", () => {
  assert.equal(countUnstagedFiles(" M changed.rb\n?? new.rb\nM  staged.rb"), 2)
  assert.equal(countUnstagedFiles(""), 0)
})

test("skillLoadedMessage identifies the activated slash skill", () => {
  assert.equal(skillLoadedMessage("bro"), "Loaded skill: /bro")
})
