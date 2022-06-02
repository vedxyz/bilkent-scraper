/* eslint-disable import/prefer-default-export */
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
          timeSlot: row.children.item(0)?.textContent as SRSTimeSlot,
          details: row.children.item(i)?.childElementCount
            ? row.children.item(i)?.firstElementChild?.innerHTML.slice(0, -"<br>".length).split("<br>") ?? null
            : null,
        })
      ) as SRSDailySchedule
    );

  return weeklySchedule;
};

export const getWeeklySchedule = async (cookie: string): Promise<SRSWeeklySchedule> => {
  const content = await requestSRS("https://stars.bilkent.edu.tr/srs-v2/schedule/index/weekly", cookie);
  return parseWeeklySchedule(new JSDOM(content));
};
