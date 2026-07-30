# 02 - Domain Model

**Version:** 1.0
**Status:** Draft
**Owner:** CampusOS Team
**Last Updated:** 2026-07-30

---

## Purpose

The CampusOS domain model defines the core entities that represent a student's academic journey and the relationships between them.

---

## Core Principle

CampusOS models academic reality from the student's perspective.

The system prioritizes Programme and Curriculum over administrative structures because students experience university through their academic journey.

---

## Core Entities

### Student

Represents the user of CampusOS.

---

### University

Represents an educational institution.

---

### Programme

Represents what a student is studying.

---

### Curriculum

Represents the academic structure attached to a programme.

---

### Subject

Represents a general academic concept.

---

### Curriculum Course

Represents how a specific university teaches a subject.

---

### Assignment

Represents academic tasks belonging to curriculum courses.

---

### Lecture Note

Represents learning materials attached to curriculum courses.

---

### Community

Represents collaboration spaces attached to curriculum courses.

---

## Relationship Overview

University → Programme → Curriculum → Curriculum Course → Subject

Student → Enrollment → Curriculum Course

Curriculum Course → Assignments

Curriculum Course → Lecture Notes

Curriculum Course → Community

---

## Design Decisions

CampusOS will not include Department as a core entity in the initial version.

The product is designed around the student's academic experience rather than university administrative structures.