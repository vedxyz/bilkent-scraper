# Bilkent Scraper

Makeshift API for Bilkent University.

## SRS AJAX Endpoints

This is of course not an exhaustive list, but a helpful one.

- `https://stars.bilkent.edu.tr/srs/ajax/home.php`
- `https://stars.bilkent.edu.tr/srs/ajax/userInfo.php`
- `https://stars.bilkent.edu.tr/srs/ajax/curriculum.php`
- `https://stars.bilkent.edu.tr/srs/ajax/courses.php`
- `https://stars.bilkent.edu.tr/srs/ajax/exam/index.php`
- `https://stars.bilkent.edu.tr/srs/ajax/stats/letter-grade.php`
- `https://stars.bilkent.edu.tr/srs/ajax/infoCard.php`
- `https://stars.bilkent.edu.tr/srs/ajax/semester.info.php?semester=20211`
- `https://stars.bilkent.edu.tr/srs/ajax/gradeAndAttend/grade.php` (current semester)
- `https://stars.bilkent.edu.tr/srs/ajax/gradeAndAttend/attend.php` (current semester)
- `https://stars.bilkent.edu.tr/srs/ajax/gradeAndAttend/grade.php?first=y&course=CS 223-5&semester=20211` (`course` can be omitted)
- `https://stars.bilkent.edu.tr/srs/ajax/gradeAndAttend/attend.php?first=y&course=CS 223-5&semester=20211` (same principles as `grade.php`)
- `https://stars.bilkent.edu.tr/srs/ajax/transcript.php`
- `https://stars.bilkent.edu.tr/srs/ajax/takenCourses.php`
- `https://stars.bilkent.edu.tr/srs-v2/tools/cgpa-calculator`
- `https://stars.bilkent.edu.tr/srs-v2/schedule/index/weekly`

The CGPA calculator works through POST requests where the request payload is a form with entries such as `courses[CRS_CODE_SEC]: "B+"`.
Example payload:

```html
courses%5BCS_202_1%5D=C&courses%5BCS_224_1%5D=A&courses%5BCS_319_1%5D=B%2B&courses%5BENG_401_18%5D=A&courses%5BMATH_225_4%5D=A&courses%5BPHYS_102_9%5D=A
```
