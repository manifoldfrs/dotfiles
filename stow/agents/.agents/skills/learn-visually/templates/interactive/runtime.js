// Lesson runtime: a stepper with prediction gates, and a reduced-motion flag.
// Inlined into the lesson by scripts/inline.ts; no dependencies.

export const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches

const $ = (root, selector) => root.querySelector(selector)

// A stepper over `count` steps (0 = before the first step).
// root must contain buttons [data-act=back|step|play|reset], an optional
// input[data-act=speed], output[data-role=position], and a [data-role=predict] panel.
// predictions: { [stepIndex]: { question, choices: [label], answer: index, explain } }
// A prediction gates the step it belongs to: the step's result shows only after an answer.
export function createStepper(root, { count, render, predictions = {}, intervalMs = 900 }) {
  let position = 0
  let timer = null
  let openGate = null
  const answered = new Map()
  const buttons = Object.fromEntries([...root.querySelectorAll("[data-act]")].map((el) => [el.dataset.act, el]))
  const positionOut = $(root, "[data-role=position]")
  const panel = $(root, "[data-role=predict]")
  const live = $(root, "[data-role=live]")

  const pending = () => predictions[position + 1] && !answered.has(position + 1)

  function update(announce) {
    render(position, { answered })
    if (positionOut) positionOut.textContent = `step ${position} of ${count}`
    buttons.back && (buttons.back.disabled = position === 0)
    buttons.step && (buttons.step.disabled = position === count)
    if (buttons.play) {
      buttons.play.disabled = position === count
      buttons.play.textContent = timer ? "Pause" : "Play"
      buttons.play.setAttribute("aria-pressed", String(Boolean(timer)))
    }
    if (announce && live) live.textContent = announce
  }

  function ask(index) {
    const p = predictions[index]
    stop()
    openGate = index
    panel.hidden = false
    panel.innerHTML = ""
    const heading = document.createElement("p")
    heading.className = "predict-q"
    heading.textContent = `Predict: ${p.question}`
    const group = document.createElement("div")
    group.className = "choices"
    group.setAttribute("role", "group")
    group.setAttribute("aria-label", "Your prediction")
    p.choices.forEach((label, choice) => {
      const button = document.createElement("button")
      button.type = "button"
      button.textContent = label
      button.dataset.choice = String(choice)
      button.addEventListener("click", () => reveal(index, choice))
      group.append(button)
    })
    panel.append(heading, group)
    group.querySelector("button").focus({ preventScroll: true })
    if (live) live.textContent = `Prediction needed: ${p.question}`
  }

  function reveal(index, choice) {
    if (openGate !== index) return
    openGate = null
    const p = predictions[index]
    answered.set(index, choice)
    const right = choice === p.answer
    panel.innerHTML = ""
    const verdict = document.createElement("p")
    verdict.className = right ? "verdict ok" : "verdict fail"
    verdict.textContent = `${right ? "✓ Right" : "✗ Not quite"}: ${p.choices[p.answer]}. ${p.explain}`
    panel.append(verdict)
    position = index
    update(verdict.textContent)
    buttons.step?.focus({ preventScroll: true })
  }

  function forward() {
    if (position >= count) return stop()
    if (pending()) return ask(position + 1)
    position += 1
    if (panel && !predictions[position]) panel.hidden = true
    update(`step ${position}`)
  }

  // Navigating away abandons an unanswered question rather than leaving it live.
  function closeGate() {
    if (openGate === null) return
    openGate = null
    if (panel) panel.hidden = true
  }

  function stop() {
    clearInterval(timer)
    timer = null
    update()
  }

  function play() {
    if (timer) return stop()
    const speed = Number(buttons.speed?.value ?? 1)
    timer = setInterval(forward, intervalMs / speed)
    update()
    forward()
  }

  buttons.step?.addEventListener("click", () => {
    stop()
    forward()
  })
  buttons.back?.addEventListener("click", () => {
    stop()
    closeGate()
    position = Math.max(0, position - 1)
    update(`step ${position}`)
  })
  buttons.play?.addEventListener("click", play)
  buttons.reset?.addEventListener("click", () => {
    stop()
    closeGate()
    position = 0
    answered.clear()
    if (panel) panel.hidden = true
    update("reset to the start")
  })
  buttons.speed?.addEventListener("input", () => {
    if (timer) {
      stop()
      play()
    }
  })
  root.addEventListener("keydown", (event) => {
    if (event.target.matches("input, select, textarea")) return
    if (event.key === "ArrowRight") buttons.step?.click()
    else if (event.key === "ArrowLeft") buttons.back?.click()
    else if (event.key === "p" || event.key === "P") buttons.play?.click()
    else if (event.key === "r" || event.key === "R") buttons.reset?.click()
    else return
    event.preventDefault()
  })

  update()
  return {
    get position() {
      return position
    },
    goTo(index) {
      stop()
      closeGate()
      position = Math.max(0, Math.min(count, index))
      update()
    },
  }
}

// A one-off prediction outside a stepper: buttons, then a revealed explanation.
export function createQuestion(root, { question, choices, answer, explain, onReveal }) {
  root.classList.add("question")
  const heading = document.createElement("p")
  heading.className = "predict-q"
  heading.textContent = question
  const group = document.createElement("div")
  group.className = "choices"
  group.setAttribute("role", "group")
  group.setAttribute("aria-label", question)
  const result = document.createElement("p")
  result.setAttribute("aria-live", "polite")
  choices.forEach((label, choice) => {
    const button = document.createElement("button")
    button.type = "button"
    button.textContent = label
    button.addEventListener("click", () => {
      const right = choice === answer
      result.className = right ? "verdict ok" : "verdict fail"
      result.textContent = `${right ? "✓ Right" : "✗ Not quite"}: ${choices[answer]}. ${explain}`
      root.dataset.answered = "true"
      onReveal?.(choice)
    })
    group.append(button)
  })
  root.append(heading, group, result)
}
