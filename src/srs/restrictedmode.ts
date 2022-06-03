import { JSDOM } from "jsdom";
import fetch from "node-fetch";
import { SRSLetterGrade, SRSLetterGradeResults } from "./interface";

const parseSRSRestriction = (dom: JSDOM): boolean =>
  dom.window.document.querySelector("#wrapper > div.info")?.textContent?.includes("SRS is in restricted mode") ?? false;

/**
 * Bilkent SRS switches to a different flow when semester letter grades are being announced.
 * In the minutes leading to the announcement, SRS is locked down completely.
 * As such, this function can help to determine whether letter grades are about to be announced.
 * @returns `true` if SRS is restricted
 */
export const isSRSRestricted = async (): Promise<boolean> => {
  const response = await fetch("https://stars.bilkent.edu.tr/srs/");
  return parseSRSRestriction(new JSDOM(await response.text()));
};

const parseLetterGrades = (dom: JSDOM): SRSLetterGradeResults =>
  [...dom.window.document.querySelectorAll("#wrapper > fieldset > table > tbody > tr")].map((row) => ({
    course: row.children[0]?.textContent ?? "",
    grade: (row.children[1]?.textContent as SRSLetterGrade) ?? "N/A",
  }));

/**
 * Bilkent SRS switches to a different flow when semester letter grades are being announced.
 * This function provides the letter grades if they are currently being announced.
 *
 * @see {@link isSRSRestricted}
 * @param id Bilkent student ID
 * @param password Bilkent SRS password
 * @returns The letter grades for each course
 */
export const getLetterGrades = async (id: string, password: string): Promise<SRSLetterGradeResults> => {
  const response = await fetch("https://stars.bilkent.edu.tr/srs/index.php", {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: `user_id=${id}&password=${password}`,
  });

  return parseLetterGrades(new JSDOM(await response.text()));
};
