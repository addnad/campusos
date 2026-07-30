# 05 - Database Schema

**Version:** 1.0  
**Status:** Draft  
**Owner:** CampusOS Team  
**Last Updated:** 2026-07-30

---

## Purpose

This document defines the database entities and relationships that will power CampusOS.

---

## Design Principles

The database should represent the student's academic reality.

Academic relationships should be modeled explicitly instead of using shortcuts.

---

# Identity Models

## User

Represents an account in CampusOS.

Responsibilities:

- Authentication
- Profile ownership
- Account settings

---

## StudentProfile

Represents a user's academic identity.

Relationships:

User → StudentProfile

Contains:

- University
- Programme
- Level
- Academic information

---

# Academic Structure Models

## University

Represents an educational institution.

---

## Programme

Represents what a student studies.

Example:

Accountancy

Computer Science

Mass Communication

---

## Curriculum

Represents the academic structure for a programme.

Example:

ND Accountancy Curriculum 2026

---

## Semester

Represents an academic period.

Example:

ND II Second Semester

---

## Subject

Represents a general academic concept.

Example:

Public Sector Accounting

---

## CurriculumCourse

Represents a university-specific implementation of a subject.

Contains:

- Course code
- Units
- Semester
- Curriculum

---

# Student Academic Models

## Enrollment

Connects students to curriculum courses.

Relationship:

StudentProfile → Enrollment → CurriculumCourse

---

# Learning Models

## LectureNote

Belongs to a curriculum course.

---

## Assignment

Represents academic tasks.

Belongs to a curriculum course.

---

# Collaboration Models

## Community

Represents student collaboration around curriculum courses.

---

# Relationship Summary

User

↓

StudentProfile

↓

Enrollment

↓

CurriculumCourse

↓

Subject


University

↓

Programme

↓

Curriculum

↓

CurriculumCourse


CurriculumCourse

↓

Assignment

LectureNote

Community

---

## Future Expansion

Possible future entities:

- Lecturer
- Faculty
- Department
- Institution Admin
- Grade
- Attendance

These are intentionally excluded from the MVP.