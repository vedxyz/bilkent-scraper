import { SemesterType } from "../offerings";

export interface SRS2FACode {
  code: string;
  ref: string;
}

export interface SRSLoginRequest {
  cookie: string;
  reference: string;
}

export interface SRSCourse {
  department: string;
  number: string;
  section: string;
}

export interface SRSSemester {
  year: string;
  season: SemesterType;
}

export interface SRSSemesterCourses {
  semester: SRSSemester;
  courses: {
    code: SRSCourse;
    name: string;
    instructor: string;
    credits: string;
    type: string;
  }[];
}

export type SRSGrades = "A" | "A-" | "B+" | "B" | "B-" | "C+" | "C" | "C-" | "D+" | "D" | "F";

export type CGPACalculationRequestData = { course: SRSCourse; grade: SRSGrades }[];

export interface CGPACalculation {
  gpa: number;
  cgpa: number;
  standing: string;
  credits: {
    semesterTotal: number;
    previousTotal: number;
    grandTotal: number;
  };
  points: {
    semesterTotal: number;
    previousTotal: number;
    grandTotal: number;
  };
}
