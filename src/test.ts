import path from "path";
import fs from "fs";
import promptSync from "prompt-sync";
import { Department, saveOfferingsToJSON, SemesterType } from "./offerings";
import { getMealList } from "./cafeteria";
import { get2FACode, SRSSession, SRSSessionBuilder } from "./srs";

const args = process.argv.slice(2);
const testDir = path.join(__dirname, "..", "testoutput");
const prompt = promptSync({ sigint: true });

const getCredentialsFromArgs = (
  usernameArgName: string,
  passwordArgName: string
): [username: string, password: string] => {
  const credentials = [usernameArgName, passwordArgName].map((argName) => {
    const arg = `--${argName}=`;
    return args.find((i) => i.startsWith(arg))?.substring(arg.length) || "";
  });
  if (credentials.some((str) => str.length === 0))
    throw Error(`Login credentials aren't provided! Missing '${usernameArgName}' or '${passwordArgName}'.`);
  return credentials as ReturnType<typeof getCredentialsFromArgs>;
};

const testOfferings = () => {
  Object.keys(Department).forEach((dep) =>
    saveOfferingsToJSON({ department: dep as Department, year: 2021, semesterType: SemesterType.Spring }, true, testDir)
  );
};

const testCafeteria = async () => {
  await fs.promises.writeFile(path.join(testDir, "meallist.json"), JSON.stringify(await getMealList(), null, 2));
};

const test2FA = async () => {
  const [email, password] = getCredentialsFromArgs("email", "password");

  if (email.length > 10 && password.length > 5) {
    const { code, ref } = await get2FACode(email, password);
    console.log(`Code: ${code}, Ref: ${ref}`);
  }
};

const testRandomSRSFunction = async (session: SRSSession) => {
  const semester = await session.getSemester();
  console.log(JSON.stringify(semester, undefined, 2));
};

const testSessionBuilderManual = async () => {
  const [id, password] = getCredentialsFromArgs("id", "password");

  const { reference, verify } = await SRSSessionBuilder.withManualVerification(id, password);
  const verificationCode = prompt(`Verification Code (${reference}): `);
  const session = await verify(verificationCode);
  console.log(session.cookie);

  await testRandomSRSFunction(session);
};

const testSessionBuilderAutomated = async () => {
  const [id, password] = getCredentialsFromArgs("id", "password");
  const [email, emailPassword] = getCredentialsFromArgs("email", "emailpw");

  const session = await SRSSessionBuilder.withAutomatedVerification(id, password, email, emailPassword);
  console.log(session.cookie);

  await testRandomSRSFunction(session);
};

(async () => {
  if (args.includes("--offerings")) testOfferings();
  else if (args.includes("--cafeteria")) testCafeteria();
  else if (args.includes("--2fa")) test2FA();
  else if (args.includes("--manual")) testSessionBuilderManual();
  else if (args.includes("--automated")) testSessionBuilderAutomated();
})();
