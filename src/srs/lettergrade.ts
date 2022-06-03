
import { requestImageSRS } from "./auth";
import { SRSCourse, SRSSemester } from "./interface";

export const getLetterGradeStatistics = async (
  cookie: string,
  { season, year }: SRSSemester,
  course: Omit<SRSCourse, "section">
): Promise<string> =>
  requestImageSRS(
    `https://stars.bilkent.edu.tr/srs/ajax/stats/letter-grade-bar.php?params=${year}${season}_${course.department}_${course.number}`,
    cookie
  );
