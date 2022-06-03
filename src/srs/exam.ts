import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { JSDOM } from "jsdom";
import { requestSRS } from "./auth";
import { SRSExam } from "./interface";

dayjs.extend(customParseFormat);

const parseExams = (dom: JSDOM): SRSExam[] =>
  [...dom.window.document.querySelectorAll("body > div")].map((box) => {
    const dateText = box.querySelector(".examTable > tbody > tr:nth-child(2) > td:nth-child(2)")?.textContent;
    const timeText = box.querySelector(".examTable > tbody > tr:nth-child(3) > td:nth-child(2)")?.textContent;
    if ([dateText, timeText].some((t) => !t)) throw Error("Exam time couldn't be parsed");
    const startingTime = dayjs(`${dateText} ${timeText}`, "DD.MM.YYYY HH:mm");

    return {
      courseName: box.children[1]?.querySelector("h2")?.textContent?.trim() ?? "N/A",
      examType: box.children[1]?.querySelector("h3")?.textContent?.trim() ?? "N/A",
      startingTime,
      timeBlock:
        box.querySelector(".examTable > tbody > tr:nth-child(4) > td:nth-child(2)")?.textContent?.trim() ?? "N/A",
      classrooms: box.querySelector("div[id^=examClassroomList]")?.textContent?.trim().split(" ") ?? ["N/A"],
    };
  });

export const getExams = async (cookie: string): Promise<SRSExam[]> => {
  const content = await requestSRS("https://stars.bilkent.edu.tr/srs/ajax/exam/index.php", cookie);
  return parseExams(new JSDOM(content));
};
