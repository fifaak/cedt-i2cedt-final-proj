import { elements } from "./dom.js";
import { TYPING_MESSAGES, PLACEHOLDERS } from "./constants.js";
import { appState } from "./state.js";

export function setChatState(enabled) {
  elements.messageInput.disabled = !enabled;
  elements.sendBtn.disabled = !enabled;
  if (enabled) {
    elements.messageInput.placeholder = PLACEHOLDERS.ENABLED;
    elements.chatContainer.classList.remove("disabled-chat");
  } else {
    elements.messageInput.placeholder = PLACEHOLDERS.DISABLED;
    elements.chatContainer.classList.add("disabled-chat");
  }
}

export function displayMessage(text, type, shouldSave = true, saveFn = null) {
  const messageDiv = document.createElement("div");
  messageDiv.classList.add("message", type);
  const p = document.createElement("p");
  p.textContent = text;
  messageDiv.appendChild(p);
  elements.chatContainer.appendChild(messageDiv);
  elements.chatContainer.scrollTop = elements.chatContainer.scrollHeight;
  if (shouldSave && saveFn) saveFn();
  return messageDiv;
}

export function showTypingIndicator() {
  removeTypingIndicator();
  const messageDiv = document.createElement("div");
  messageDiv.classList.add("message", "received", "typing");
  messageDiv.id = "typing-indicator";
  const p = document.createElement("p");
  p.classList.add("typing-text");
  const randomMessage = TYPING_MESSAGES[Math.floor(Math.random() * TYPING_MESSAGES.length)];
  p.innerHTML = `${randomMessage}<span class="typing-dots"></span>`;
  messageDiv.appendChild(p);
  elements.chatContainer.appendChild(messageDiv);
  elements.chatContainer.scrollTop = elements.chatContainer.scrollHeight;
  return messageDiv;
}

export function removeTypingIndicator() {
  const typingIndicator = document.getElementById("typing-indicator");
  if (typingIndicator) typingIndicator.remove();
}

export function typeWriterEffect(element, text, baseSpeed = 30) {
  return new Promise((resolve) => {
    element.textContent = "";
    let i = 0;
    const typeChar = () => {
      if (i < text.length) {
        const char = text.charAt(i);
        element.textContent += char;
        i++;
        let speed = baseSpeed;
        if (char === " ") speed = baseSpeed * 0.5;
        else if (char === "." || char === "!" || char === "?") speed = baseSpeed * 3;
        else if (char === ",") speed = baseSpeed * 1.5;
        else if (Math.random() < 0.1) speed = baseSpeed * 2;
        setTimeout(typeChar, speed);
        elements.chatContainer.scrollTop = elements.chatContainer.scrollHeight;
      } else {
        resolve();
      }
    };
    typeChar();
  });
}

export async function displayMessageWithTyping(text, type, shouldSave = true, saveFn = null) {
  if (type === "received") {
    removeTypingIndicator();
    await new Promise((resolve) => setTimeout(resolve, 500));
    const messageDiv = document.createElement("div");
    messageDiv.classList.add("message", type);
    const p = document.createElement("p");
    messageDiv.appendChild(p);
    elements.chatContainer.appendChild(messageDiv);
    elements.chatContainer.scrollTop = elements.chatContainer.scrollHeight;
    await typeWriterEffect(p, text, 25);
    if (shouldSave && saveFn) saveFn();
    return messageDiv;
  }
  return displayMessage(text, type, shouldSave, saveFn);
}


