/* eslint-disable import/prefer-default-export */
import { JSDOM } from "jsdom";
import fetch from "node-fetch";

export const isSRSRestricted = async (): Promise<boolean> => {
  const response = await fetch("https://stars.bilkent.edu.tr/srs/");
  const { body } = new JSDOM(await response.text()).window.document;
  return body.querySelector("#wrapper > div.info")?.textContent?.includes("SRS is in restricted mode") ?? false;
};

export const getLetterGrades = async (
  id: string,
  password: string
): Promise<
  {
    course: string;
    grade: string;
  }[]
> => {
  const response = await fetch("https://stars.bilkent.edu.tr/srs/index.php", {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: `user_id=${id}&password=${password}`,
  });

  const { body } = new JSDOM(await response.text()).window.document;
  return [...body.querySelectorAll("#wrapper > fieldset > table > tbody > tr")].map((row) => ({
    course: row.children.item(0)?.textContent ?? "",
    grade: row.children.item(1)?.textContent ?? "",
  }));
};
