export function scoreQuiz(questions, answers) {
  if (!Array.isArray(answers) || answers.length !== questions.length) throw new TypeError('Answers must match the question count.');
  let answered = 0;
  let correct = 0;
  answers.forEach((answer, index) => {
    if (answer === null) return;
    if (!Number.isInteger(answer) || answer < 0 || answer >= questions[index].options.length) throw new TypeError('Invalid answer selection.');
    answered++;
    if (answer === questions[index].correct) correct++;
  });
  return { answered, correct, total: questions.length, unanswered: questions.length - answered, percentage: answered ? Math.round(correct / answered * 100) : null, complete: answered === questions.length };
}
