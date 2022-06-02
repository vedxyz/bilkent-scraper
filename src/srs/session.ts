import { get2FACode, initializeLogin, verifyEmail } from "./auth";
import { calculateGPA } from "./cgpacalculator";
import { getExams } from "./exam";
import { getWeeklySchedule } from "./schedule";
import { getCurrentSemester, getSemester } from "./semester";

class SRSSessionInternal {
  readonly cookie: string;

  constructor(cookie: string) {
    this.cookie = cookie;
  }

  async getSemester(semester?: SRSSemester): Promise<SRSSemesterCourses> {
    if (semester) return getSemester(this.cookie, semester);
    return getCurrentSemester(this.cookie);
  }

  async calculateGPA(courses: { course: SRSCourse; grade: SRSLetterGrade }[]): Promise<CGPACalculation> {
    return calculateGPA(this.cookie, courses);
  }

  async getExams() {
    return getExams(this.cookie);
  }

  async getWeeklySchedule() {
    return getWeeklySchedule(this.cookie);
  }
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface SRSSession extends SRSSessionInternal {}

export const SRSSessionBuilder = {
  withCookie: (cookie: string): SRSSession => new SRSSessionInternal(cookie),
  withManualVerification: async (
    id: string,
    password: string
  ): Promise<{ reference: string; verify: (verificationCode: string) => Promise<SRSSession> }> => {
    const loginRequest = await initializeLogin(id, password);
    return {
      reference: loginRequest.reference,
      verify: async (verificationCode) => {
        const cookie = await verifyEmail(loginRequest.cookie, verificationCode);
        return new SRSSessionInternal(cookie);
      },
    };
  },
  withAutomatedVerification: async (
    id: string,
    password: string,
    email: string,
    emailPassword: string,
    boxname = "STARS Auth"
  ): Promise<SRSSession> => {
    const loginRequest = await initializeLogin(id, password);
    const verificationCode = await get2FACode(email, emailPassword, boxname);
    if (loginRequest.reference !== verificationCode.ref)
      throw Error(
        `Reference code mismatch during automated verification (${loginRequest.reference} != ${verificationCode.code})`
      );
    const cookie = await verifyEmail(loginRequest.cookie, verificationCode.code);
    return new SRSSessionInternal(cookie);
  },
};
