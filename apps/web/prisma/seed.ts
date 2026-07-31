import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, InstitutionKind, Confidence } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const norm = (code: string) => code.toUpperCase().replace(/[^A-Z0-9]/g, "");

const INSTITUTIONS = [
  { shortName: "UNILAG", name: "University of Lagos", kind: InstitutionKind.UNIVERSITY, state: "Lagos" },
  { shortName: "LASU", name: "Lagos State University", kind: InstitutionKind.UNIVERSITY, state: "Lagos" },
  { shortName: "UI", name: "University of Ibadan", kind: InstitutionKind.UNIVERSITY, state: "Oyo" },
  { shortName: "ABU", name: "Ahmadu Bello University, Zaria", kind: InstitutionKind.UNIVERSITY, state: "Kaduna" },
  { shortName: "UNN", name: "University of Nigeria, Nsukka", kind: InstitutionKind.UNIVERSITY, state: "Enugu" },
  { shortName: "OAU", name: "Obafemi Awolowo University", kind: InstitutionKind.UNIVERSITY, state: "Osun" },
  { shortName: "UNIBEN", name: "University of Benin", kind: InstitutionKind.UNIVERSITY, state: "Edo" },
  { shortName: "BUK", name: "Bayero University Kano", kind: InstitutionKind.UNIVERSITY, state: "Kano" },
  { shortName: "YABATECH", name: "Yaba College of Technology", kind: InstitutionKind.POLYTECHNIC, state: "Lagos" },
  { shortName: "LASPOTECH", name: "Lagos State Polytechnic", kind: InstitutionKind.POLYTECHNIC, state: "Lagos" },
  { shortName: "KADPOLY", name: "Kaduna Polytechnic", kind: InstitutionKind.POLYTECHNIC, state: "Kaduna" },
  { shortName: "FEDPOLYNEK", name: "Federal Polytechnic, Nekede", kind: InstitutionKind.POLYTECHNIC, state: "Imo" },
  { shortName: "AUCHIPOLY", name: "Auchi Polytechnic", kind: InstitutionKind.POLYTECHNIC, state: "Edo" },
  { shortName: "FCEOSIELE", name: "Federal College of Education (Technical), Omoku", kind: InstitutionKind.COLLEGE_OF_EDUCATION, state: "Rivers" },
  { shortName: "AOCOED", name: "Adeniran Ogunsanya College of Education", kind: InstitutionKind.COLLEGE_OF_EDUCATION, state: "Lagos" },
];

/// NBTE ND Accountancy. National curriculum: identical at every polytechnic.
/// Source: NBTE curriculum and course specifications.
/// NBTE numbers semesters 1-4 across the programme. Mapped to
/// level + semester as students speak it.
const ND_ACCOUNTANCY = [
  { level: "ND I", semester: 1, courses: [
    ["OTM 101-102", "Technical English I", 4], ["BFN 111", "Elements of Banking I", 2],
    ["GNS 111", "Citizenship Education", 2], ["BAM 112", "Business Mathematics I", 3],
    ["BAM 113", "Principles of Law", 2], ["BAM 211", "Principles of Management I", 2],
    ["BFN 112", "Principles of Economics I", 3], ["ACC 111", "Principles of Accounts I", 4],
    ["OTM 113", "Information Communications Technology I", 4],
  ]},
  { level: "ND I", semester: 2, courses: [
    ["GNS 121", "Citizenship Education", 2], ["OTM 201-202", "Technical English II", 4],
    ["BAM 126", "Introduction to Entrepreneurship", 2], ["BAM 122", "Business Mathematics II", 3],
    ["BFN 121", "Elements of Banking II", 2], ["BAM 214", "Business Law", 2],
    ["BAM 221", "Principles of Management II", 2], ["BFN 122", "Principles of Economics II", 3],
    ["ACC 121", "Principles of Accounts II", 4], ["OTM 214", "Information Communications Technology II", 4],
  ]},
  { level: "ND II", semester: 1, courses: [
    ["ACC 214", "Taxation I", 3], ["BFN 213", "Business Research Methods", 2],
    ["BAM 212", "Business Statistics I", 3], ["ACC 213", "Auditing I", 3],
    ["ACC 212", "Cost Accounting I", 4], ["ACC 211", "Financial Accounting I", 4],
    ["BAM 216", "Practice of Entrepreneurship", 2], ["BAM 424", "Company Law", 2],
  ]},
  { level: "ND II", semester: 2, courses: [
    ["BAM 222", "Business Statistics II", 3], ["BFN 211", "Business Finance", 3],
    ["ACC 223", "Auditing II", 3], ["ACC 222", "Cost Accounting II", 4],
    ["ACC 224", "Taxation II", 3], ["ACC 221", "Financial Accounting II", 4],
    ["ACC 225", "Public Sector Accounting", 2], ["ACC 229", "Project", 2],
  ]},
];

/// LASU BSc Computer Science. Units taken from the level tables, which
/// are consistent with their own totals; the course descriptions in the
/// same handbook disagree in several places.
/// Harmattan -> semester 1, Rain -> semester 2.
/// excluded: listed in the CS tables but marked "for non-computer science students".
const LASU_CS = [
  { level: "100 Level", semester: 1, courses: [
    ["CSC 111", "Introduction to Computer Science", 3, true, false],
    ["MAT 101", "Algebra", 3, true, false], ["MAT 111", "Trigonometry", 2, true, false],
    ["MAT 141", "Coordinate Geometry I", 2, false, false],
    ["PHY 101", "General Physics I", 3, true, false], ["PHY 103", "Basic Heat", 2, false, false],
    ["PHY 105", "Experimental Physics I", 2, true, false],
    ["BIO 101", "Basic Principles of Biology", 3, true, false],
    ["CHM 101", "General Chemistry I", 4, true, false],
    ["GNS 101", "Use of Library", 2, true, false],
    ["CSC 113", "Computer Application I for Arts, Social Sciences and Management Sciences", 2, false, true],
  ]},
  { level: "100 Level", semester: 2, courses: [
    ["CSC 120", "Computer as a Problem Solving Tool", 3, true, false],
    ["CSC 104", "Software Workshop", 2, true, false],
    ["CSC 112", "Principles of Computer Organization", 2, true, false],
    ["CSC 132", "Principles of Programming Language I", 2, true, false],
    ["MAT 112", "Calculus", 3, true, false],
    ["MAT 142", "Coordinate Geometry II", 2, false, false],
    ["MAT 162", "Introductory Statistics", 2, true, false],
    ["PHY 102", "Basic Optics and Sound", 3, false, false],
    ["PHY 104", "General Physics II", 3, true, false],
    ["GNS 102", "Use of English", 2, true, false],
  ]},
  { level: "200 Level", semester: 1, courses: [
    ["CSC 205", "Operating Systems I", 3, true, false],
    ["CSC 213", "Algorithm Development and Application", 3, true, false],
    ["CSC 217", "Fundamentals of Digital Electronics", 2, false, false],
    ["CSC 219", "Digital Logic Design", 2, false, false],
    ["CSC 221", "Fundamentals of Data Structures", 3, true, false],
    ["CSC 223", "Introduction to Information Processing Methods", 2, true, false],
    ["CSC 215", "Software Practice I", 2, true, false],
    ["MAT 251", "Mathematical Methods I", 3, true, false],
    ["MAT 261", "Probability Theory and Distributions", 2, false, false],
    ["GNS 201", "Lagos and its Environment", 2, true, false],
    ["CSC 201", "Computer Application II for Arts, Social Sciences and Management Sciences", 2, false, true],
  ]},
  { level: "200 Level", semester: 2, courses: [
    ["CSC 204", "Introduction to Discrete Mathematics", 2, true, false],
    ["CSC 208", "Introduction to Hardware Laboratory", 2, false, false],
    ["CSC 212", "Computer Architecture", 3, true, false],
    ["CSC 214", "Database Management System I", 3, true, false],
    ["CSC 218", "Foundation of Sequential Program", 2, true, false],
    ["CSC 222", "Assembly Programming Language", 2, true, false],
    ["CSC 226", "Object Oriented Programming I (C++)", 3, true, false],
    ["MAT 242", "Differential Equations", 3, false, false],
    ["PHY 204", "Electricity and Magnetism", 3, false, false],
    ["ENT 202", "Entrepreneurship Studies I", 2, true, false],
    ["CSC 228", "Software Practice II", 2, false, true],
  ]},
];

async function seedCurriculum(
  institutionId: string,
  programmeId: string,
  blocks: { level: string; semester: number; courses: any[][] }[],
) {
  for (const block of blocks) {
    const curriculum = await prisma.curriculum.upsert({
      where: {
        programmeId_level_semester_intakeYear: {
          programmeId, level: block.level, semester: block.semester, intakeYear: 0,
        },
      },
      update: {},
      create: { programmeId, level: block.level, semester: block.semester },
    });

    for (const row of block.courses) {
      const [code, title, units] = row as [string, string, number];
      const compulsory = row.length > 3 ? (row[3] as boolean) : true;
      const excluded = row.length > 4 ? (row[4] as boolean) : false;

      const course = await prisma.course.upsert({
        where: { institutionId_normalisedCode: { institutionId, normalisedCode: norm(code) } },
        update: { title, confidence: Confidence.VERIFIED },
        create: {
          institutionId, normalisedCode: norm(code), displayCode: code,
          title, confidence: Confidence.VERIFIED,
        },
      });

      await prisma.curriculumEntry.upsert({
        where: { curriculumId_courseId: { curriculumId: curriculum.id, courseId: course.id } },
        update: { units, compulsory, excluded, confidence: Confidence.VERIFIED },
        create: {
          curriculumId: curriculum.id, courseId: course.id,
          units, compulsory, excluded, confidence: Confidence.VERIFIED,
        },
      });
    }
  }
}

async function main() {
  const byShortName: Record<string, string> = {};
  for (const inst of INSTITUTIONS) {
    const row = await prisma.institution.upsert({
      where: { shortName: inst.shortName }, update: inst, create: inst,
    });
    byShortName[inst.shortName] = row.id;
  }
  console.log(`institutions: ${INSTITUTIONS.length}`);

  const yabatech = byShortName["YABATECH"];
  const ndAcc = await prisma.programme.upsert({
    where: { institutionId_name_award: { institutionId: yabatech, name: "Accountancy", award: "ND" } },
    update: {},
    create: { institutionId: yabatech, name: "Accountancy", award: "ND" },
  });
  await seedCurriculum(yabatech, ndAcc.id, ND_ACCOUNTANCY);
  console.log("YABATECH ND Accountancy: 4 semesters");

  const lasu = byShortName["LASU"];
  const bscCs = await prisma.programme.upsert({
    where: { institutionId_name_award: { institutionId: lasu, name: "Computer Science", award: "BSc" } },
    update: {},
    create: { institutionId: lasu, name: "Computer Science", award: "BSc" },
  });
  await seedCurriculum(lasu, bscCs.id, LASU_CS);
  console.log("LASU BSc Computer Science: 100 and 200 level");

  const courses = await prisma.course.count();
  const entries = await prisma.curriculumEntry.count();
  console.log(`courses: ${courses}, curriculum entries: ${entries}`);
}

main().finally(() => prisma.$disconnect());
