import path from "path";
import fs from "fs";
import { saveOfferingsToJSON } from "./offerings";
import { Department, SemesterType } from "./offerings/interface";
import { getMealList } from "./cafeteria";
import { get2FACode } from "./srs2fa";

const testDir = path.join(__dirname, "..", "testoutput");
const test2FACredentials = { email: "", password: "" };

(async () => {
  Object.keys(Department).forEach((dep) =>
    saveOfferingsToJSON({ department: dep as Department, year: 2021, semesterType: SemesterType.Spring }, true, testDir)
  );

  await fs.promises.writeFile(path.join(testDir, "meallist.json"), JSON.stringify(await getMealList(), null, 2));

  if (test2FACredentials.email.length > 10 && test2FACredentials.password.length > 5) {
    const { code, ref } = await get2FACode(test2FACredentials.email, test2FACredentials.password, "STARS Auth");
    console.log(`Code: ${code}, Ref: ${ref}`);
  }
})();
