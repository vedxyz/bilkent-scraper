export interface CourseOfferingScheduleData {
  /**
   * Day of this schedule timepoint, where `0` is Monday and `6` is Sunday.
   */
  day: number;
  time: {
    start: string;
    end: string;
  };
  location: string;
}

export interface CourseOfferingSectionData {
  section: string;
  instructor: string;
  quota: {
    /**
     * `true` if mandatory and elective quotas are joint, otherwise `false`.
     */
    indifferent: boolean;
    /**
     * `mandatory + elective` when `indifferent` is `false`,
     * otherwise all three values should be equal.
     */
    total: number;
    mandatory: number;
    elective: number;
  };
  schedule: CourseOfferingScheduleData[];
}

export interface CourseOffering {
  /**
   * Course code, such as *CS 101*.
   */
  code: string;
  /**
   * Full name for the course, such as *Algorithms and Programming I*.
   */
  name: string;
  sections: CourseOfferingSectionData[];
}

export interface DepartmentOfferingsData {
  /**
   * The date (UTC) from when this offerings data was scraped.
   */
  dateFetched: Date;
  offerings: CourseOffering[];
}

export enum SemesterType {
  Fall = 1,
  Spring = 2,
  Summer = 3,
}

export enum Department {
  ACC = "ACC",
  ADA = "ADA",
  AMER = "AMER",
  ARCH = "ARCH",
  BF = "BF",
  BTE = "BTE",
  CHEM = "CHEM",
  CI = "CI",
  CINT = "CINT",
  COMD = "COMD",
  CS = "CS",
  CTE = "CTE",
  CTIS = "CTIS",
  ECON = "ECON",
  EDEB = "EDEB",
  EEE = "EEE",
  EEPS = "EEPS",
  ELIT = "ELIT",
  ELS = "ELS",
  EMBA = "EMBA",
  ENG = "ENG",
  ETE = "ETE",
  FA = "FA",
  FRP = "FRP",
  GE = "GE",
  GRA = "GRA",
  HART = "HART",
  HCIV = "HCIV",
  HIST = "HIST",
  HUM = "HUM",
  IAED = "IAED",
  IE = "IE",
  IELTS = "IELTS",
  IR = "IR",
  LAUD = "LAUD",
  LAW = "LAW",
  LNG = "LNG",
  MAN = "MAN",
  MATH = "MATH",
  MBA = "MBA",
  MBG = "MBG",
  ME = "ME",
  MIAPP = "MIAPP",
  MSC = "MSC",
  MSN = "MSN",
  MTE = "MTE",
  MUS = "MUS",
  NSC = "NSC",
  PE = "PE",
  PHIL = "PHIL",
  PHYS = "PHYS",
  POLS = "POLS",
  PREP = "PREP",
  PSYC = "PSYC",
  SFL = "SFL",
  SOC = "SOC",
  TE = "TE",
  TEFL = "TEFL",
  THEA = "THEA",
  THM = "THM",
  THR = "THR",
  TOEFL = "TOEFL",
  TRIN = "TRIN",
  TURK = "TURK",
}

export interface OfferingsQuery {
  department: Department, year: number, semesterType: SemesterType
}
