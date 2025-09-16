// DOM element getters and helpers

export const elements = {
  chatForm: document.getElementById("chat-form"),
  messageInput: document.getElementById("message-input"),
  chatContainer: document.getElementById("chat-container"),
  sendBtn: document.getElementById("send-btn"),
  submitSidebarBtn: document.getElementById("submit-sidebar-btn"),
  userNameInput: document.getElementById("user-name"),
  userGenderSelect: document.getElementById("user-gender"),
  userDobInput: document.getElementById("user-dob"),
  topicSelect: document.getElementById("horoscope-topic"),
  newChatBtn: document.getElementById("new-chat-btn"),
  historyList: document.getElementById("history-list"),
  headerTitle: document.querySelector("header h1"),
  hamburger: document.getElementById("menu-toggle"),
};

export const sidebar = document.getElementById("sidebar");
export const overlay = document.querySelector(".overlay");

export function toggleMenu() {
  const isOpen = sidebar.classList.contains("active");
  elements.hamburger.classList.toggle("is-active");
  sidebar.classList.toggle("active");
  overlay.classList.toggle("active");
  document.body.style.overflow = !isOpen ? "hidden" : "";
  elements.hamburger.setAttribute("aria-expanded", (!isOpen).toString());
  sidebar.setAttribute("aria-hidden", isOpen.toString());
}

export function bindMenuHandlers() {
  if (!elements.hamburger) return;
  elements.hamburger.addEventListener("click", toggleMenu);
  elements.hamburger.setAttribute("aria-expanded", "false");
  sidebar.setAttribute("aria-hidden", "true");
  overlay.addEventListener("click", toggleMenu);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && sidebar.classList.contains("active")) toggleMenu();
  });
  window.addEventListener("resize", () => {
    if (window.innerWidth > 768 && sidebar.classList.contains("active")) toggleMenu();
  });
}


