import { requestImageSRS } from "./auth";
import { SRSCourse, SRSSemester } from "./interface";

/**
 * Provides the contents of https://stars.bilkent.edu.tr/srs/ajax/stats/letter-grade-bar.php?params={year}{season}_{department}_{courseNumber}
 *
 * @param cookie A valid Bilkent SRS session cookie (`PHPSESSID=...`)
 * @param semester The semester for which to query statistics
 * @param course The course for which to retrieve statistics
 * @returns The statistics image, encoded as a base64 string
 */
export const getLetterGradeStatistics = async (
  cookie: string,
  { season, year }: SRSSemester,
  course: Omit<SRSCourse, "section">
): Promise<string> =>
  requestImageSRS(
    `https://stars.bilkent.edu.tr/srs/ajax/stats/letter-grade-bar.php?params=${year}${season}_${course.department}_${course.number}`,
    cookie
  );
