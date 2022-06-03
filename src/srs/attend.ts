/* eslint-disable import/prefer-default-export */
import { JSDOM } from "jsdom";
import { requestSRS } from "./auth";
import { SRSCourse, SRSCourseAttendance, SRSSemester } from "./interface";

const parseAttendance = (dom: JSDOM): SRSCourseAttendance[] =>
  [...dom.window.document.querySelectorAll(".attendDiv")].map((div) => ({
    title: div.firstElementChild?.textContent?.trim().substring("Attendance Records for ".length) ?? "N/A",
    data: [...div.querySelectorAll("tbody > tr")].slice(1).map((row) => ({
      title: row.children.item(0)?.textContent?.trim() ?? "N/A",
      date: row.children.item(1)?.textContent?.trim() ?? "N/A",
      attendance: row.children.item(2)?.textContent?.trim() ?? "N/A",
    })),
    ratio: div.querySelector("div > table + div")?.textContent?.trim().substring("Attendance Ratio: ".length) ?? "N/A",
  }));

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
