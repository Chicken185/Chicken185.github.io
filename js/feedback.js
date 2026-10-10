document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("feedback-form");
  const nameInput = document.getElementById("user-name");
  const topicInput = document.getElementById("feedback-topic");
  const contentInput = document.getElementById("feedback-content");
  const messageCard = document.getElementById("submit-message-card");
  const messageText = document.getElementById("submit-message-text");

  if (!form) return;

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    const name = nameInput.value.trim();
    const topic = topicInput.value.trim();
    const content = contentInput.value.trim();

    if (!topic || !content) {
      messageCard.classList.add("show");
      messageText.textContent = "请先填写反馈主题和留言内容。当前页面不会上传或保存未完成的内容。";
      topicInput.focus();
      return;
    }

    const displayName = name || "匿名浏览者";
    messageText.textContent = `感谢你，${displayName}。你关于“${topic}”的回应已在本页面记录。当前版本是本地演示，留言尚未发送到服务器。`;
    messageCard.classList.add("show");
    form.reset();
    messageCard.scrollIntoView({ behavior: "smooth", block: "start" });
  });
});
