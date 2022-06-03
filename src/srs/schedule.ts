import { JSDOM } from "jsdom";
import { requestSRS } from "./auth";
import { SRSDailySchedule, SRSDailyScheduleItem, SRSTimeSlot, SRSWeeklySchedule } from "./interface";

const parseWeeklySchedule = (dom: JSDOM): SRSWeeklySchedule => {
  const rows = [...dom.window.document.querySelectorAll("body > div.container > div.row div.row + table > tbody > tr")];
  rows.shift();

  const weeklySchedule = [] as unknown as SRSWeeklySchedule;

  for (let i = 1; i <= 7; i++)
    weeklySchedule.push(
      rows.map(
        (row): SRSDailyScheduleItem => ({
          timeSlot: row.children[0]?.textContent as SRSTimeSlot,
          details: row.children.item(i)?.childElementCount
            ? row.children.item(i)?.firstElementChild?.innerHTML.slice(0, -"<br>".length).split("<br>") ?? null
            : null,
        })
      ) as SRSDailySchedule
    );

  return weeklySchedule;
};

/**
 * Provides the contents of https://stars.bilkent.edu.tr/srs-v2/schedule/index/weekly
 *
 * The full matrix of time slots is parsed, meaning evening-hours and weekends are included.
 *
 * @param cookie A valid Bilkent SRS session cookie (`PHPSESSID=...`)
 * @returns The parsed weekly schedule object
 */
export const getWeeklySchedule = async (cookie: string): Promise<SRSWeeklySchedule> => {
  const content = await requestSRS("https://stars.bilkent.edu.tr/srs-v2/schedule/index/weekly", cookie);
  return parseWeeklySchedule(new JSDOM(content));
};
