# Learning

Owns lecture notes, flashcards, quizzes, study sessions, and the AI tutor
surface.

Constraints:
- AI is an intelligence layer, not a source of truth (ADR-003). Tutor output is
  generated from academic context owned by `academics` and `identity`.
- The AI tutor is scoped to a CurriculumCourse in the MVP. Note-level and
  student-wide tutoring are future work.
- AI-generated content must be distinguishable from student-authored content in
  both the data model and the UI.
