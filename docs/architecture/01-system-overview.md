# 01 - System Overview

**Version:** 1.0
**Status:** Approved
**Owner:** CampusOS Team
**Last Updated:** 2026-07-30

---

## Overview

CampusOS is organized into five core business domains.

Each domain has a single responsibility and owns a specific part of the product.

Domains should communicate with each other but should not own each other's data.

---

## Core Domains

### Academic Identity

Responsible for understanding who a student is academically.

Owns:

- Student
- University
- Programme
- Curriculum
- Semester
- Enrollment

---

### Academic Management

Responsible for organizing academic responsibilities.

Owns:

- Curriculum Courses
- Timetable
- Assignments
- Exams
- Deadlines

---

### Learning

Responsible for helping students understand and retain knowledge.

Owns:

- Lecture Notes
- Flashcards
- AI Tutor
- Quizzes
- Study Sessions

---

### Collaboration

Responsible for connecting students through shared academic context.

Owns:

- Course Communities
- Discussions
- Shared Resources
- Peer Discovery

---

### Intelligence

Responsible for generating proactive insights.

Owns:

- Study Plans
- Recommendations
- Smart Reminders
- Academic Insights

Intelligence reads data from other domains but does not own their data.