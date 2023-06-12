# Bilkent Scraper

Makeshift API for Bilkent University services, achieved through lots of scraping.

This package is for use with **Node.js only**. Browser use is not supported.

See full API documentation on [GitHub Pages](https://vedxyz.github.io/bilkent-scraper).

## Features

- Cafeteria
  - Parse the weekly cafeteria menu
  - Check for updates to the menu
  - Built-in cache functionality through entity tags
- Offerings
  - Query offerings for a given set of parameters
  - Save offerings to a JSON file
- Bilkent SRS
  - Parse the following endpoints:
    Academic Calendar,
    Attendance,
    Authentication,
    CGPA Calculator,
    Curriculum,
    Exam Schedule,
    Grades,
    Information Card,
    Letter Grade Statistics,
    Restricted Mode support,
    Weekly Schedule,
    Semester Course Details,
    Transcript
  - An authenticated SRS session class for ease of use
  - Factory methods with manual or automated verification to build sessions

## Basic Usage

### Offerings

(To be written)

### Cafeteria

(To be written)

### Bilkent SRS

The recommended way to interact with the SRS API is through the `SRSSession` class.
This class encapsulates all API functions into a single authenticated instance.
Use one of the factory methods below to obtain a session instance.

#### Manual Verification

This is the typical login flow seen on the SRS website.

```ts
// Initialize the login process
const { reference, verify } = await SRSSession.withManualVerification(id, password);

// Perform verification
const verificationCode = /* Obtained in whatever way */;
const session = await verify(verificationCode);

// The `SRSSession` instance is ready for use.
```

#### Automated Verification

This is the more practical way to log into SRS **on a secure device**.
There are security implications to this workflow as the process is no longer "two factor".

The verification codes are scraped automatically from your university email address to which codes are sent.
This requires some prior configuration on the user's part:

- The user must be receiving SRS verification codes through mail rather than SMS.
- The user must set up a mail filter through the webmail interface to direct all mails from `starsmsg@bilkent.edu.tr` containing the subject segment `Secure Login Gateway` to a specific mailbox/folder (i.e., called *STARS Auth*).

```ts
// A fifth parameter may be used to specify the filtered mailbox name. The default is "STARS Auth".
const session = await SRSSession.withAutomatedVerification(id, password, email, emailPassword);

// The `SRSSession` instance is ready for use.
```

## Disclaimer

This is not an official project backed by the Bilkent University.
It harmlessly scrapes the endpoints made available by them to any user.
Do not misuse this package.

I do **not** (cannot) guarantee that the package will work as intended.
Changes to the endpoints made by the university **may break functionality at any time**.

## Relevant Projects

The projects listed below are using this package:

- [VedBot (Discord bot)](https://github.com/vedxyz/discord-vedbot)
- [Bilkent STARS Browser Extension](https://github.com/vedxyz/bilkent-stars-extension)
- Bilkent SRS Mobile Application **(soon)**
- Bilkent Scheduler **(future)**
