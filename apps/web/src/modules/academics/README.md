# Academic Management

Owns academic responsibilities: curriculum courses, assignments, exams,
deadlines, timetable.

Constraints:
- Subject and CurriculumCourse are separate models (ADR-002). A Subject is the
  general concept; a CurriculumCourse is one institution's implementation with
  its own code, level, semester and unit load. Never collapse them into a
  single Course model.
- Students always see their CurriculumCourse, never a bare Subject.
- Curriculum data is seeded and maintained by CampusOS in the MVP.
