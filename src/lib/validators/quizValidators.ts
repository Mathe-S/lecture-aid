export function validateQuiz(quizData: any) {
  const errors: any = {};

  if (!quizData.title || quizData.title.trim() === "") {
    errors.title = "Quiz title is required";
  }

  if (quizData.questions && quizData.questions.length > 0) {
    const questionErrors: any[] = [];

    quizData.questions.forEach((question: any, qIndex: number) => {
      const qErrors: any = {};

      if (!question.text || question.text.trim() === "") {
        qErrors.text = "Question text is required";
      }

      if (!question.quiz_options || question.quiz_options.length < 2) {
        qErrors.options = "At least 2 options are required";
      } else {
        const optionErrors: any[] = [];
        let hasCorrectOption = false;

        question.quiz_options.forEach((option: any, oIndex: number) => {
          const oErrors: any = {};

          if (!option.text || option.text.trim() === "") {
            oErrors.text = "Option text is required";
          }

          if (option.is_correct) {
            hasCorrectOption = true;
          }

          if (Object.keys(oErrors).length > 0) {
            optionErrors[oIndex] = oErrors;
          }
        });

        if (!hasCorrectOption) {
          qErrors.correctOption =
            "At least one option must be marked as correct";
        }

        if (optionErrors.length > 0) {
          qErrors.options = optionErrors;
        }
      }

      if (Object.keys(qErrors).length > 0) {
        questionErrors[qIndex] = qErrors;
      }
    });

    if (questionErrors.length > 0) {
      errors.questions = questionErrors;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
