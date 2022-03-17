import * as fs from "fs";
import { promisify } from "util";
import { exec } from "child_process";
import fetch, { Response } from "node-fetch";
import { withFile } from "tmp-promise";
import dayjs, { Dayjs } from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import { MealList, MealName, MealDay } from "./interface";

// dayjs.Ls.en.weekStart = 1; // May not be needed with IsoWeek plugin
dayjs.extend(isoWeek);
const execAsync = promisify(exec);

const menuUrl = "http://kafemud.bilkent.edu.tr/kumanya_menusu.pdf";

const trTime = (): Dayjs => dayjs().add(3, "hour");
const getMonday = (): Dayjs => trTime().startOf("isoWeek");

const getEntityTag = (res: Response) => res.headers.get("ETag")?.replace(/^"|"$/g, "");

const parseMealPDF = async (buffer: Buffer, mealList: MealList): Promise<void> => {
  const parse = {
    error: false,
    default: "",
    raw: "",
  };

  await withFile(async ({ path: fp, fd }) => {
    fs.write(fd, buffer, (err) => {
      if (err) console.error(`Error from tempfile: ${err.name}, ${err.message}`);
    });

    try {
      parse.default = (await execAsync(`pdftotext ${fp} -`)).stdout.trim();
      parse.raw = (await execAsync(`pdftotext -raw ${fp} -`)).stdout.trim();
    } catch (error) {
      parse.error = true;
      console.error(error);
    }
  });
  if (parse.error) return;

  const plateLines = parse.raw.split("\n").slice(0, 70);
  const calorieLines = parse.default
    .split("\n")
    .slice(-50)
    .filter((line) => /^\d* kkal/.test(line))
    .map((line) => line.replace(/\s\/$/, ""));

  const getMealName = (line: string): MealName => {
    const split = line.split(/\s\/\s/);
    return {
      tr: split[0].replace(/^Vejetaryen\s/, ""),
      eng: split[1].replace(/\s\(Vegetarian\)$/, ""),
    };
  };

  const getBlankMealDay = () => ({
    plates: [],
    vegetarianPlate: { tr: "", eng: "" },
    calories: { standard: "", vegetarian: "" },
  });

  for (let i = 0; i !== 7; i++) {
    const mealDay: MealDay = {
      date: getMonday().add(i, "day"),
      lunch: getBlankMealDay(),
      dinner: getBlankMealDay(),
    };

    for (let j = 0; j !== 4; j++) {
      mealDay.lunch.plates.push(getMealName(plateLines[i * 10 + j]));
      mealDay.dinner.plates.push(getMealName(plateLines[i * 10 + 5 + j]));
    }
    mealDay.lunch.vegetarianPlate = getMealName(plateLines[i * 10 + 4]);
    mealDay.dinner.vegetarianPlate = getMealName(plateLines[i * 10 + 9]);

    [
      mealDay.lunch.calories.standard,
      mealDay.lunch.calories.vegetarian,
      mealDay.dinner.calories.standard,
      mealDay.dinner.calories.vegetarian,
    ] = calorieLines.slice(i * 4, i * 4 + 4);

    mealList.days.push(mealDay);
  }
};

let mealListCache: MealList;

/**
 * Lightly check for updates by comparing ETag's.
 *
 * @returns `true` if there are changes to the meal document
 */
export const checkForUpdates = async (): Promise<boolean> => {
  const response = await fetch(menuUrl, { method: "HEAD" });
  const entityTag = getEntityTag(response);

  return !(entityTag === null || entityTag === mealListCache?.entityTag);
};

const cacheMealList = async (writeJson = false, filePath = ""): Promise<void> => {
  const response = await fetch(menuUrl);

  const mealList: MealList = {
    entityTag: getEntityTag(response) ?? "",
    days: [],
  };

  await parseMealPDF(await response.buffer(), mealList);
  if (writeJson) await fs.promises.writeFile(filePath, JSON.stringify(mealList, null, 2));

  mealListCache = mealList;
};

/**
 * Returns cached list if no updates found, otherwise fetches and scrapes anew.
 *
 * Note that there is absolutely no guarantee for this list to be accurate.
 * The data is parsed from a PDF file, which are notoriously hard to deal with.
 * The accuracy depends on a myriad of factors, including the build of
 * *poppler*'s `pdftotext` you have on your system's path.
 *
 * The accuracy seems to be alright with version `0.71.0` and `0.86.1`, and probably most versions in between.
 *
 * @returns The current week's meal list
 */
export const getMealList = async (): Promise<MealList> => {
  if (mealListCache === undefined || (await checkForUpdates())) await cacheMealList();
  return mealListCache;
};
