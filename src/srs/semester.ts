import { JSDOM } from "jsdom";
import { SemesterType } from "../offerings/interface";
import { requestSRS } from "./auth";
import { SRSSemester, SRSSemesterCourses } from "./interface";

const parseSemester = (dom: JSDOM): SRSSemesterCourses => {
  const { body } = dom.window.document;
  const tableId = body.querySelector("#coursesMenu") !== null ? "#coursesMenu" : "#backSemesterCourses";
  const rows = [...body.querySelectorAll(`${tableId} > tbody > tr`)];

  const semesterMatch = body
    .querySelector(`${tableId} > caption:first-child`)
    ?.textContent?.match(/(\d{4})-\d{4}\s*(Spring|Fall|Summer)/);
  if (!semesterMatch) throw Error("No semester text matched");
  const semester: SRSSemester = {
    year: semesterMatch[1],
    season: SemesterType[semesterMatch[2] as keyof typeof SemesterType],
  };

  const courses: SRSSemesterCourses["courses"] = rows.map((row) => {
    const children = [...row.children];
    const courseCodeCell = children[0];
    const courseNameCell = children[1];
    const instructorCell = children[2];
    const creditsCell = children[3];
    const typeCell = children[5];

    const [department, number, section] = courseCodeCell.textContent?.split(/ |-/) ?? ["", "", ""];

    return {
      code: {
        department,
        number,
        section,
      },
      name: courseNameCell.textContent ?? "",
      instructor: instructorCell.textContent?.trim() ?? "",
      credits: creditsCell.textContent ?? "-",
      type: typeCell.textContent ?? "??",
    };
  });

  return { semester, courses };
};

export const getCurrentSemester = async (cookie: string): Promise<SRSSemesterCourses> => {
  const response = await requestSRS("https://stars.bilkent.edu.tr/srs/ajax/courses.php", cookie);
  return parseSemester(new JSDOM(await response.text()));
};

export const getSemester = async (cookie: string, semester: SRSSemester): Promise<SRSSemesterCourses> => {
  const response = await requestSRS(
    `https://stars.bilkent.edu.tr/srs/ajax/semester.info.php?semester=${semester.year}${semester.season}`,
    cookie
  );
  return parseSemester(new JSDOM(await response.text()));
};
