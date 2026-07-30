# Academic Identity

Owns who the student is academically: institution, programme, curriculum,
level, semester, student profile.

Constraints:
- Programme, not department, is the organising unit (ADR-001).
- A User has exactly one active StudentProfile in the MVP. The schema allows
  many; the UI exposes one. Do not build profile switching.
