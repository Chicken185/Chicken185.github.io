document.addEventListener("DOMContentLoaded", function () {
  const questions = Array.isArray(window.quizQuestions) ? window.quizQuestions : [];
  const totalQuestions = questions.length;
  const quizList = document.getElementById("quiz-list");
  const totalCountEl = document.getElementById("total-count");
  const answeredCountEl = document.getElementById("answered-count");
  const quizStateTextEl = document.getElementById("quiz-state-text");
  const progressLabelEl = document.getElementById("progress-label");
  const progressFillEl = document.getElementById("progress-fill");
  const submitBtn = document.getElementById("submit-quiz-btn");
  const resetBtn = document.getElementById("reset-quiz-btn");
  const resultPanel = document.getElementById("quiz-result-panel");
  const summaryText = document.getElementById("quiz-summary-text");
  const answerReview = document.getElementById("answer-review");

  function optionLetter(index) {
    return String.fromCharCode(65 + index);
  }

  function renderQuestions() {
    totalCountEl.textContent = totalQuestions;
    progressLabelEl.textContent = `0 / ${totalQuestions}`;

    questions.forEach(function (question, questionIndex) {
      const card = document.createElement("article");
      card.className = "quiz-card";
      card.dataset.question = question.id;

      const label = document.createElement("span");
      label.className = "quiz-label";
      label.textContent = question.label;
      card.appendChild(label);

      const title = document.createElement("h3");
      title.textContent = question.title;
      card.appendChild(title);

      const description = document.createElement("p");
      description.className = "quiz-desc";
      description.textContent = question.description;
      card.appendChild(description);

      if (question.media && question.media.type === "image") {
        const frame = document.createElement("div");
        frame.className = "quiz-image-frame";
        const image = document.createElement("img");
        image.className = `quiz-image quiz-image--${question.id}`;
        image.src = question.media.src;
        image.alt = question.media.alt;
        image.loading = "lazy";
        frame.appendChild(image);
        card.appendChild(frame);
      }

      if (question.media && question.media.type === "midi") {
        const shell = document.createElement("div");
        shell.className = "midi-player";

        const playButton = document.createElement("button");
        playButton.type = "button";
        playButton.className = "midi-play-button";
        playButton.textContent = "播放声音片段";
        shell.appendChild(playButton);

        const status = document.createElement("span");
        status.className = "midi-player-status";
        status.setAttribute("aria-live", "polite");
        status.textContent = "点击后直接在页面中播放";
        shell.appendChild(status);

        const note = document.createElement("p");
        note.className = "midi-player-note";
        note.textContent = "此播放器会在浏览器内读取并合成 MIDI 音符，无需下载或跳转。";
        shell.appendChild(note);

        const player = new window.ProjectMidiPlayer(question.media.src);
        player.onEnded = function () {
          playButton.textContent = "播放声音片段";
          status.textContent = "播放结束，可以再次试听";
        };

        playButton.addEventListener("click", async function () {
          if (player.isPlaying) {
            player.stop(false);
            playButton.textContent = "播放声音片段";
            status.textContent = "已停止播放";
            return;
          }
          playButton.disabled = true;
          status.textContent = "正在载入声音片段…";
          try {
            player.activate();
            await player.play();
            playButton.textContent = "停止播放";
            status.textContent = "正在播放";
          } catch (error) {
            status.textContent = "暂时无法播放这段声音，请刷新后重试。";
          } finally {
            playButton.disabled = false;
          }
        });
        card.appendChild(shell);
      }

      const optionsGroup = document.createElement("div");
      optionsGroup.className = "options-group";

      question.options.forEach(function (option, optionIndex) {
        const optionLabel = document.createElement("label");
        optionLabel.className = "option-item";

        const radio = document.createElement("input");
        radio.type = "radio";
        radio.name = question.id;
        radio.value = optionLetter(optionIndex);
        radio.dataset.questionIndex = questionIndex;

        const optionText = document.createElement("span");
        optionText.textContent = `${optionLetter(optionIndex)}. ${option}`;

        optionLabel.appendChild(radio);
        optionLabel.appendChild(optionText);
        optionsGroup.appendChild(optionLabel);
      });
      card.appendChild(optionsGroup);

      const feedback = document.createElement("div");
      feedback.className = "question-feedback";
      feedback.setAttribute("aria-live", "polite");
      feedback.textContent = "你的选择已记录。完成全部题目后，可以查看这道题的讨论方向。";
      card.appendChild(feedback);

      quizList.appendChild(card);
    });
  }

  function getAnsweredCount() {
    return questions.filter(function (question) {
      return document.querySelector(`input[name="${question.id}"]:checked`);
    }).length;
  }

  function getUserAnswers() {
    return questions.reduce(function (answers, question) {
      const checked = document.querySelector(`input[name="${question.id}"]:checked`);
      answers[question.id] = checked ? checked.value : null;
      return answers;
    }, {});
  }

  function updateStatus() {
    const answered = getAnsweredCount();
    const percentage = totalQuestions ? (answered / totalQuestions) * 100 : 0;
    answeredCountEl.textContent = answered;
    progressLabelEl.textContent = `${answered} / ${totalQuestions}`;
    progressFillEl.style.width = `${percentage}%`;

    if (answered === 0) {
      quizStateTextEl.textContent = "等待作答";
    } else if (answered < totalQuestions) {
      quizStateTextEl.textContent = "进行中";
    } else {
      quizStateTextEl.textContent = "已完成，可查看结果";
    }
  }

  function buildReview(userAnswers) {
    answerReview.innerHTML = "";

    questions.forEach(function (question, index) {
      const reviewItem = document.createElement("article");
      reviewItem.className = "answer-review-item";

      const heading = document.createElement("strong");
      const userValue = userAnswers[question.id];
      const userOption = userValue ? question.options[userValue.charCodeAt(0) - 65] : "未作答";
      heading.textContent = `${index + 1}. 你的选择：${userValue ? `${userValue}. ${userOption}` : userOption}`;
      reviewItem.appendChild(heading);

      const reference = document.createElement("p");
      reference.className = "muted";
      reference.textContent = `参考倾向：${question.referenceLabel}`;
      reviewItem.appendChild(reference);

      const analysis = document.createElement("p");
      analysis.className = "muted";
      analysis.textContent = `讨论方向：${question.analysis}`;
      reviewItem.appendChild(analysis);

      answerReview.appendChild(reviewItem);
    });
  }

  function showResult() {
    const answered = getAnsweredCount();
    if (answered < totalQuestions) {
      const firstUnanswered = questions.find(function (question) {
        return !document.querySelector(`input[name="${question.id}"]:checked`);
      });
      summaryText.textContent = `还有 ${totalQuestions - answered} 道题没有完成。先完成全部选择，再查看完整的讨论方向。`;
      resultPanel.classList.add("show");
      const firstInput = firstUnanswered && document.querySelector(`input[name="${firstUnanswered.id}"]`);
      if (firstInput) firstInput.focus();
      return;
    }

    const userAnswers = getUserAnswers();
    const matched = questions.filter(function (question) {
      return question.referenceValues.includes(userAnswers[question.id]);
    }).length;

    let narrative = "你的选择保留了较多开放性，说明你没有轻易把审美判断归结为人类 / 机器二元对立。";
    if (matched >= 6) {
      narrative = "你的选择与本页设置的参考倾向较为接近，更关注人机协同、参与过程和分布式主体。";
    } else if (matched <= 2) {
      narrative = "你的选择与本页参考倾向保持了一定距离，更强调人类作者、作品边界或创作责任的明确性。";
    }

    summaryText.textContent = `你完成了全部 ${totalQuestions} 道题，其中 ${matched} 道选择与本页参考倾向相近。${narrative} 这不是成绩，而是一份帮助继续讨论的阅读提示。`;
    buildReview(userAnswers);
    resultPanel.classList.add("show");
    quizStateTextEl.textContent = "已查看结果";
    resultPanel.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function resetQuiz() {
    document.querySelectorAll('input[type="radio"]').forEach(function (radio) {
      radio.checked = false;
    });
    document.querySelectorAll(".question-feedback").forEach(function (feedback) {
      feedback.classList.remove("show");
    });
    answerReview.innerHTML = "";
    summaryText.textContent = "完成全部题目后，这里会显示你的选择与本页参考倾向之间的关系。";
    resultPanel.classList.remove("show");
    updateStatus();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  renderQuestions();
  quizList.addEventListener("change", function (event) {
    if (!event.target.matches('input[type="radio"]')) return;
    const card = event.target.closest(".quiz-card");
    const feedback = card && card.querySelector(".question-feedback");
    if (feedback) feedback.classList.add("show");
    updateStatus();
  });
  submitBtn.addEventListener("click", showResult);
  resetBtn.addEventListener("click", resetQuiz);
  updateStatus();
});
