import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, InstitutionKind, Confidence, StudyMode } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const norm = (code: string) => code.toUpperCase().replace(/[^A-Z0-9]/g, "");
const normName = (n: string) => n.toUpperCase().replace(/[^A-Z0-9]/g, "");

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
  campusId: string,
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
        where: { campusId_normalisedCode: { campusId, normalisedCode: norm(code) } },
        update: { title, confidence: Confidence.VERIFIED },
        create: {
          institutionId, campusId, normalisedCode: norm(code), displayCode: code,
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


/// YABATECH part-time, from the college's 2025/2026 admission notice.
/// Weekday/evening and weekend carry different programme lists and both
/// run six semesters. Programme names only: the course lists are not
/// published there, so students supply them.
const YABA_PT_WEEKDAY = [
  "Building Technology", "Civil Engineering", "Computer Science",
  "Computer Engineering", "Electrical Engineering",
  "Estate Management & Valuation", "General Art",
  "Fashion Design & Clothing Technology", "Food Technology",
  "Hospitality Management", "Mechanical Engineering",
  "Metallurgical Engineering", "Industrial Maintenance Engineering",
  "Science Laboratory Technology", "Statistics", "Mass Communication",
];

/// Epe only, per the same notice.
const EPE_PT_WEEKDAY = ["Agricultural Technology"];

/// Weekend programmes. All five run at both campuses except Banking &
/// Finance, which the notice marks ND only.
const PT_WEEKEND = [
  "Accountancy", "Banking & Finance", "Business Administration",
  "Marketing", "Office Technology & Management",
];

async function seedProgrammes(institutionId: string, campusId: string, names: string[], award: string, mode: StudyMode, years: number) {
  for (const name of names) {
    await prisma.programme.upsert({
      where: { campusId_name_award_studyMode: { campusId, name, award, studyMode: mode } },
      update: { years, normalisedName: normName(name) },
      create: { institutionId, campusId, name, normalisedName: normName(name), award, studyMode: mode, years },
    });
  }
}


/// YABATECH full-time and part-time programmes, from the college's own
/// school sites. Names only: NBTE curricula are seeded separately.
/// [name, award, mode]

/// School of Technology — sot.yabatech.edu.ng lists all 23 explicitly.
const YABA_TECHNOLOGY: [string, string, StudyMode][] = [
  ["Agricultural Technology", "ND", StudyMode.FULL_TIME],
  ["Agricultural Technology", "ND", StudyMode.PART_TIME_WEEKDAY],
  ["Agricultural Extension and Management", "HND", StudyMode.FULL_TIME],
  ["Animal Production Technology", "HND", StudyMode.FULL_TIME],
  ["Crop Production Technology", "HND", StudyMode.FULL_TIME],
  ["Computer Science", "ND", StudyMode.FULL_TIME],
  ["Computer Science", "ND", StudyMode.PART_TIME_WEEKDAY],
  ["Computer Science", "HND", StudyMode.FULL_TIME],
  ["Computer Science", "HND", StudyMode.PART_TIME_WEEKDAY],
  ["Food Technology", "ND", StudyMode.FULL_TIME],
  ["Food Technology", "ND", StudyMode.PART_TIME_WEEKDAY],
  ["Food Technology", "HND", StudyMode.FULL_TIME],
  ["Food Technology", "HND", StudyMode.PART_TIME_WEEKDAY],
  ["Nutrition and Dietetics", "ND", StudyMode.FULL_TIME],
  ["Hospitality Management", "ND", StudyMode.FULL_TIME],
  ["Hospitality Management", "ND", StudyMode.PART_TIME_WEEKDAY],
  ["Hospitality Management", "HND", StudyMode.FULL_TIME],
  ["Hospitality Management", "HND", StudyMode.PART_TIME_WEEKDAY],
  ["Leisure and Tourism Management", "ND", StudyMode.FULL_TIME],
  ["Tourism Management", "HND", StudyMode.FULL_TIME],
  ["Polymer Technology", "ND", StudyMode.FULL_TIME],
  ["Textile Technology", "ND", StudyMode.FULL_TIME],
  ["Textile Technology", "HND", StudyMode.FULL_TIME],
];

/// School of Engineering — soe.yabatech.edu.ng publishes a FT/PT x ND/HND
/// matrix per department.
const YABA_ENGINEERING: [string, string, StudyMode][] = [
  ["Agricultural and Bio-Environmental Engineering", "ND", StudyMode.FULL_TIME],
  ["Chemical Engineering", "ND", StudyMode.FULL_TIME],
  ["Civil Engineering", "ND", StudyMode.FULL_TIME],
  ["Civil Engineering", "HND", StudyMode.FULL_TIME],
  ["Civil Engineering", "ND", StudyMode.PART_TIME_WEEKDAY],
  ["Civil Engineering", "HND", StudyMode.PART_TIME_WEEKDAY],
  ["Computer Engineering", "ND", StudyMode.FULL_TIME],
  ["Computer Engineering", "HND", StudyMode.FULL_TIME],
  ["Computer Engineering", "ND", StudyMode.PART_TIME_WEEKDAY],
  ["Computer Engineering", "HND", StudyMode.PART_TIME_WEEKDAY],
  ["Electrical/Electronics Engineering", "ND", StudyMode.FULL_TIME],
  ["Electrical/Electronics Engineering", "HND", StudyMode.FULL_TIME],
  ["Electrical/Electronics Engineering", "ND", StudyMode.PART_TIME_WEEKDAY],
  ["Electrical/Electronics Engineering", "HND", StudyMode.PART_TIME_WEEKDAY],
  ["Industrial Maintenance Engineering", "ND", StudyMode.FULL_TIME],
  ["Industrial Maintenance Engineering", "HND", StudyMode.FULL_TIME],
  ["Industrial Maintenance Engineering", "ND", StudyMode.PART_TIME_WEEKDAY],
  ["Industrial Maintenance Engineering", "HND", StudyMode.PART_TIME_WEEKDAY],
  ["Marine Engineering", "ND", StudyMode.FULL_TIME],
  ["Marine Engineering", "HND", StudyMode.FULL_TIME],
  ["Mechanical Engineering", "ND", StudyMode.FULL_TIME],
  ["Mechanical Engineering", "HND", StudyMode.FULL_TIME],
  ["Mechanical Engineering", "ND", StudyMode.PART_TIME_WEEKDAY],
  ["Mechanical Engineering", "HND", StudyMode.PART_TIME_WEEKDAY],
  ["Mechatronics Engineering", "ND", StudyMode.FULL_TIME],
  ["Metallurgical Engineering", "ND", StudyMode.FULL_TIME],
  ["Metallurgical Engineering", "HND", StudyMode.FULL_TIME],
  ["Metallurgical Engineering", "ND", StudyMode.PART_TIME_WEEKDAY],
  ["Metallurgical Engineering", "HND", StudyMode.PART_TIME_WEEKDAY],
  ["Mineral and Petroleum Resources Engineering", "ND", StudyMode.FULL_TIME],
  ["Welding and Fabrication Engineering", "ND", StudyMode.FULL_TIME],
];

/// School of Management and Business Studies — smbs.yabatech.edu.ng.
/// Full-time; the weekend part-time variants are seeded separately from
/// the part-time admission notice.
const YABA_MANAGEMENT: [string, string, StudyMode][] = [
  ["Accountancy", "HND", StudyMode.FULL_TIME],
  ["Business Administration and Management", "ND", StudyMode.FULL_TIME],
  ["Business Administration and Management", "HND", StudyMode.FULL_TIME],
  ["Office Technology and Management", "ND", StudyMode.FULL_TIME],
  ["Office Technology and Management", "HND", StudyMode.FULL_TIME],
  ["Banking and Finance", "ND", StudyMode.FULL_TIME],
  ["Marketing", "HND", StudyMode.FULL_TIME],
];


/// YABATECH HND part-time, from the college's 2025/2026 HND part-time
/// admission notice. Six semesters, so a three-year ladder.
const YABA_HND_PT_WEEKDAY = [
  "Civil Engineering", "Computer Engineering", "Electrical Engineering",
  "Industrial Maintenance Engineering", "Mechanical Engineering",
  "Building Technology", "Estate Management & Valuation",
  "Journalism and Media Studies", "Networking and Cloud Computing",
  "Software and Web Development", "Food Technology",
  "Hospitality Management", "Statistics", "Environmental Biology",
  "Microbiology", "Biochemistry",
];

/// Weekend HND, both campuses per the same notice.
const YABA_HND_PT_WEEKEND = [
  "Accountancy", "Business Administration", "Marketing",
  "Office Technology & Management", "Banking and Finance",
];


/// UNILAG full-time undergraduate programmes, from the Admissions Office
/// programmes page (admissions.unilag.edu.ng). Awards and durations are
/// assigned by discipline convention, not stated on that page.
const UNILAG: [string, string, number][] = [
  // Arts
  ["Creative Arts", "BA", 4], ["English", "BA", 4], ["French", "BA", 4],
  ["Russian", "BA", 4], ["History & Strategic Studies", "BA", 4],
  ["Linguistics, Igbo/Yoruba", "BA", 4], ["Chinese", "BA", 4],
  ["Philosophy", "BA", 4], ["Christian Religious Studies", "BA", 4],
  ["Islamic Religious Studies", "BA", 4],
  // Basic Medical Sciences
  ["Pharmacology", "BSc", 4], ["Physiology", "BSc", 4],
  ["Medical Laboratory Science", "BSc", 5],
  // Clinical Sciences
  ["Medicine and Surgery", "MBBS", 6], ["Nursing", "BNSc", 5],
  ["Physiotherapy", "BSc", 5], ["Radiography", "BSc", 5],
  ["Dentistry", "BDS", 6],
  // Education
  ["Adult Education", "BEd", 4], ["Education Economics", "BEd", 4],
  ["Business Education", "BEd", 4], ["Education Islamic Religious Studies", "BEd", 4],
  ["Education Igbo", "BEd", 4], ["Education English", "BEd", 4],
  ["Early Childhood Education", "BEd", 4], ["Education Yoruba", "BEd", 4],
  ["Education French", "BEd", 4], ["Education History", "BEd", 4],
  ["Education Christian Religious Studies", "BEd", 4],
  ["Education Geography", "BEd", 4], ["Educational Administration", "BEd", 4],
  ["Educational Foundations", "BEd", 4], ["Health Education", "BEd", 4],
  ["Human Kinetics Education", "BEd", 4], ["Education Biology", "BEd", 4],
  ["Education Chemistry", "BEd", 4], ["Education Home Economics", "BEd", 4],
  ["Integrated Science Education", "BEd", 4], ["Education Mathematics", "BEd", 4],
  ["Education Physics", "BEd", 4], ["Technology Education", "BEd", 4],
  // Engineering
  ["Biomedical Engineering", "BEng", 5], ["Chemical & Petroleum Engineering", "BEng", 5],
  ["Civil & Environmental Engineering", "BEng", 5], ["Computer Engineering", "BEng", 5],
  ["Electrical & Electronics Engineering", "BEng", 5], ["Mechanical Engineering", "BEng", 5],
  ["Metallurgical & Material Engineering", "BEng", 5],
  ["Surveying & Geoinformatics Engineering", "BEng", 5], ["Systems Engineering", "BEng", 5],
  // Environmental Sciences
  ["Architecture", "BSc", 5], ["Building", "BSc", 5], ["Estate Management", "BSc", 5],
  ["Quantity Surveying", "BSc", 5], ["Urban & Regional Planning", "BSc", 5],
  // Law
  ["Law", "LLB", 5],
  // Management Sciences
  ["Accounting", "BSc", 4], ["Actuarial Science", "BSc", 4], ["Insurance", "BSc", 4],
  ["Business Administration", "BSc", 4], ["Finance", "BSc", 4],
  ["Industrial Relations & Personnel Management", "BSc", 4],
  // Pharmacy
  ["Pharmacy", "PharmD", 6],
  // Science
  ["Botany", "BSc", 4], ["Cell Biology & Genetics", "BSc", 4], ["Chemistry", "BSc", 4],
  ["Computer Science", "BSc", 4], ["Geology", "BSc", 4], ["Geophysics", "BSc", 4],
  ["Marine Biology", "BSc", 4], ["Fisheries", "BSc", 4], ["Mathematics", "BSc", 4],
  ["Industrial Mathematics", "BSc", 4], ["Statistics", "BSc", 4],
  ["Microbiology", "BSc", 4], ["Physics", "BSc", 4], ["Zoology", "BSc", 4],
  // Social Sciences
  ["Economics", "BSc", 4], ["Geography", "BSc", 4], ["Mass Communication", "BSc", 4],
  ["Political Science", "BSc", 4], ["Psychology", "BSc", 4], ["Social Work", "BSc", 4],
  ["Sociology", "BSc", 4],
];


/// NUC CCMAS core for BSc Computer Science, 100 level. Sourced from the
/// University of Ibadan's published CCMAS course list; the national core
/// is NUC-mandated so it holds across Nigerian universities. UI's own
/// addition (UI-COS 103) is deliberately excluded — it is not a UNILAG
/// course and would create a community nobody belongs to.
///
/// The source lists 100 level as one block, not split by semester.
/// Split here by the odd/even code convention Nigerian universities use.
/// Inferred, not stated: a wrong semester is visible and correctable on
/// the confirm screen.
const CCMAS_CS_100: { level: string; semester: number; courses: any[][] }[] = [
  { level: "100 Level", semester: 1, courses: [
    ["GST 111", "Communication in English", 2, true, false],
    ["COS 101", "Introduction to Computing Sciences", 3, true, false],
    ["MTH 101", "Elementary Mathematics I (Algebra and Trigonometry)", 2, true, false],
    ["MTH 103", "Elementary Mathematics III (Vectors, Geometry and Dynamics)", 2, false, false],
    ["STA 111", "Descriptive Statistics", 3, true, false],
    ["PHY 101", "General Physics I (Mechanics)", 2, true, false],
    ["PHY 107", "General Practical Physics I", 1, true, false],
  ]},
  { level: "100 Level", semester: 2, courses: [
    ["GST 112", "Nigerian Peoples and Culture", 2, true, false],
    ["COS 102", "Problem Solving", 3, true, false],
    ["MTH 102", "Elementary Mathematics II (Calculus)", 2, true, false],
    ["STA 122", "Statistical Computing I", 3, false, false],
    ["PHY 102", "General Physics II (Electricity and Magnetism)", 2, true, false],
    ["PHY 108", "General Practical Physics II", 1, true, false],
  ]},
];

async function seedProgrammeList(institutionId: string, campusId: string, rows: [string, string, StudyMode][]) {
  for (const [name, award, mode] of rows) {
    const years = mode === StudyMode.FULL_TIME ? 2 : 3;
    await prisma.programme.upsert({
      where: { campusId_name_award_studyMode: { campusId, name, award, studyMode: mode } },
      update: { years, normalisedName: normName(name) },
      create: { institutionId, campusId, name, normalisedName: normName(name), award, studyMode: mode, years },
    });
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

  // Every institution has at least one campus. Where there is only one it
  // is auto-selected in onboarding and never shown.
  const campusOf: Record<string, string> = {};
  for (const inst of INSTITUTIONS) {
    const c = await prisma.campus.upsert({
      where: { institutionId_name: { institutionId: byShortName[inst.shortName], name: "Main Campus" } },
      update: {},
      create: { institutionId: byShortName[inst.shortName], name: "Main Campus", isPrimary: true },
    });
    campusOf[inst.shortName] = c.id;
  }

  // YABATECH runs programmes at Yaba and Epe.
  const yabatechId = byShortName["YABATECH"];
  const yaba = await prisma.campus.upsert({
    where: { institutionId_name: { institutionId: yabatechId, name: "Yaba" } },
    update: { isPrimary: true },
    create: { institutionId: yabatechId, name: "Yaba", isPrimary: true },
  });
  const epe = await prisma.campus.upsert({
    where: { institutionId_name: { institutionId: yabatechId, name: "Epe" } },
    update: {},
    create: { institutionId: yabatechId, name: "Epe" },
  });
  await prisma.campus.deleteMany({ where: { institutionId: yabatechId, name: "Main Campus" } });
  campusOf["YABATECH"] = yaba.id;

  const ndAcc = await prisma.programme.upsert({
    where: { campusId_name_award_studyMode: { campusId: yaba.id, name: "Accountancy", award: "ND", studyMode: StudyMode.FULL_TIME } },
    update: { years: 2, normalisedName: normName("Accountancy") },
    create: { institutionId: yabatechId, campusId: yaba.id, name: "Accountancy", normalisedName: normName("Accountancy"), award: "ND", studyMode: StudyMode.FULL_TIME, years: 2 },
  });
  await seedCurriculum(yabatechId, yaba.id, ndAcc.id, ND_ACCOUNTANCY);

  // Part-time: six semesters, so three years on the ladder.
  await seedProgrammes(yabatechId, yaba.id, YABA_PT_WEEKDAY, "ND", StudyMode.PART_TIME_WEEKDAY, 3);
  await seedProgrammes(yabatechId, epe.id, EPE_PT_WEEKDAY, "ND", StudyMode.PART_TIME_WEEKDAY, 3);
  await seedProgrammes(yabatechId, yaba.id, PT_WEEKEND, "ND", StudyMode.PART_TIME_WEEKEND, 3);
  await seedProgrammes(yabatechId, epe.id, PT_WEEKEND, "ND", StudyMode.PART_TIME_WEEKEND, 3);
  await seedProgrammeList(yabatechId, yaba.id, YABA_TECHNOLOGY);
  await seedProgrammeList(yabatechId, yaba.id, YABA_ENGINEERING);
  await seedProgrammeList(yabatechId, yaba.id, YABA_MANAGEMENT);
  await seedProgrammes(yabatechId, yaba.id, YABA_HND_PT_WEEKDAY, "HND", StudyMode.PART_TIME_WEEKDAY, 3);
  await seedProgrammes(yabatechId, yaba.id, YABA_HND_PT_WEEKEND, "HND", StudyMode.PART_TIME_WEEKEND, 3);
  await seedProgrammes(yabatechId, epe.id, YABA_HND_PT_WEEKEND, "HND", StudyMode.PART_TIME_WEEKEND, 3);
  console.log("YABATECH: technology, engineering, management, ND and HND part-time");
  console.log("YABATECH ND Accountancy: 4 semesters");

  const lasu = byShortName["LASU"];
  const bscCs = await prisma.programme.upsert({
    where: { campusId_name_award_studyMode: { campusId: campusOf["LASU"], name: "Computer Science", award: "BSc", studyMode: StudyMode.FULL_TIME } },
    update: { years: 4, normalisedName: normName("Computer Science") },
    create: { institutionId: lasu, campusId: campusOf["LASU"], name: "Computer Science", normalisedName: normName("Computer Science"), award: "BSc", studyMode: StudyMode.FULL_TIME, years: 4 },
  });
  await seedCurriculum(lasu, campusOf["LASU"], bscCs.id, LASU_CS);

  const unilag = byShortName["UNILAG"];
  for (const [name, award, years] of UNILAG) {
    await prisma.programme.upsert({
      where: { campusId_name_award_studyMode: { campusId: campusOf["UNILAG"], name, award, studyMode: StudyMode.FULL_TIME } },
      update: { years, normalisedName: normName(name) },
      create: { institutionId: unilag, campusId: campusOf["UNILAG"], name, normalisedName: normName(name), award, studyMode: StudyMode.FULL_TIME, years },
    });
  }
  console.log(`UNILAG: ${UNILAG.length} full-time programmes`);

  const unilagCs = await prisma.programme.findFirst({
    where: { campusId: campusOf["UNILAG"], name: "Computer Science", award: "BSc", studyMode: StudyMode.FULL_TIME },
    select: { id: true },
  });
  if (unilagCs) {
    await seedCurriculum(unilag, campusOf["UNILAG"], unilagCs.id, CCMAS_CS_100);
    console.log("UNILAG BSc Computer Science: 100 level (CCMAS core)");
  }
  console.log("LASU BSc Computer Science: 100 and 200 level");

  const courses = await prisma.course.count();
  const entries = await prisma.curriculumEntry.count();
  console.log(`courses: ${courses}, curriculum entries: ${entries}`);
}

main().finally(() => prisma.$disconnect());
