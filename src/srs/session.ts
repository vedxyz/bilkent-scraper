/* eslint-disable import/prefer-default-export */

import { CGPACalculation, SRSCourse, SRSGrades, SRSSemester, SRSSemesterCourses } from "./interface";
import { getCurrentSemester, getSemester } from "./semester";

export class SRSSession {
  readonly cookie: string;

  constructor(cookie: string) {
    this.cookie = cookie;
  }

  async getSemester(semester?: SRSSemester): Promise<SRSSemesterCourses> {
    if (semester) return getSemester(this.cookie, semester);
    return getCurrentSemester(this.cookie);
  }
}
