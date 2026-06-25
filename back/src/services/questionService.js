// services/questionService.js — Funcionalidades 7, 8, 9
const Question = require("../models/Question");
const { mergeIfRedundant }              = require("../utils/questionMerger");
const { calculateScore, sortByPriority } = require("../utils/priorityCalculator");

async function processNewQuestion({ classId, text, category, authorSession, sentOutOfClass }) {
  let question = await Question.create({
    classId,
    text: text.trim(),
    category,
    authorSession: authorSession || "anónimo",
    sentOutOfClass: sentOutOfClass || false,
  });

  let merged = false;

  if (!question.sent_out_of_class) {
    const result = await mergeIfRedundant(question);
    merged = result.merged;

    if (merged && result.original) {
      const newPriority = calculateScore(result.original.merge_count, result.original.category);
      result.original = await Question.updatePriorityAndMergeCount(
        result.original.id,
        newPriority,
        result.original.merge_count
      );
      question = result.original;
    }
  }

  if (!merged) {
    const score = calculateScore(question.merge_count, question.category);
    question = await Question.updatePriorityAndMergeCount(question.id, score, question.merge_count);
  }

  const pending = await Question.findPendingByClass(classId);
  const sortedList = sortByPriority(pending);

  return { question, merged, sortedList };
}

module.exports = { processNewQuestion };
