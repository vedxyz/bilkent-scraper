import { JSDOM } from "jsdom";
import { SemesterType } from "../offerings";
import { requestSRS } from "./auth";
import { SRSLetterGrade, SRSTranscript, SRSTranscriptSemester } from "./interface";

const parseTranscript = (dom: JSDOM): SRSTranscript =>
  [...dom.window.document.querySelectorAll("table.printMod")].slice(3).map((table): SRSTranscriptSemester => {
    const rows = [...(table.firstElementChild?.children ?? [])];
    const gpaTableRows = [...rows.slice(-3, -2)[0].querySelectorAll("td:first-child table:first-child > tbody > tr")];
    const [, year, seasonText] = rows[0]?.textContent?.trim().match(/(\d{4})-\d{4}\W(Fall|Spring|Summer)/) as [
      never,
      string,
      keyof typeof SemesterType
    ];

    return {
      semester: {
        year,
        season: SemesterType[seasonText],
      },
      gpa: gpaTableRows[0].lastElementChild?.textContent?.trim() ?? "N/A",
      cgpa: gpaTableRows[1].lastElementChild?.textContent?.trim() ?? "N/A",
      standing: gpaTableRows[2].lastElementChild?.textContent?.trim() ?? "N/A",
      courses: rows.slice(2, -3).map((row): SRSTranscriptSemester["courses"][number] => {
        const [department, number] = row.children[0]?.textContent?.trim().split(" ") as [string, string];
        return {
          course: {
            department,
            number,
          },
          name: row.children[1]?.textContent?.trim() ?? "N/A",
          grade: (row.children[2]?.textContent?.trim() as SRSLetterGrade) ?? "N/A",
          credits: row.children[3]?.textContent?.trim() ?? "N/A",
        };
      }),
    };
  });

/**
 * Provides the contents of https://stars.bilkent.edu.tr/srs/ajax/transcript.php
 *
 * The credit and point sums are omitted.
 *
 * @param cookie A valid Bilkent SRS session cookie (`PHPSESSID=...`)
 * @returns The parsed transcript object
 */
export const getTranscript = async (cookie: string): Promise<SRSTranscript> => {
  const content = await requestSRS("https://stars.bilkent.edu.tr/srs/ajax/transcript.php", cookie);
  return parseTranscript(new JSDOM(content));
};
