# 04 - Application Architecture

**Version:** 1.0  
**Status:** Draft  
**Owner:** CampusOS Team  
**Last Updated:** 2026-07-30

---

## Purpose

This document defines the high-level technical architecture of CampusOS.

---

## Architecture Principle

CampusOS should remain simple, scalable, and aligned with the product domain.

Technical decisions should support the student's academic experience.

---

## Initial Technology Direction

### Frontend

Next.js with TypeScript.

---

### Application Layer

Next.js full-stack architecture for the MVP.

The application will contain:

- User interface
- Server logic
- API functionality

---

### Database

PostgreSQL.

CampusOS contains highly relational academic data, making PostgreSQL suitable for representing students, courses, curricula, and academic relationships.

---

### ORM

Prisma.

Prisma provides type-safe database access and migration management.

---

## High-Level Flow

Student

↓

Next.js Application

↓

Business Logic

↓

Prisma ORM

↓

PostgreSQL Database

---

## AI Principle

AI does not own academic data.

AI reads academic context from existing systems and generates assistance, recommendations, and insights.

---

## Future Considerations

As CampusOS grows, services may be separated into dedicated systems if scale requires it.