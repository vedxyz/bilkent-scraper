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

export class SRSSession {
  /**
   * The valid Bilkent SRS session cookie (`PHPSESSID=...`) using which
   * all requests made from this session instance are made.
   */
  readonly cookie: string;

  /**
   * **You may not need to call this contructor directly.**
   *
   * See one of the static factory methods instead.
   *
   * @see {@link withManualVerification}
   * @see {@link withAutomatedVerification}
   * @param cookie A valid Bilkent SRS session cookie (`PHPSESSID=...`)
   */
  constructor(cookie: string) {
    this.cookie = cookie;
  }

  /**
   * Allows you to authenticate with SRS the typical way,
   * by **manually** providing a verification code received as SMS/email.
   *
   * The reference code for the verification code is returned
   * along with a `verify` function to submit the corresponding verification code.
   *
   * @see {@link withAutomatedVerification} for an alternative
   * @param id Bilkent Student ID
   * @param password Bilkent SRS password
   * @returns A verification function to obtain the final session instance
   */
  static async withManualVerification(
    id: string,
    password: string
  ): Promise<{ reference: string; verify: (verificationCode: string) => Promise<SRSSession> }> {
    const loginRequest = await initializeLogin(id, password);
    return {
      reference: loginRequest.reference,
      verify: async (verificationCode) => {
        const cookie = await verifyEmail(loginRequest.cookie, verificationCode);
        return new SRSSession(cookie);
      },
    };
  }

  /**
   * Allows you to authenticate with SRS fully automatically,
   * by also providing email credentials to retrieve the verification code with ({@link get2FACode}).
   *
   * **In order to use this authentication flow, some prior configuration is required.**
   * The SRS user must have set up a mail filter to direct all verification codes to a specific mailbox/folder.
   * See package documentation for more details.
   *
   * @see {@link withManualVerification} for an alternative
   * @param id Bilkent student ID
   * @param password Bilkent SRS password
   * @param email Bilkent email address (where authentication codes are sent)
   * @param emailPassword Password for the email address
   * @param boxname The mailbox/folder containing SRS authentication codes (defaults to "STARS Auth")
   * @returns An authenticated SRS session
   */
  static async withAutomatedVerification(
    id: string,
    password: string,
    email: string,
    emailPassword: string,
    boxname = "STARS Auth"
  ): Promise<SRSSession> {
    const loginRequest = await initializeLogin(id, password);
    const verificationCode = await get2FACode(email, emailPassword, boxname);
    if (loginRequest.reference !== verificationCode.ref)
      throw Error(
        `Reference code mismatch during automated verification (${loginRequest.reference} != ${verificationCode.code})`
      );
    const cookie = await verifyEmail(loginRequest.cookie, verificationCode.code);
    return new SRSSession(cookie);
  }

  /**
   * @see {@link getSemester}
   */
  async getSemester(semester?: SRSSemester) {
    if (semester) return getSemester(this.cookie, semester);
    return getCurrentSemester(this.cookie);
  }

  /**
   * @see {@link calculateGPA}
   */
  async calculateGPA(courses: CGPACalculationRequestData) {
    return calculateGPA(this.cookie, courses);
  }

  /**
   * @see {@link getExams}
   */
  async getExams() {
    return getExams(this.cookie);
  }

  /**
   * @see {@link getWeeklySchedule}
   */
  async getWeeklySchedule() {
    return getWeeklySchedule(this.cookie);
  }

  /**
   * @see {@link getLetterGradeStatistics}
   */
  async getLetterGradeStatistics(semester: SRSSemester, course: Omit<SRSCourse, "section">) {
    return getLetterGradeStatistics(this.cookie, semester, course);
  }

  /**
   * @see {@link getInfoCard}
   */
  async getInfoCard() {
    return getInfoCard(this.cookie);
  }

  /**
   * @see {@link getGrades}
   */
  async getGrades(semester?: SRSSemester, course?: SRSCourse) {
    return getGrades(this.cookie, semester, course);
  }

  /**
   * @see {@link getAttendance}
   */
  async getAttendance(semester?: SRSSemester, course?: SRSCourse) {
    return getAttendance(this.cookie, semester, course);
  }

  /**
   * @see {@link getCurriculum}
   */
  async getCurriculum() {
    return getCurriculum(this.cookie);
  }

  /**
   * @see {@link getTranscript}
   */
  async getTranscript() {
    return getTranscript(this.cookie);
  }
}
