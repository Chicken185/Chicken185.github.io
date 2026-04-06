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
      alert("请至少填写“反馈主题”和“留言内容”后再提交。");
      return;
    }

    const displayName = name ? name : "匿名浏览者";
    messageText.textContent =
      `感谢你，${displayName}。` +
      ` 你关于“${topic}”的反馈已被记录。` +
      ` 当前是本地模拟提交效果，后续如果你愿意，也可以再接真实表单服务。`;

    messageCard.classList.add("show");
    form.reset();

    messageCard.scrollIntoView({ behavior: "smooth", block: "start" });
  });
});