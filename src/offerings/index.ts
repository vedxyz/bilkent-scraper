/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable no-multi-assign */
import { JSDOM } from "jsdom";
import fetch from "node-fetch";
import fs from "fs/promises";
import path from "path";
import { CourseOfferingSectionData, DepartmentOfferingsData, OfferingsQuery } from "./interface";

const parseQuota = (quotaString: string): CourseOfferingSectionData["quota"] => {
  let quotaIndifferent: boolean;
  let quotaTotal: number;
  let quotaMandatory: number;
  let quotaElective: number;

  if (quotaString.indexOf("or") !== -1) {
    quotaIndifferent = true;
    quotaTotal = quotaMandatory = quotaElective = parseInt(quotaString.match(/(\d+) Mand/)![1], 10);
  } else if (quotaString.indexOf("Unlimited") !== -1) {
    quotaIndifferent = true;
    quotaTotal = quotaMandatory = quotaElective = Infinity;
  } else {
    const [, mandatory, elective] = quotaString.match(/(\d+) Mand\. (\d+) Elect\./) as RegExpMatchArray;
    quotaIndifferent = false;
    quotaMandatory = parseInt(mandatory, 10);
    quotaElective = parseInt(elective, 10);
    quotaTotal = quotaMandatory + quotaElective;
  }

  return {
    indifferent: quotaIndifferent,
    total: quotaTotal,
    mandatory: quotaMandatory,
    elective: quotaElective,
  };
};

const parseSchedule = (scheduleString: string): CourseOfferingSectionData["schedule"] =>
  scheduleString === ""
    ? []
    : scheduleString
        .split("\n")
        .slice(0, -1)
        .map((date) => {
          const [day, timeframe, location] = date.trim().split(" ");
          const [start, end] = timeframe.split("-");
          return {
            day: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(day),
            time: {
              start,
              end,
            },
            location: location?.slice(1, -1),
          };
        });

/**
 * Scrape offerings anew.
 *
 * @param query Offerings being scraped
 * @returns The offerings data for a given query
 */
export const getOfferings = async ({
  department,
  year,
  semesterType,
}: OfferingsQuery): Promise<DepartmentOfferingsData> => {
  const page = await fetch(
    `https://stars.bilkent.edu.tr/homepage/ajax/plainOfferings.php?COURSE_CODE=${department}&SEMESTER=${year}${semesterType}`
  );
  const rows = new JSDOM(await page.text()).window.document.body.querySelectorAll("#poTable > tbody tr");

  const offeringsObj: DepartmentOfferingsData = { dateFetched: new Date(), offerings: [] };

  rows.forEach((row) => {
    const columns = [
      row.querySelector("td:nth-child(1)"),
      row.querySelector("td:nth-child(2)"),
      row.querySelector("td:nth-child(3)"),
    ] as Element[];
    const column8 = row.querySelector("td:nth-child(8)") as Element;
    const column15 = row.querySelector("td:nth-child(15)") as Element;
    [...columns, column8, column15].forEach((column) => {
      if (column === null) throw new Error("Element query returned null");
    });

    const [courseCode, section] = columns[0].textContent!.split("-");
    const instructor =
      row.querySelector("td:nth-child(3) > span:first-child > div:first-child")?.textContent ||
      columns[2].textContent ||
      "";

    let course = offeringsObj.offerings.find((offering) => offering.code === courseCode);

    if (course === undefined) {
      course = {
        code: courseCode,
        name: columns[1].textContent ?? "",
        sections: [],
      };
      offeringsObj.offerings.push(course);
    }

    course.sections.push({
      section,
      instructor,
      quota: parseQuota(column8.textContent!),
      schedule: parseSchedule(column15.textContent!),
    });
  });

  return offeringsObj;
};

/**
 * Export an existing offerings object to JSON.
 *
 * @param offerings Existing offerings data
 * @param prettify Save JSON with indentation
 * @param filePath Full file path to export to
 */
export const exportOfferingsToJSON = async (
  offerings: DepartmentOfferingsData,
  prettify: boolean,
  filePath: string
): Promise<void> => {
  await fs.writeFile(filePath, JSON.stringify(offerings, null, prettify ? 2 : 0), {
    encoding: "utf-8",
  });
};

/**
 * Scrape and save offerings to a JSON file.
 *
 * Leaving `filename` undefined will get you a sensible filename generated.
 * This may be preferable.
 *
 * @param query Offerings being scraped
 * @param prettify Save JSON with indentation
 * @param directory JSON file will be saved here
 * @param filename Specify own name, or leave blank for a generated name
 */
export const saveOfferingsToJSON = async (
  { department, year, semesterType }: OfferingsQuery,
  prettify: boolean,
  directory: string,
  filename?: string
): Promise<void> => {
  const finalName: string = filename || `${department}_${year}_${["fall", "spring", "summer"][semesterType - 1]}.json`;

  await exportOfferingsToJSON(
    await getOfferings({ department, year, semesterType }),
    prettify,
    path.join(directory, finalName)
  );
};
