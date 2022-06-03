import { JSDOM } from "jsdom";
import { requestSRS } from "./auth";
import { SRSCourse, SRSCourseGrades, SRSGradeItem, SRSSemester } from "./interface";

const parseGrades = (dom: JSDOM): SRSCourseGrades[] =>
  [...dom.window.document.querySelectorAll(".gradeDiv")].map((div) => {
    const categoryTable: { [key: string]: SRSGradeItem[] } = {};
    [...div.querySelectorAll("tbody > tr")]
      .slice(1)
      .filter((row) => row.childElementCount === 5)
      .forEach((row) => {
        const categoryType = row.children[1]?.textContent?.trim() ?? "Unknown";
        if (categoryTable[categoryType] === undefined) categoryTable[categoryType] = [];

        categoryTable[categoryType].push({
          title: row.children[0]?.textContent?.trim() ?? "N/A",
          date: row.children[2]?.textContent?.trim() ?? "N/A",
          grade: row.children[3]?.textContent?.trim() ?? "N/A",
          comment: row.children[4]?.textContent?.trim() ?? "",
        });
      });

    return {
      title: div.firstElementChild?.textContent?.trim().substring("Grade Records for ".length) ?? "N/A",
      categories: Object.entries(categoryTable).map(([type, items]) => ({ type, items })),
    };
  });

export const getGrades = async (
  cookie: string,
  semester?: SRSSemester,
  course?: SRSCourse
): Promise<SRSCourseGrades[]> => {
  if (!semester && course) throw Error("Cannot search for a course with no semester provided");
  const content = await requestSRS(
    `https://stars.bilkent.edu.tr/srs/ajax/gradeAndAttend/grade.php?${
      semester ? `semester=${semester.year}${semester.season}` : ""
    }${course ? `&course=${course.department} ${course.number}-${course.section}` : ""}`,
    cookie
  );
  return parseGrades(new JSDOM(content));
};
