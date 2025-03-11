import {
  QuizOption,
  QuizQuestionWithOptions,
  QuizWithQuestions,
} from "@/types";

type QuizErrors = {
  [key: string]: string | string[] | { [key: string]: string } | QuizErrors[];
};

export function validateQuiz(quizData: QuizWithQuestions) {
  const errors: QuizErrors = {};

  if (!quizData.title || quizData.title.trim() === "") {
    errors.title = "Quiz title is required";
  }

  if (quizData.questions && quizData.questions.length > 0) {
    const questionErrors: QuizErrors[] = [];

    quizData.questions.forEach(
      (question: QuizQuestionWithOptions, qIndex: number) => {
        const qErrors: QuizErrors = {};

        if (!question.text || question.text.trim() === "") {
          qErrors.text = "Question text is required";
        }

        if (!question.quiz_options || question.quiz_options.length < 2) {
          qErrors.options = "At least 2 options are required";
        } else {
          const optionErrors: QuizErrors[] = [];
          let hasCorrectOption = false;

          question.quiz_options.forEach(
            (option: QuizOption, oIndex: number) => {
              const oErrors: QuizErrors = {};

              if (!option.text || option.text.trim() === "") {
                oErrors.text = "Option text is required";
              }

              if (option.is_correct) {
                hasCorrectOption = true;
              }

              if (Object.keys(oErrors).length > 0) {
                optionErrors[oIndex] = oErrors;
              }
            }
          );

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
      }
    );

    if (questionErrors.length > 0) {
      errors.questions = questionErrors;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
