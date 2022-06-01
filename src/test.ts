import path from "path";
import fs from "fs";
import promptSync from "prompt-sync";
import { Department, saveOfferingsToJSON, SemesterType } from "./offerings";
import { getMealList } from "./cafeteria";
import { CGPACalculationRequestData, get2FACode, initializeLogin, SRSSession, verifyEmail } from "./srs";

const args = process.argv.slice(2);
const testDir = path.join(__dirname, "..", "testoutput");
const prompt = promptSync({ sigint: true });

const testOfferings = () => {
  Object.keys(Department).forEach((dep) =>
    saveOfferingsToJSON({ department: dep as Department, year: 2021, semesterType: SemesterType.Spring }, true, testDir)
  );
};

const testCafeteria = async () => {
  await fs.promises.writeFile(path.join(testDir, "meallist.json"), JSON.stringify(await getMealList(), null, 2));
};

const test2FA = async () => {
  const email = args.find((i) => i.startsWith("--email="))?.substring("--email=".length) || "";
  const password = args.find((i) => i.startsWith("--password="))?.substring("--password=".length) || "";

  if (email.length > 10 && password.length > 5) {
    const { code, ref } = await get2FACode(email, password, "STARS Auth");
    console.log(`Code: ${code}, Ref: ${ref}`);
  }
};

const testLogin = async () => {
  const id = args.find((i) => i.startsWith("--id="))?.substring("--id=".length) || "";
  const password = args.find((i) => i.startsWith("--password="))?.substring("--password=".length) || "";
  if (id.length < 8 || password.length < 6) throw Error("Login credentials aren't provided!");

  const loginRequest = await initializeLogin(id, password);
  console.log(loginRequest);

  const verificationCode = prompt("Verification Code: ");
  const sessid = await verifyEmail(loginRequest.cookie, verificationCode);
  console.log(sessid);
};

(async () => {
  if (args.includes("--offerings")) testOfferings();
  else if (args.includes("--cafeteria")) testCafeteria();
  else if (args.includes("--2fa")) test2FA();
  else if (args.includes("--login")) testLogin();
})();
