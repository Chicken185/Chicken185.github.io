document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("feedback-form");
  const nameInput = document.getElementById("user-name");
  const emailInput = document.getElementById("user-email");
  const topicInput = document.getElementById("feedback-topic");
  const contentInput = document.getElementById("feedback-content");
  const messageCard = document.getElementById("submit-message-card");
  const messageText = document.getElementById("submit-message-text");
  const prompts = document.querySelectorAll(".response-prompt");
  const submitButton = form && form.querySelector('button[type="submit"]');

  if (!form) return;

  prompts.forEach(function (prompt) {
    prompt.addEventListener("click", function () {
      prompts.forEach(function (item) { item.classList.remove("is-selected"); });
      prompt.classList.add("is-selected");
      topicInput.value = prompt.dataset.topic || "";
      contentInput.placeholder = prompt.dataset.placeholder || contentInput.placeholder;
      contentInput.focus();
    });
  });

  form.addEventListener("submit", async function (event) {
    event.preventDefault();

    const name = nameInput.value.trim();
    const topic = topicInput.value.trim();
    const content = contentInput.value.trim();

    if (!topic || !content) {
      messageCard.classList.add("show");
      messageText.textContent = "请先填写反馈主题和留言内容。";
      topicInput.focus();
      return;
    }

    const displayName = name || "匿名浏览者";
    if (emailInput.value && !emailInput.validity.valid) {
      messageCard.classList.add("show");
      messageText.textContent = "请检查联系邮箱的格式，或将其留空。";
      emailInput.focus();
      return;
    }

    submitButton.disabled = true;
    submitButton.querySelector("span").textContent = "正在发送…";

    try {
      const response = await fetch(form.action, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" }
      });
      if (!response.ok) throw new Error("Submission failed");

      messageText.textContent = `感谢你，${displayName}。关于“${topic}”的回应已发送至项目邮箱。`;
      messageCard.classList.add("show");
      form.reset();
      prompts.forEach(function (item) { item.classList.remove("is-selected"); });
      messageCard.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (error) {
      messageText.textContent = "暂时无法发送，请检查网络后重试。";
      messageCard.classList.add("show");
    } finally {
      submitButton.disabled = false;
      submitButton.querySelector("span").textContent = "发送这条回应";
    }
  });
});
