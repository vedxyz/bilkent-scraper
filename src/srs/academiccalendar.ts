import { JSDOM } from "jsdom";
import fetch from "node-fetch";
import { AcademicCalendar, AcademicCalendarItem } from "./interface";

const getEventType = (td: Element | null): AcademicCalendarItem["type"] => {
  switch (td?.firstElementChild?.className) {
    case "oim":
      return "studentaffairs";
    case "tatil":
      return "vacation";
    case "idmyo":
      return "englishprep";
    default:
      return undefined;
  }
};

const parseAcademicCalendar = (dom: JSDOM): AcademicCalendar =>
  [...dom.window.document.querySelectorAll("tbody > tr")].map((row) => ({
    date: row.children[0]?.textContent?.trim().replace("\n", "") ?? "N/A",
    event: row.children[1]?.textContent?.trim() ?? "N/A",
    type: getEventType(row.children[1]),
  }));

export const getAcademicCalendar = async (): Promise<AcademicCalendar> => {
  const response = await fetch("https://w3.bilkent.edu.tr/bilkent/academic-calendar/");
  return parseAcademicCalendar(new JSDOM(await response.text()));
};
