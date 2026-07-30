# ADR-002: Subject vs Curriculum Course Separation

**Status:** Accepted  
**Date:** 2026-07-30  
**Decision Owner:** CampusOS Team

---

## Context

Universities may teach similar academic concepts but structure them differently.

The same academic concept may have different:

- Course codes
- Unit values
- Academic levels
- Semesters
- Assessment structures

between different institutions.

Example:

YabaTech may teach Public Sector Accounting as ACC223 while another university may teach the same concept under a different code.

---

## Decision

CampusOS will separate Subject and Curriculum Course as different entities.

Subject represents the general academic concept.

Curriculum Course represents a university-specific implementation of that subject.

---

## Reasoning

This allows CampusOS to:

- Support multiple universities.
- Preserve each institution's curriculum structure.
- Connect related academic knowledge across institutions.
- Avoid forcing different universities into one universal course model.

---

## Consequences

Positive:

- Better multi-university support.
- More accurate academic representation.
- Stronger AI context.

Negative:

- More complex data modelling.
- Requires additional relationships.

---

## Future Consideration

CampusOS may use Subject relationships to improve cross-university resource discovery and learning recommendations.