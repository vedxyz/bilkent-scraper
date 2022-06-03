import { JSDOM } from "jsdom";
import fetch, { RequestInit, Response } from "node-fetch";
import { SRS2FACode, SRSLoginRequest } from "./interface";

const getCookie = (response: Response, name: string): string => {
  const cookie = response.headers
    .get("Set-Cookie")
    ?.split("; ")
    .find((e) => e.startsWith(name));
  if (!cookie) throw Error(`No cookie by name '${name}'`);
  return cookie;
};

const getRedirect = (response: Response): string => {
  const location = response.headers.get("Location");
  if (!location) throw Error("No redirect location sent in response");
  return location;
};

const getLoginTokens = async () => {
  const page = await fetch("https://webmail.bilkent.edu.tr/");
  const domBody = new JSDOM(await page.text()).window.document.body;
  const token = domBody.querySelector("input[name='_token']")?.getAttribute("value");
  if (!token) throw Error();
  return { token, sessid: getCookie(page, "roundcube_sessid") };
};

const webmailLogin = async (email: string, pw: string) => {
  const loginTokens = await getLoginTokens();

  const response = await fetch("https://webmail.bilkent.edu.tr/?_task=login", {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Upgrade-Insecure-Requests": "1",
      Cookie: loginTokens.sessid,
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
    .querySelector("#messagebody")
    ?.textContent?.match(/: (\d{5}) .* coded ([A-Z]{4})./);
  if (!match) throw Error("Failed to match 2FA code within mail content");

  return { code: match[1], ref: match[2] };
};

/**
 * Scrapes the latest SRS 2FA code from a dedicated mailbox.
 * The mailbox should be set up with mail filters to redirect all codes into it.
 *
 * @param email Bilkent Webmail address
 * @param password Email password
 * @param boxname Name of dedicated 2FA code mailbox, "STARS Auth" by default
 * @returns 2FA code and its reference code
 */
export const get2FACode = async (email: string, password: string, boxname = "STARS Auth"): Promise<SRS2FACode> => {
  const credentials = await webmailLogin(email, password);
  const uid = await getLatestUid(credentials, boxname);
  return getMail(credentials, boxname, uid);
};

const verifyEmailURL = "https://stars.bilkent.edu.tr/accounts/auth/verifyEmail";

/**
 * Initializes a login request for Bilkent SRS.
 *
 * The reference code is to be used to identify the corresponding verification code.
 *
 * The returned initial cookie must be fed into the next stage of the authentication process ({@link verifyEmail}).
 *
 * @param id Bilkent student ID
 * @param password Bilkent SRS password
 * @returns An object holding a reference code and the initial session cookie
 */
export const initializeLogin = async (id: string, password: string): Promise<SRSLoginRequest> => {
  const oauthMainResponse = await fetch("https://stars.bilkent.edu.tr/srs/oauth-login.php", {
    redirect: "manual",
  });

  const cookie = getCookie(oauthMainResponse, "PHPSESSID");
  const fetchOptions: RequestInit = {
    headers: {
      Cookie: cookie,
    },
  };

  const oauthAuthResponse = await fetch(getRedirect(oauthMainResponse), {
    ...fetchOptions,
    redirect: "manual",
  });

  const loginPageResponse = await fetch(getRedirect(oauthAuthResponse), fetchOptions);
  const formCode = new JSDOM(await loginPageResponse.text()).window.document.body
    .querySelector("#LoginForm_password_em_")
    ?.parentElement?.querySelector("input")
    ?.getAttribute("name");

  await fetch(loginPageResponse.url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: cookie,
    },
    body: `LoginForm[username]=${id}&LoginForm[password]=${password}&${formCode}=&yt0=`,
    redirect: "manual",
  });

  const verificationPageResponse = await fetch(verifyEmailURL, fetchOptions);
  const reference = new JSDOM(await verificationPageResponse.text()).window.document.body.querySelector(
    "#verifyEmail-form div.controls > p.help-block > span > strong"
  )?.textContent;
  if (!reference) throw Error("No reference code found on 2FA verification page. Incorrect credentials likely.");

  return { cookie, reference };
};

/**
 * Completes a login request for Bilkent SRS by verifying the two factor authentication code.
 *
 * @see {@link initializeLogin}
 * @param initialCookie The session cookie returned by {@link initializeLogin}
 * @param code The verification code
 * @returns An authenticated SRS session cookie
 */
export const verifyEmail = async (initialCookie: string, code: string): Promise<string> => {
  const codeResponse = await fetch(verifyEmailURL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: initialCookie,
    },
    body: `EmailVerifyForm[verifyCode]=${code}&yt0=`,
    redirect: "manual",
  });

  let newCookie;
  try {
    newCookie = getCookie(codeResponse, "PHPSESSID");
  } catch (err) {
    throw Error("No PHPSESSID cookie. Incorrect verification code likely.");
  }

  const oauthAuthResponse = await fetch(getRedirect(codeResponse), {
    headers: {
      Referer: verifyEmailURL,
      Cookie: newCookie,
    },
    redirect: "manual",
  });

  const fetchOptions: RequestInit = {
    headers: {
      Referer: verifyEmailURL,
      Cookie: [newCookie, getCookie(oauthAuthResponse, "authorize")].join("; "),
    },
    redirect: "manual",
  };

  const oauthMainResponse = await fetch(getRedirect(oauthAuthResponse), fetchOptions);
  const srsResponse = await fetch(getRedirect(oauthMainResponse), fetchOptions);
  await fetch(getRedirect(srsResponse), fetchOptions);

  return newCookie;
};

/**
 * Fetches and returns the text content from an SRS endpoint requiring authentication.
 *
 * An error is thrown if the cookie is invalid.
 *
 * @param url The URL to fetch
 * @param cookie A valid Bilkent SRS session cookie (`PHPSESSID=...`)
 * @returns The text content of the response
 */
export const requestSRS = async (url: string, cookie: string): Promise<string> => {
  const response = await fetch(url, {
    headers: {
      Cookie: cookie,
    },
  });

  const content = await response.text();
  if (content.startsWith("You are logged out from SRS")) throw Error("Unauthenticated request! Cookie may be invalid.");

  return content;
};

/**
 * Fetches and returns the base64 encoded format of an image from an SRS endpoint requiring authentication.
 *
 * An error is thrown if the cookie is invalid.
 *
 * @param url The URL to fetch
 * @param cookie A valid Bilkent SRS session cookie (`PHPSESSID=...`)
 * @returns The image, as an encoded base64 string
 */
export const requestImageSRS = async (url: string, cookie: string): Promise<string> => {
  const response = await fetch(url, {
    headers: {
      Cookie: cookie,
    },
  });

  const clone = response.clone();
  const [textContent, arrayBuffer] = await Promise.all([clone.text(), response.arrayBuffer()]);

  if (textContent.startsWith("You are logged out from SRS"))
    throw Error("Unauthenticated request! Cookie may be invalid.");

  const bufferString = Buffer.from(arrayBuffer).toString("base64");
  return `data:image/${response.headers.get("Content-Type")};base64,${bufferString}`;
};
