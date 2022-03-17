/* eslint-disable import/prefer-default-export */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { JSDOM } from "jsdom";
import fetch from "node-fetch";
import { SRS2FACode } from "./interface";

const getLoginTokens = async () => {
  const page = await fetch("https://webmail.bilkent.edu.tr/");
  const domBody = new JSDOM(await page.text()).window.document.body;
  const token = domBody.querySelector("input[name='_token']")!.getAttribute("value");
  const sessid = page.headers
    .get("Set-Cookie")!
    .split("; ")
    .find((e) => e.startsWith("roundcube_sessid"));
  return { token, sessid };
};

const login = async (email: string, pw: string) => {
  const loginTokens = await getLoginTokens();

  const response = await fetch("https://webmail.bilkent.edu.tr/?_task=login", {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Upgrade-Insecure-Requests": "1",
      Cookie: loginTokens.sessid!,
    },
    body: `_token=${loginTokens.token}&_task=login&_action=login&_timezone=Europe%2FIstanbul&_url=&_user=${email}&_pass=${pw}`,
    method: "POST",
    redirect: "manual",
  });

  const cookies = response.headers.raw()["set-cookie"].map((e) => e.substring(0, e.indexOf(";")));

  cookies.shift();
  return cookies.join("; ");
};

const getLatestUid = async (credentials: string, boxname: string) => {
  const response = await fetch(
    `https://webmail.bilkent.edu.tr/?_task=mail&_action=list&_refresh=1&_mbox=${boxname}&_remote=1&_unlock=&_=`,
    {
      headers: {
        Cookie: credentials,
      },
    }
  );

  return (await response.json()).env.messagecount;
};

const getMail = async (credentials: string, boxname: string, uid: string): Promise<SRS2FACode> => {
  const page = await fetch(`https://webmail.bilkent.edu.tr/?_task=mail&_mbox=${boxname}&_uid=${uid}&_action=show`, {
    headers: {
      Cookie: credentials,
    },
  });

  const match = new JSDOM(await page.text()).window.document.body
    .querySelector("#messagebody")!
    .textContent!.match(/: (\d{5}) .* coded ([A-Z]{4})./) as RegExpMatchArray;

  return { code: match[1], ref: match[2] };
};

/**
 * Scrapes the latest SRS 2FA code from a dedicated mailbox.
 * The mailbox should be set up with mail filters to redirect all codes into it.
 *
 * @param email Bilkent Webmail address
 * @param password Email password
 * @param boxname Name of dedicated 2FA code mailbox
 * @returns 2FA code and its reference code
 */
export const get2FACode = async (email: string, password: string, boxname: string): Promise<SRS2FACode> => {
  const credentials = await login(email, password);
  const uid = await getLatestUid(credentials, boxname);
  return getMail(credentials, boxname, uid);
};
