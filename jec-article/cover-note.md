# Cover note — JEC submission (not part of the manuscript)

**Manuscript:** Versioned Curriculum Data Model and Algorithms for Teaching Load Automation in Colleges
**Target journal:** Journal of Edge Computing (JEC), Academy of Cognitive and Natural Sciences (ACNS) — https://acnsci.org/journal/index.php/jec

## Author information (to insert after review)

- Author: Tymchenko Serhii, ORCID: https://orcid.org/0009-0008-5340-2608
- Affiliation: Separated Structural Unit "Kovel Industrial and Economic Applied College of Lutsk National Technical University", Kovel, Ukraine
- Contact: s.tymchenko@kpefk.com.ua
- System name to restore in the camera-ready version: MyKPEFK

The manuscript body is anonymized for double-blind review: no author names, affiliations, ORCID, system name, or self-identifying acknowledgements appear in it.

## Submission package checklist

1. **Anonymized article PDF** — export the manuscript to PDF only after reflowing it into the official JEC article template. Download the current template from the JEC submission page (Author Guidelines) before final formatting; do not submit from this draft's layout.
2. **Source files as ZIP** — include the template source (docx/LaTeX) used to produce the PDF.
3. **DOI/URLs for all references** — all references are complete; no placeholders remain.
   - Ref. [5]: DOI 10.1109/ACCESS.2024.3378054 verified via doi.org resolution to IEEE Xplore (document 10473052).
   - Ref. [7]: author (Y. Zhang) and pages (1–12) verified via the Crossref record for 10.1155/2022/5237777; no retraction is recorded for this DOI (checked July 2026), though Mobile Information Systems as a journal was later discontinued by the publisher — consider replacing if a reviewer objects.
   - Ref. [13]: authors, issue (17, se4), pages (232–245), and DOI (10.14571/brajets.v17.nse4.232-245) verified on the BRAJETS article page.
   - Refs. [1]–[3]: osvita.ua resolves normally; zakon.rada.gov.ua responds but blocks automated content extraction, so the two zakon URLs were cross-confirmed indirectly (the Ministry of Justice registration No. 1092/36714 shown on osvita.ua matches the z1092-21 slug). Spot-check both zakon links in a browser before submission.
4. **License** — JEC is Diamond Open Access; content in this draft is written to be compatible with CC BY 4.0 (no exclusive-rights claims). Note that the underlying source code repositories are AGPL-3.0; the paper describes the system without reproducing licensed code.

## Manuscript v2 (expanded empirical version)

- ~10 850 words / 28 pages draft PDF; 34 verified references; 3 tables; 4 figures; 3 algorithms; 8 numbered equations.
- All measured numbers (property tests, scalability) were obtained by running the production `dist/` build; raw data in `experiments/results/`. E2 (production-data analysis) and E3 (registry-outage protocol) are prepared in `experiments/` and must be executed on the live deployment before submission — the manuscript reports them as pending.
- Supplementary materials to ZIP for submission: `experiments/` (harness, results, SQL, protocol), `figures/` (SVG+PNG sources).
- Backup of the pre-expansion manuscript: `manuscript-v1-backup.md`.
- Post-evaluation code fixes (verified against the rebuilt production build, smoke-tested via the E1 harness): confirmation guards + write now execute in one Serializable transaction (P2034 → HTTP 409); generation has an explicit 30 s transaction budget; D1 is evaluated year-wide; confirmed primary teachers propagate to `WorkingCurriculumComponentTerm.teacherId` when unambiguous. The manuscript text (Invariant I1, Algorithm 2, Tables, Limitations) reflects the fixed behaviour and notes the found-and-fixed history honestly.

## Source URLs for Table 1 (system comparison; for editors/reviewers)

- Ellucian Banner Student / Faculty Load and Compensation: https://banner.jcu.edu/ellucian/user/Banner_Student_8.14_and_9.3.7_User_Guide.pdf ; FLAC handbook: https://apps.northeaststate.edu/documents/repository/Evening%20and%20Distance%20Education/SOP/Faculty_Load_and_Compensation_Manual_by_Ellucian.pdf
- SAP Student Lifecycle Management: https://help.sap.com/docs/SAP_S4HANA_ON-PREMISE/0dd6552bb884415f93aaa24c788ae644/7984cf535b804808e10000000a174cb4.html
- openSIS (OS4ED): https://github.com/OS4ED/openSIS-Classic
- Fedena: https://fedena.com/feature-tour
- «Деканат» (Політек-СОФТ): https://www.politek-soft.kiev.ua/index.php?do=products&product=deanery
- АСУ «ВНЗ» (ІВС «Освіта»): https://vuz.osvita.net/en/as-dekanat/
- EDEBO: https://info.edbo.gov.ua/
- Note: «1С:Коледж» was considered and excluded — capabilities could not be verified from current vendor documentation.

## Notes for final formatting

- Title is 12 words, no abbreviations or formulae.
- Abstract is one paragraph (~150 words); keywords ≥ 3 as required.
- Structure follows JEC IMRaD: Introduction, Methods, Results and Discussion, Conclusions, Acknowledgements, References, Appendix.
- Affiliation references Ukraine directly.
- All described behaviors (720 × rate hard block; 1 September soft warning; DRAFT→CONFIRMED transitions; immutability of published versions; role restrictions on confirm/revoke) were verified against the production code (`src/curriculum/teacher-load/subject-assignments.service.ts`, `teacher-load.constants.ts`, `curriculum-versions.service.ts`, `prisma/schema.prisma`), not the READMEs.
