import path from "path";
import { saveOfferingsToJSON } from "./offerings";
import { Department, SemesterType } from "./offerings/interface";

Object.keys(Department).forEach((dep) =>
  saveOfferingsToJSON(
    { department: dep as Department, year: 2021, semesterType: SemesterType.Spring },
    true,
    path.join(__dirname, "..", "testoutput")
  )
);
