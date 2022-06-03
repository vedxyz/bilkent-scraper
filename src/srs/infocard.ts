import { JSDOM } from "jsdom";
import { requestImageSRS, requestSRS } from "./auth";
import { SRSInfoCard } from "./interface";

const extract = (table: HTMLTableSectionElement | null, selector: string): string =>
  table?.querySelector(selector)?.textContent?.trim() ?? "-";

const extractRow = (table: HTMLTableSectionElement | null, index: number): string =>
  extract(table, `tr:nth-child(${index}) > td`);

const parseInfoCard = (dom: JSDOM): SRSInfoCard => {
  const [studentAndAdvisorBox, academicBox, scholarshipBox, contactBox] = [
    ...dom.window.document.querySelectorAll("#infoCardContainer > fieldset"),
  ];
  const [studentTable, advisorTable] = [...studentAndAdvisorBox.querySelectorAll("tbody")];
  const academicTable = academicBox.querySelector("tbody");
  const scholarshipTable = scholarshipBox.querySelector("tbody");
  const contactTable = contactBox.querySelector("tbody");

  return {
    student: {
      id: extractRow(studentTable, 1),
      nationalId: extractRow(studentTable, 2),
      fullName: extractRow(studentTable, 3),
      status: extractRow(studentTable, 4),
      faculty: extractRow(studentTable, 5),
      department: extractRow(studentTable, 6),
    },
    advisor: {
      fullName: extractRow(advisorTable, 1),
      email: extractRow(advisorTable, 2),
    },
    academic: {
      standing: extractRow(academicTable, 1),
      gpa: extractRow(academicTable, 2),
      cgpa: extractRow(academicTable, 3),
      registrationSemester: extractRow(academicTable, 5),
      curriculumSemester: extractRow(academicTable, 6),
      class: extractRow(academicTable, 7),
      nominalCreditLoad: extractRow(academicTable, 8),
      courseLimits: {
        lower: extractRow(academicTable, 9),
        upper: extractRow(academicTable, 10),
      },
      ranking: {
        cohort: extractRow(academicTable, 12),
        agpa: extractRow(academicTable, 13),
        details: extractRow(academicTable, 14),
      },
    },
    scholarship: {
      byPlacement: extractRow(scholarshipTable, 1),
      merit: extractRow(scholarshipTable, 2),
    },
    contact: {
      contactEmail: extractRow(contactTable, 1),
      bilkentEmail: extractRow(contactTable, 2),
      mobilePhone: extractRow(contactTable, 4),
    },
  };
};

export const getInfoCard = async (cookie: string): Promise<SRSInfoCard> => {
  const content = await requestSRS("https://stars.bilkent.edu.tr/srs/ajax/infoCard.php", cookie);
  const dom = new JSDOM(content);
  const infoCard = parseInfoCard(dom);
  infoCard.student.picture = await requestImageSRS(
    dom.window.document.querySelector("fieldset > table > tbody > tr > td > img")?.getAttribute("src") ??
      "https://stars.bilkent.edu.tr/webserv/image.php", // Default "no image available" placeholder
    cookie
  );
  return infoCard;
};
