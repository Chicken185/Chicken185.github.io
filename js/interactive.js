document.addEventListener("DOMContentLoaded", function () {
  const totalQuestions = 6;
  const answeredCountEl = document.getElementById("answered-count");
  const quizStateTextEl = document.getElementById("quiz-state-text");
  const submitBtn = document.getElementById("submit-quiz-btn");
  const showAnswerBtn = document.getElementById("show-answer-btn");
  const resetBtn = document.getElementById("reset-quiz-btn");
  const resultPanel = document.getElementById("quiz-result-panel");
  const summaryText = document.getElementById("quiz-summary-text");
  const answerList = document.getElementById("answer-list");

  const answerKey = {
    q1: "C",
    q2: "A",
    q3: "C",
    q4: "B",
    q5: "C",
    q6: "B"
  };

  const reflectiveKey = {
    q2: ["A", "C"],
    q4: ["B"],
    q5: ["A", "C"],
    q6: ["B"]
  };

  function getAnsweredCount() {
    let count = 0;

    for (let i = 1; i <= totalQuestions; i++) {
      const checked = document.querySelector(`input[name="q${i}"]:checked`);
      if (checked) count++;
    }

    return count;
  }

  function updateStatus() {
    const answered = getAnsweredCount();
    answeredCountEl.textContent = answered;

    if (answered === 0) {
      quizStateTextEl.textContent = "等待作答";
    } else if (answered < totalQuestions) {
      quizStateTextEl.textContent = "进行中";
    } else {
      quizStateTextEl.textContent = "可提交";
    }
  }

  function getUserAnswers() {
    const answers = {};
    for (let i = 1; i <= totalQuestions; i++) {
      const checked = document.querySelector(`input[name="q${i}"]:checked`);
      answers[`q${i}`] = checked ? checked.value : null;
    }
    return answers;
  }

  function calculateScore(userAnswers) {
    let exactMatches = 0;

    for (let i = 1; i <= totalQuestions; i++) {
      const questionKey = `q${i}`;
      if (userAnswers[questionKey] === answerKey[questionKey]) {
        exactMatches++;
      }
    }

    return exactMatches;
  }

  function getResultNarrative(userAnswers, score) {
    let reflectiveCount = 0;

    Object.keys(reflectiveKey).forEach(function (key) {
      const acceptedAnswers = reflectiveKey[key];
      if (acceptedAnswers.includes(userAnswers[key])) {
        reflectiveCount++;
      }
    });

    if (score >= 5) {
      return "你的判断与本页设置的参考答案高度接近。你更倾向于接受“人机协同”“分布式主体”这一类观点，也更容易从关系与过程，而非单一作者身份来理解审美经验。";
    }

    if (reflectiveCount >= 3) {
      return "你的作答显示出较强的思辨性。你并没有把判断简单地归结为“人类 / 机器”二元对立，而是开始关注创作关系、参与程度与媒介条件对审美经验的影响。";
    }

    return "你的作答更接近传统主体视角。这并不意味着错误，而是说明你更重视人类作者、独立创作和明确边界。本项目正是希望通过这些题目，进一步引出这种传统判断与新型分布式主体之间的张力。";
  }

  document.querySelectorAll('input[type="radio"]').forEach(function (radio) {
    radio.addEventListener("change", updateStatus);
  });

  submitBtn.addEventListener("click", function () {
    const answered = getAnsweredCount();

    if (answered < totalQuestions) {
      alert(`你还有 ${totalQuestions - answered} 道题没有完成，请先全部作答。`);
      return;
    }

    const userAnswers = getUserAnswers();
    const score = calculateScore(userAnswers);
    const narrative = getResultNarrative(userAnswers, score);

    resultPanel.classList.add("show");
    summaryText.textContent = `你完成了全部 ${totalQuestions} 道题，其中有 ${score} 道与当前设置的参考答案一致。${narrative}`;
    answerList.classList.add("hidden");
    quizStateTextEl.textContent = "已提交";

    resultPanel.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  showAnswerBtn.addEventListener("click", function () {
    resultPanel.classList.add("show");
    answerList.classList.remove("hidden");

    if (getAnsweredCount() < totalQuestions) {
      summaryText.textContent = "你还没有完成全部题目，但你可以先查看当前设置的参考答案与解析。后续也可以继续作答再提交。";
    }

    resultPanel.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  resetBtn.addEventListener("click", function () {
    document.querySelectorAll('input[type="radio"]').forEach(function (radio) {
      radio.checked = false;
    });

    answeredCountEl.textContent = "0";
    quizStateTextEl.textContent = "等待作答";
    summaryText.textContent = "这里会在提交后显示你的结果总结。";
    answerList.classList.add("hidden");
    resultPanel.classList.remove("show");

    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  updateStatus();
});