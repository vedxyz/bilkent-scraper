import { SemesterType } from "../offerings/interface";

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

