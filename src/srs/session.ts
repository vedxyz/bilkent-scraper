import { get2FACode, initializeLogin, verifyEmail } from "./auth";
import { calculateGPA } from "./cgpacalculator";
import { getExams } from "./exam";
import { CGPACalculationRequestData, SRSCourse, SRSSemester } from "./interface";
import { getLetterGradeStatistics } from "./lettergrade";
import { getWeeklySchedule } from "./schedule";
import { getCurrentSemester, getSemester } from "./semester";
import { getInfoCard } from "./infocard";
import { getGrades } from "./grade";
import { getAttendance } from "./attend";
import { getCurriculum } from "./curriculum";
import { getTranscript } from "./transcript";

class SRSSessionInternal {
  readonly cookie: string;

  constructor(cookie: string) {
    this.cookie = cookie;
  }

  async getSemester(semester?: SRSSemester) {
    if (semester) return getSemester(this.cookie, semester);
    return getCurrentSemester(this.cookie);
  }

  async calculateGPA(courses: CGPACalculationRequestData) {
    return calculateGPA(this.cookie, courses);
  }

  async getExams() {
    return getExams(this.cookie);
  }

  async getWeeklySchedule() {
    return getWeeklySchedule(this.cookie);
  }

  async getLetterGradeStatistics(semester: SRSSemester, course: Omit<SRSCourse, "section">) {
    return getLetterGradeStatistics(this.cookie, semester, course);
  }

  async getInfoCard() {
    return getInfoCard(this.cookie);
  }

  async getGrades(semester?: SRSSemester, course?: SRSCourse) {
    return getGrades(this.cookie, semester, course);
  }

  async getAttendance(semester?: SRSSemester, course?: SRSCourse) {
    return getAttendance(this.cookie, semester, course);
  }

  async getCurriculum() {
    return getCurriculum(this.cookie);
  }

  async getTranscript() {
    return getTranscript(this.cookie);
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
