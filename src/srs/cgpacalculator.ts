import { JSDOM } from "jsdom";
import fetch from "node-fetch";
import { CGPACalculation, CGPACalculationRequestData } from "./interface";

const parseCalculation = (dom: JSDOM): CGPACalculation => {
  const data = [
    ...dom.window.document.querySelectorAll(
      "div.container > div.row div.panel.panel-default > div.panel-body > table.table.table-hover.table-striped > tbody > tr > td"
    ),
  ].map(({ textContent }) => textContent || "");

  return {
    gpa: parseFloat(data[0]),
    cgpa: parseFloat(data[1]),
    standing: data[2],
    credits: {
      semesterTotal: parseFloat(data[3]),
      previousTotal: parseFloat(data[4]),
      grandTotal: parseFloat(data[5]),
    },
    points: {
      semesterTotal: parseFloat(data[6]),
      previousTotal: parseFloat(data[7]),
      grandTotal: parseFloat(data[8]),
    },
  };
};

/**
 * Provides the functionality of https://stars.bilkent.edu.tr/srs-v2/tools/cgpa-calculator
 *
 * @param cookie A valid Bilkent SRS session cookie (`PHPSESSID=...`)
 * @param courses The list of courses and grades for which to calculate
 * @returns The parsed calculation object
 */
export const calculateGPA = async (cookie: string, courses: CGPACalculationRequestData): Promise<CGPACalculation> => {
  const response = await fetch("https://stars.bilkent.edu.tr/srs-v2/tools/cgpa-calculator", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: cookie,
    },
    body: courses
      .map(
        ({ course: { department, number, section }, grade }) => `courses[${department}_${number}_${section}]=${grade}`
      )
      .join("&"),
  });

  if (response.status !== 200) throw Error("Unauthenticated request! Cookie may be invalid.");
  return parseCalculation(new JSDOM(await response.text()));
};
