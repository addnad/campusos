# ADR-001: Programme Over Department

**Status:** Accepted  
**Date:** 2026-07-30  
**Decision Owner:** CampusOS Team

---

## Context

Universities organize students using administrative structures such as departments and faculties.

However, students experience university primarily through their academic programme, courses, curriculum, and semester progression.

Using Department as a primary academic entity would make CampusOS model university administration rather than the student's academic journey.

---

## Decision

CampusOS will use Programme as a core academic identity entity.

Department will not be included in the MVP domain model.

---

## Reasoning

Programme better represents:

- What a student is studying.
- The curriculum they follow.
- The courses they take.
- Their academic journey.

Department can be introduced later if administrative features are needed.

---

## Consequences

Positive:

- Simpler student experience.
- Cleaner data model.
- Easier multi-university support.

Negative:

- Some university administrative structures are not represented initially.

---

## Future Consideration

Department may be added later for institutional management features.