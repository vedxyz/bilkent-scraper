/* eslint-disable import/prefer-default-export */
import { JSDOM } from "jsdom";
import { SemesterType } from "../offerings";
import { requestSRS } from "./auth";
import {
  SRSCurriculum,
  SRSCurriculumCourseItem,
  SRSCurriculumSemester,
  SRSLetterGrade,
  SRSSemester,
} from "./interface";

const parseCurriculum = (dom: JSDOM): SRSCurriculum =>
  [...dom.window.document.querySelectorAll("table.printMod")].slice(2, -2).map(
    (table): SRSCurriculumSemester =>
      [...table.querySelectorAll("tbody > tr")].slice(1).map((row): SRSCurriculumCourseItem => {
        const [department, number] = row.children.item(0)?.textContent?.trim().split(" ") ?? [];

        const [match, year, season] = row.children
          .item(5)
          ?.textContent?.trim()
          .match(/(\d{4})-\d{4}\W(Fall|Spring|Summer)/) ?? [null];

        const [matchReplacement, replacementDepartment, replacementNumber, replacementName] =
          row.children
            .item(6)
            ?.textContent?.trim()
            .match(/([A-Z]+)\W(\d+)\W(.*)\W?/) ?? [];

        return {
          course: department
            ? {
                department,
                number,
              }
            : "N/A",
          name: row.children.item(1)?.textContent?.trim() ?? "N/A",
          status: row.children.item(2)?.textContent?.trim() as SRSCurriculumCourseItem["status"],
          grade: (row.children.item(3)?.textContent?.trim() as SRSLetterGrade) ?? "N/A",
          credits: row.children.item(4)?.textContent?.trim() ?? "N/A",
          semester:
            match !== null
              ? ({
                  year,
                  season: SemesterType[season as keyof typeof SemesterType],
                } as SRSSemester)
              : match,
          replacement: matchReplacement
            ? {
                course: {
                  department: replacementDepartment,
                  number: replacementNumber,
                },
                name: replacementName,
              }
            : undefined,
        };
      })
  );

export const getCurriculum = async (cookie: string): Promise<SRSCurriculum> => {
  const content = await requestSRS("https://stars.bilkent.edu.tr/srs/ajax/curriculum.php", cookie);
  return parseCurriculum(new JSDOM(content));
};
