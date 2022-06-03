import { JSDOM } from "jsdom";
import { requestSRS } from "./auth";
import { SRSCourse, SRSCourseAttendance, SRSSemester } from "./interface";

const parseAttendance = (dom: JSDOM): SRSCourseAttendance[] =>
  [...dom.window.document.querySelectorAll(".attendDiv")].map((div) => ({
    title: div.firstElementChild?.textContent?.trim().substring("Attendance Records for ".length) ?? "N/A",
    data: [...div.querySelectorAll("tbody > tr")].slice(1).map((row) => ({
      title: row.children[0]?.textContent?.trim() ?? "N/A",
      date: row.children[1]?.textContent?.trim() ?? "N/A",
      attendance: row.children[2]?.textContent?.trim() ?? "N/A",
    })),
    ratio: div.querySelector("div > table + div")?.textContent?.trim().substring("Attendance Ratio: ".length) ?? "N/A",
  }));

/**
 * Provides the contents of https://stars.bilkent.edu.tr/srs/ajax/gradeAndAttend/attend.php?semester={year}{season}&course={department}%20{number}-{section}
 *
 * This endpoint returns all data for the current semester if all parameters are omitted.
 * Semester given alone returns all data points for that semester.
 * A course can be added to filter a semester.
 *
 * **Do NOT call this function with no semester if you provide a course**
 *
 * @param cookie A valid Bilkent SRS session cookie (`PHPSESSID=...`)
 * @param semester The semester to query (defaults to current semester)
 * @param course A course to filter output for (defaults to all courses)
 * @returns The parsed attendance object
 */
export const getAttendance = async (
  cookie: string,
  semester?: SRSSemester,
  course?: SRSCourse
): Promise<SRSCourseAttendance[]> => {
  if (!semester && course) throw Error("Cannot search for a course with no semester provided");
  const content = await requestSRS(
    `https://stars.bilkent.edu.tr/srs/ajax/gradeAndAttend/attend.php?${
      semester ? `semester=${semester.year}${semester.season}` : ""
    }${course ? `&course=${course.department} ${course.number}-${course.section}` : ""}`,
    cookie
  );
  return parseAttendance(new JSDOM(content));
};
