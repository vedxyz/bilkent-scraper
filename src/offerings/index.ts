/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable no-multi-assign */
import { JSDOM } from "jsdom";
import fetch from "node-fetch";
import fs from "fs/promises";
import { CourseOfferingSectionData, Department, DepartmentOfferingsData, SemesterType } from "./interface";

export const getOfferings = async (department: Department, year: number, semesterType: SemesterType): Promise<DepartmentOfferingsData> => {
  const semester = `${year}${semesterType}`;
  const page = await fetch(
    `https://stars.bilkent.edu.tr/homepage/ajax/plainOfferings.php?COURSE_CODE=${department}&SEMESTER=${semester}`
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
    const courseName = columns[1].textContent;
    const instructor =
      row.querySelector("td:nth-child(3) > span:first-child > div:first-child")?.textContent || columns[2].textContent;

    const quotaString = column8.textContent!;
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
    const quota: CourseOfferingSectionData["quota"] = {
      indifferent: quotaIndifferent,
      total: quotaTotal,
      mandatory: quotaMandatory,
      elective: quotaElective,
    };

    const schedule =
      column15.textContent === ""
        ? []
        : column15
            .textContent!.split("\n")
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

    let course = offeringsObj.offerings.find((offering) => offering.code === courseCode);

    if (course === undefined) {
      course = {
        code: courseCode,
        name: courseName ?? "",
        sections: [],
      };
      offeringsObj.offerings.push(course);
    }

    course.sections.push({
      section,
      instructor: instructor ?? "",
      quota,
      schedule,
    });
  });

  return offeringsObj;
};

export const saveOfferingsToJSON = async (
  department: Department,
  year: number,
  semesterType: SemesterType,
  prettify: boolean
): Promise<void> => {
  await fs.writeFile(
    `${department}_${year}_${["fall", "spring", "summer"][semesterType - 1]}.json`,
    JSON.stringify(await getOfferings(department, year, semesterType), null, prettify ? 2 : 0),
    { encoding: "utf-8" }
  );
};

// Object.keys(Department).forEach(dep => saveOfferingsToJSON(dep as Department, 2021, SemesterType.Spring, true));
