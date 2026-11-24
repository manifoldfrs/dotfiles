"use strict";

const frame = document.querySelector("#artifact");
const filename = document.querySelector("#filename");
const annotate = document.querySelector("#annotate");
const general = document.querySelector("#general");
const finish = document.querySelector("#finish");
const form = document.querySelector("#composer");
const field = document.querySelector("#comment");
const anchorLabel = document.querySelector("#anchor");
const list = document.querySelector("#comments");
const count = document.querySelector("#count");
const status = document.querySelector("#status");
const instructions = document.querySelector("#instructions");
const draftKey = "artifact-review:" + location.pathname;
const maxComments = 100;
const preparedPages = new WeakSet();

let notes = [];
let editing = null;
let highlighted = null;
let submitting = false;

try {
  notes = JSON.parse(sessionStorage.getItem(draftKey) ?? "[]");
} catch {
  status.textContent = "This browser could not restore your previous draft.";
}

function saveDraft() {
  try {
    sessionStorage.setItem(draftKey, JSON.stringify(notes));
  } catch {
    status.textContent = "Draft storage is unavailable. Keep this tab open until you send feedback.";
  }
}

function selectorFor(element) {
  const parts = [];
  for (let current = element; current; current = current.parentElement) {
    const path = parts.join(" > ");
    const id = current.id && "#" + CSS.escape(current.id);
    if (id && current.ownerDocument.querySelectorAll(id).length === 1) {
      return [id, path].filter(Boolean).join(" > ");
    }
    const tag = CSS.escape(current.localName);
    let index = 1;
    for (let sibling = current.previousElementSibling; sibling; sibling = sibling.previousElementSibling) index++;
    parts.unshift(`${tag}:nth-child(${index})`);
  }
  return parts.join(" > ");
}

function anchorFor(selected, quote) {
  const element = selected.closest("[data-review-id]") ?? selected;
  const label = element.getAttribute("aria-label") ?? element.textContent;
  return {
    kind: quote ? "text" : "element",
    id: (element.getAttribute("data-review-id") ?? element.id).slice(0, 200),
    selector: selectorFor(element),
    quote: (quote || label.trim().replace(/\s+/g, " ")).slice(0, 2000),
    source: (selected.closest("[data-review-source]")?.getAttribute("data-review-source") ?? "").slice(0, 500),
  };
}

function description(anchor) {
  if (anchor.kind === "document") return "General note";
  return [anchor.source, anchor.quote || anchor.id || anchor.selector].filter(Boolean).join(" · ");
}

function showAnchor(anchor) {
  const page = frame.contentDocument;
  if (anchor.kind === "document" || !page) return;
  const target = page.querySelector(anchor.selector);
  if (!target) return;
  for (let parent = target.parentElement; parent; parent = parent.parentElement) {
    if (parent.localName === "details") parent.open = true;
  }
  highlighted?.removeAttribute("data-review-highlight");
  highlighted = target;
  highlighted.setAttribute("data-review-highlight", "");
  highlighted.scrollIntoView({ block: "center", inline: "nearest" });
}

function beginComment(anchor, index = notes.length) {
  if (editing || submitting) return;
  if (index === notes.length && notes.length >= maxComments) {
    status.textContent = "Send these 100 comments before starting another review.";
    return;
  }
  if (anchor.selector.length > 2000) {
    status.textContent = "This element is too deeply nested. Select a nearby section.";
    return;
  }
  editing = { anchor, index };
  anchorLabel.textContent = description(anchor);
  field.value = notes[index]?.comment ?? "";
  form.hidden = false;
  status.textContent = "";
  showAnchor(anchor);
  field.focus();
  renderNotes();
}

function endComment() {
  editing = null;
  form.hidden = true;
  frame.contentDocument?.getSelection()?.removeAllRanges();
  renderNotes();
}

function button(label, action) {
  const control = document.createElement("button");
  control.type = "button";
  control.textContent = label;
  control.addEventListener("click", action);
  return control;
}

function renderNotes() {
  count.textContent = String(notes.length);
  finish.textContent = notes.length ? "Send feedback" : "Close review";
  finish.disabled = Boolean(editing) || submitting;
  general.disabled = Boolean(editing) || submitting;
  annotate.disabled = submitting;
  list.replaceChildren();

  notes.forEach((note, index) => {
    const item = document.createElement("li");
    const label = document.createElement("span");
    label.textContent = description(note);
    if (note.kind !== "document") {
      const jump = button(label.textContent, () => showAnchor(note));
      jump.className = "anchor-button";
      item.append(jump);
    } else {
      item.append(label);
    }

    const text = document.createElement("p");
    text.textContent = note.comment;
    const edit = button("Edit", () => beginComment(note, index));
    const remove = button("Remove", () => {
      notes.splice(index, 1);
      saveDraft();
      renderNotes();
      (list.children[index]?.querySelector("button") ?? general).focus();
    });
    edit.disabled = remove.disabled = Boolean(editing) || submitting;
    item.append(text, edit, remove);
    list.append(item);
  });
}

function setAnnotationMode(active) {
  annotate.setAttribute("aria-pressed", String(active));
  frame.contentDocument?.documentElement.toggleAttribute("data-review-mode", active);
  instructions.textContent = active
    ? "Select text or click an element. To use the keyboard, focus an outlined section and press Enter."
    : "Turn on Annotate, then select text or click an element.";
}

function handleArtifact() {
  const page = frame.contentDocument;
  if (!page || page.URL !== frame.src || preparedPages.has(page)) return;
  preparedPages.add(page);

  const styles = page.createElement("style");
  styles.textContent = `
    [data-review-mode], [data-review-mode] * { cursor: crosshair !important; }
    [data-review-mode] [data-review-id]:focus-visible,
    [data-review-highlight] {
      outline: 3px solid #547bea !important;
      outline-offset: 3px !important;
    }
  `;
  page.head.append(styles);
  for (const element of page.querySelectorAll("[data-review-id]:not([tabindex])")) {
    if (element.tabIndex < 0) element.setAttribute("tabindex", "0");
  }
  setAnnotationMode(annotate.getAttribute("aria-pressed") === "true");

  function selectedText() {
    const selection = page.getSelection();
    const quote = selection?.toString().trim();
    if (!quote || !selection.rangeCount) return false;
    const node = selection.getRangeAt(0).commonAncestorContainer;
    const element = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
    beginComment(anchorFor(element, quote));
    return true;
  }

  page.addEventListener("pointerup", () => {
    if (annotate.getAttribute("aria-pressed") === "true" && !editing) selectedText();
  }, true);

  page.addEventListener("click", (event) => {
    const link = event.target.closest("a[href], a[*|href]");
    const href = link?.getAttribute("href") ?? link?.getAttributeNS("http://www.w3.org/1999/xlink", "href");
    if (link && (href?.startsWith("#") !== true || link.hasAttribute("target"))) event.preventDefault();
    if (annotate.getAttribute("aria-pressed") !== "true") return;

    event.preventDefault();
    if (!editing && !selectedText()) beginComment(anchorFor(event.target, ""));
  }, true);

  page.addEventListener("keydown", (event) => {
    if (annotate.getAttribute("aria-pressed") !== "true") return;
    if (event.key === "Escape") {
      setAnnotationMode(false);
      annotate.focus();
      return;
    }

    if (event.key === "Enter" && event.target.closest("[data-review-id]")) {
      event.preventDefault();
      beginComment(anchorFor(event.target, ""));
    }
  }, true);
}

annotate.addEventListener("click", () => setAnnotationMode(annotate.getAttribute("aria-pressed") !== "true"));
general.addEventListener("click", () => beginComment({ kind: "document", id: "", selector: "", quote: "", source: "" }));
document.querySelector("#cancel").addEventListener("click", () => {
  endComment();
  general.focus();
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const comment = field.value.trim();
  if (!comment) {
    status.textContent = "Enter a comment before saving.";
    field.focus();
    return;
  }
  const { anchor, index } = editing;
  notes[index] = { ...anchor, comment };
  saveDraft();
  endComment();
  list.children[index]?.querySelector("button")?.focus();
});

finish.addEventListener("click", async () => {
  submitting = true;
  renderNotes();
  status.textContent = "Finishing review…";

  try {
    const response = await fetch("finish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision: notes.length ? "annotated" : "dismissed", annotations: notes }),
    });
    if (!response.ok) throw new Error(await response.text());
  } catch (error) {
    submitting = false;
    renderNotes();
    status.textContent = "Could not finish the review. " + error.message;
    return;
  }

  try {
    sessionStorage.removeItem(draftKey);
  } catch {}

  status.textContent = notes.length ? "Feedback sent. You can close this tab." : "Review closed. You can close this tab.";
  finish.textContent = "Review complete";
  setAnnotationMode(false);
});

frame.addEventListener("load", handleArtifact);
if (frame.contentDocument?.readyState === "complete") handleArtifact();
renderNotes();
fetch("session")
  .then((response) => response.json())
  .then(({ name }) => {
    filename.textContent = name;
    document.title = `${name} | Artifact review`;
  })
  .catch(() => { status.textContent = "Could not load review details."; });
