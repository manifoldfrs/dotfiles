import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

const adapterModeCommand = "pistack-mode";
const potetoSkill = "skill:pistack-poteto-mode";

export default function pistackSticky(pi: ExtensionAPI): void {
  function hasAdapterModeCommand(): boolean {
    return pi.getCommands().some(({ name, source }) => name === adapterModeCommand && source === "extension");
  }

  function sendStickyMode(args: string): void {
    pi.sendUserMessage(`/${adapterModeCommand} ${args}`, { expandPromptTemplates: true });
  }

  pi.registerCommand("pistack-sticky", {
    description: "Turn sticky Poteto Mode on or off for this session, or check its status",
    getArgumentCompletions: (prefix) => ["on", "off", "status"]
      .flatMap((value) => value.startsWith(prefix) ? [{ value, label: value }] : []),
    handler: async (args, ctx) => {
      if (!hasAdapterModeCommand()) {
        ctx.ui.notify("Sticky Poteto Mode is unavailable: the pstack adapter command is not loaded.", "warning");

        return;
      }

      sendStickyMode(args);
    },
  });

  pi.on("input", (event) => {
    const [command] = event.text.split(" ", 1);

    if (event.source === "extension" || command !== `/${potetoSkill}`) return;

    const hasPotetoSkill = pi.getCommands().some(({ name, source }) => name === potetoSkill && source === "skill");

    if (!hasPotetoSkill || !hasAdapterModeCommand()) return;

    sendStickyMode("on");
  });
}
