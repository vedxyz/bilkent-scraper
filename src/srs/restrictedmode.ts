import { JSDOM } from "jsdom";
import fetch from "node-fetch";
import { SRSLetterGrade, SRSLetterGradeResults } from "./interface";

const parseSRSRestriction = (dom: JSDOM): boolean =>
  dom.window.document.querySelector("#wrapper > div.info")?.textContent?.includes("SRS is in restricted mode") ?? false;

export const isSRSRestricted = async (): Promise<boolean> => {
  const response = await fetch("https://stars.bilkent.edu.tr/srs/");
  return parseSRSRestriction(new JSDOM(await response.text()));
};

const parseLetterGrades = (dom: JSDOM): SRSLetterGradeResults =>
  [...dom.window.document.querySelectorAll("#wrapper > fieldset > table > tbody > tr")].map((row) => ({
    course: row.children[0]?.textContent ?? "",
    grade: (row.children[1]?.textContent as SRSLetterGrade) ?? "N/A",
  }));

export const getLetterGrades = async (id: string, password: string): Promise<SRSLetterGradeResults> => {
  const response = await fetch("https://stars.bilkent.edu.tr/srs/index.php", {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: `user_id=${id}&password=${password}`,
  });

  return parseLetterGrades(new JSDOM(await response.text()));
};
