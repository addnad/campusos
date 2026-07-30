# 03 - Database Design

**Version:** 1.0
**Status:** Draft
**Owner:** CampusOS Team
**Last Updated:** 2026-07-30

---

## Purpose

This document defines how CampusOS data is structured based on the domain model.

---

## Database Principle

The database should represent the student's academic reality.

Relationships should follow how students experience university rather than administrative structures.

---

## Core Data Groups

### Identity

Contains:

- User
- Student Profile
- University
- Programme

---

### Academic Structure

Contains:

- Curriculum
- Semester
- Subject
- Curriculum Course

---

### Enrollment

Students connect to courses through enrollment records.

Student → Enrollment → Curriculum Course

---

### Academic Work

Contains:

- Assignment
- Exam
- Deadline

---

### Learning

Contains:

- Lecture Note
- Flashcard
- Quiz
- Study Session

---

### Collaboration

Contains:

- Community
- Community Member
- Discussion

---

## Key Relationships

University → Programme → Curriculum → Curriculum Course

Student → Enrollment → Curriculum Course

Curriculum Course → Assignment

Curriculum Course → Lecture Note

Curriculum Course → Community

---

## Design Decisions

Courses belong to curricula instead of directly belonging to universities.

Students connect to courses through enrollment records instead of direct relationships.

AI does not own academic data. It reads existing data and generates insights.