import path from "path";
import fs from "fs";
import { saveOfferingsToJSON } from "./offerings";
import { Department, SemesterType } from "./offerings/interface";
import { getMealList } from "./cafeteria";
import { get2FACode } from "./srs2fa";

const testDir = path.join(__dirname, "..", "testoutput");

(async () => {
  Object.keys(Department).forEach((dep) =>
    saveOfferingsToJSON({ department: dep as Department, year: 2021, semesterType: SemesterType.Spring }, true, testDir)
  );

  await fs.promises.writeFile(path.join(testDir, "meallist.json"), JSON.stringify(await getMealList(), null, 2));

  const { code, ref } = await get2FACode("", "", "STARS Auth");
  console.log(`Code: ${code}, Ref: ${ref}`);
})();
