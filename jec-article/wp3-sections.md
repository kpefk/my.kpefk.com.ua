# WP3 — New sections for the manuscript (Parts A–D)

*Prepared as an extension of `manuscript.md`. Terminology, citation style ([n], IEEE-ish), and double-blind anonymization follow the existing manuscript. New references are numbered from [19] onward and continue the existing list [1]–[18].*

---

## Part A. Novelty of this work (proposed Section 2.2 analog)

The novelty of this study, relative to the literature reviewed in Section 1, comprises four elements.

**(i) First formalized model of versioned curricula for vocational pre-higher education.** Prior work on teaching management informatization in vocational colleges [7] and on ERP adoption in higher education [8] treats curricula as configuration data; no published design, to our knowledge, formalizes the curriculum of a vocational pre-higher education institution as a hierarchy of immutable, versioned normative documents from which all operational planning is derived, with append-only supersession in the spirit of temporal database practice [16].

**(ii) A draft-generation algorithm with proven idempotence with respect to teacher appointments.** The projection from a working curriculum to draft assignments is deterministic and, crucially, preserves human appointment decisions across arbitrary regenerations. We state this idempotence property explicitly and verify it against the implementation and its test suite, treating it as a checkable specification in the tradition of lightweight formal methods [19, 21] and property-based testing [23, 24].

**(iii) The statutory limit as a transactional invariant.** The 720 × rate annual cap of Article 60 of Law No. 2745-VIII [1] is enforced not as a report but as an invariant of the confirmation transaction, aggregated per effective teacher across all working curricula of the academic year; violation aborts the transition atomically.

**(iv) An evaluation methodology including offline-autonomy testing.** The evaluation combines code-level verification of constraint semantics with an edge-oriented measurement design — offline-autonomy scenarios in which the link to the national registry is severed — reported with bootstrap confidence intervals [33], following current benchmarking practice for edge deployments [29, 30].

---

## Part B. Comparison with existing systems

**Table 2.** Feature comparison of representative student/academic management systems against the requirements of statutory teaching load formation. "n/r" = not reported in publicly available vendor documentation or literature; absence of a report is not evidence of absence.

| System | Curriculum versioning with immutability | Statutory load-limit validation | Separation-of-duties confirmation workflow | Offline-first local authority | Open architecture |
|---|---|---|---|---|---|
| Ellucian Banner Student (+ Faculty Load and Compensation) | term-effective catalog records; immutability of published versions n/r | institution-defined workload rules and load analysis reports; no statutory-limit semantics reported | n/r (compensation review via self-service; order-based approval n/r) | on-premises deployment supported; offline-first operation n/r | proprietary |
| SAP Student Lifecycle Management (SLcM) | academic structure with program and module catalogs; version immutability n/r | n/r | generic role-based authorizations; legally framed duty separation n/r | on-premises deployment supported; offline-first operation n/r | proprietary |
| openSIS (OS4ED) | n/r (course manager without versioned curricula) | n/r | basic role permissions; confirmation workflow n/r | self-hosted; institution holds its data | open source (community edition) |
| Fedena | n/r (courses/batches model; no versioned curricula reported) | n/r | role-based logins; confirmation workflow n/r | self-hosted deployment possible | community edition open source (Apache 2.0) |
| «Деканат» (Politek-SOFT), Ukraine | curriculum ("навчальний план") data maintained; version immutability n/r | planned teacher load formation and departmental distribution; statutory 720-hour validation n/r | n/r | institution-local (client–server) deployment | proprietary |
| АСУ «ВНЗ» (АС «Деканат», ІВС «Освіта»), Ukraine | curriculum module present; version immutability n/r | teacher load module present; statutory-limit enforcement n/r | n/r | institution-local deployment | proprietary |
| EDEBO (national registry) | not applicable — registry of records, not an EMIS | not applicable | not applicable | central service; requires connectivity | closed national infrastructure |
| **This work** | **immutable published versions; append-only supersession** | **720 × rate as hard transactional block (Art. 60 [1])** | **preparer (deputy director) ≠ approver (director); order-based, audited** | **institutional node is data authority; core functions operate offline** | **documented model and algorithms (reference design)** |

Two observations follow from the comparison. First, the international platforms — Ellucian Banner and SAP SLcM — are mature in catalog management and workload *accounting*: Banner's Faculty Load and Compensation module extracts faculty assignments, applies institution-defined workload and compensation rules, and produces contract and term load analyses, while SLcM organizes programs and modules into a bookable academic structure. Neither, however, documents the two properties this paper argues are central for a statutory regime: immutability of published curriculum versions as a guarantee (rather than a convention), and a load-limit check whose semantics derive from a national legal act and whose violation blocks a legally meaningful transition. Their workload rules are institutional parameters, not transactional invariants with legal force. Second, the open-source school systems (openSIS, Fedena) and the Ukrainian institutional packages («Деканат» by Politek-SOFT, deployed across Ukrainian institutions since the late 1990s, and АСУ «ВНЗ» of the «Освіта» information system family) do cover curricula and planned teacher load as data-management features, and the Ukrainian systems in particular are deployed on institutional infrastructure — an implicit form of local authority. But available documentation reports no versioned immutability, no statutory-limit enforcement at confirmation time, and no legally framed separation between the person who prepares a distribution and the person who enacts it by order. EDEBO, finally, is deliberately excluded from feature scoring: it is the national registry of record, not an institutional management system, and the architecture described in this paper treats it as an upstream synchronization source. The gap the present work fills is therefore not the existence of load modules, which are common, but the combination of immutable normative provenance, statutory constraints as transactional invariants, and duty-separated confirmation in a locally autonomous deployment.

*(Source URLs per system are listed in the cover note at the end of this file.)*

---

## Part C. Practical applications

The most direct field of application is the sector for which the normative acts encoded by the system were written. According to the Institute of Educational Analytics, in the 2023/24 reporting cycle Ukraine had about 740 institutions of vocational pre-higher education — roughly 350 of them independent legal entities and the remainder colleges within higher education institutions — educating over 330 thousand students [34]. Every one of these institutions performs the same annual procedure under the same two acts: the 720 × rate cap of Article 60 of Law No. 2745-VIII [1] and the time norms of Order No. 686 [2, 3]. Because the model presented here parameterizes institution-specific conventions (subgroup practice, stream composition, committee sizes) while hard-coding only the national norms, transferring it to another college is a data-population exercise rather than a redevelopment, and the on-premises deployment profile matches the constrained infrastructure typical of the sector.

Within an institution, the confirmed assignment set is a natural upstream artifact for two established processes. For timetabling, confirmed load defines exactly the teacher–discipline–group–hours tuples that a scheduler must place; consuming them by foreign key rather than by re-entry excludes load–schedule divergence by construction and connects this work to the timetabling literature [4–6]. For personnel administration, the individual printed load sheet ("лист навантаження") that each teacher signs at the start of the year can be generated directly from confirmed records, carrying the order number and date; the signed sheet then corresponds line-by-line to the database state, which removes the customary reconciliation between the order, the spreadsheet, and the personnel file.

A third application is retrospective. Accreditation reviews in the sector routinely ask which curriculum version a given year's load and study schedule were derived from. Because every assignment carries a foreign-key chain to an immutable published version, any historical order can be re-derived and audited exactly, turning what is normally an archival search into a query.

Finally, the norm-to-constraint pattern — translate each paragraph of a normative act into a pure function; classify each rule as a hard transactional block or a soft advisory warning by its legal force; log privileged overrides rather than forbidding them — is not education-specific. The same discipline applies wherever an information system mediates a legally capped resource: staffing norms in healthcare, caseload limits in social services, or threshold rules in public procurement. The contribution of the case is a worked demonstration that such constraints can be kept authoritative without making the system brittle.

---

## Part D. Additional references (continuing the manuscript list; [19]–[34])

All entries below were verified against publisher pages, DOI resolution, or bibliographic databases during preparation. Formatting matches the existing reference entries of the manuscript.

[19] C. Newcombe, T. Rath, F. Zhang, B. Munteanu, M. Brooker, and M. Deardeuff, "How Amazon Web Services uses formal methods," Communications of the ACM, vol. 58, no. 4, pp. 66–73, 2015. https://doi.org/10.1145/2699417
— *Cite in Part A (ii) and in Section 4 (future work): precedent for specifying workflow invariants (TLA+) in industrial systems.*

[20] R. Bögli, L. Lerena, C. Tsigkanos, and T. Kehrer, "A systematic literature review on a decade of industrial TLA+ practice," in Integrated Formal Methods (iFM 2024), Lecture Notes in Computer Science, vol. 15234, pp. 24–34, 2025. https://doi.org/10.1007/978-3-031-76554-4_2
— *Cite in Section 4: evidence on adoption and obstacles of formal specification in industry, motivating a TLA+/Alloy specification of the confirmation workflow as future work.*

[21] D. Jackson, "Alloy: a language and tool for exploring software designs," Communications of the ACM, vol. 62, no. 9, pp. 66–76, 2019. https://doi.org/10.1145/3338843
— *Cite in Part A (ii): lightweight relational modelling suitable for checking the data-model invariants (immutability, uniqueness of curator-style constraints).*

[22] A. J. J. Davis, M. Hirschhorn, and J. Schvimer, "eXtreme modelling in practice," Proceedings of the VLDB Endowment, vol. 13, no. 9, pp. 1346–1358, 2020. https://doi.org/10.14778/3397230.3397233
— *Cite in Section 2.4 / future work: model-based trace checking as a way to keep a formal specification and a production implementation in conformance.*

[23] K. Claessen and J. Hughes, "QuickCheck: a lightweight tool for random testing of Haskell programs," in Proceedings of the 5th ACM SIGPLAN International Conference on Functional Programming (ICFP '00), pp. 268–279, 2000. https://doi.org/10.1145/351240.351266
— *Cite in Section 2.4: the origin of property-based testing, the technique used to state idempotence of draft generation as an executable property.*

[24] H. Goldstein, J. W. Cutler, D. Dickstein, B. C. Pierce, and A. Head, "Property-based testing in practice," in Proceedings of the IEEE/ACM 46th International Conference on Software Engineering (ICSE '24), 2024. https://doi.org/10.1145/3597503.3639581
— *Cite in Section 2.4: how practitioners actually use PBT, supporting the choice of properties (idempotence, invariant preservation) over example-based tests alone.*

[25] S. Ravi and M. Coblenz, "An empirical evaluation of property-based testing in Python," Proceedings of the ACM on Programming Languages, vol. 9, no. OOPSLA2, art. 412, 2025. https://doi.org/10.1145/3764068
— *Cite in Section 2.4: empirical evidence that property-based tests detect substantially more seeded faults than unit tests, justifying the evaluation design.*

[26] M. Kleppmann, A. Wiggins, P. van Hardenberg, and M. McGranaghan, "Local-first software: You own your data, in spite of the cloud," in Proceedings of the 2019 ACM SIGPLAN International Symposium on New Ideas, New Paradigms, and Reflections on Programming and Software (Onward! '19), pp. 154–178, 2019. https://doi.org/10.1145/3359591.3359737
— *Cite in Section 1 (edge relevance paragraph) and Part A (iv): the principled statement of local data authority and offline operation that the deployment model instantiates.*

[27] M. Shapiro, N. Preguiça, C. Baquero, and M. Zawirski, "Conflict-free replicated data types," in Proceedings of the 13th International Symposium on Stabilization, Safety, and Security of Distributed Systems (SSS 2011), Grenoble, France, 2011. https://doi.org/10.1007/978-3-642-24550-3_29
— *Cite in Section 3.4 / future work: the standard convergence framework for multi-node replication, relevant if the single-institution node is generalized to multi-campus deployments.*

[28] S. Laddad, C. Power, M. Milano, A. Cheung, N. Crooks, and J. M. Hellerstein, "Keep CALM and CRDT on," Proceedings of the VLDB Endowment, vol. 16, no. 4, pp. 856–863, 2022. https://doi.org/10.14778/3574245.3574268
— *Cite in Section 3.4: which queries and invariants can be maintained without coordination — directly relevant to arguing that the 720 × rate check requires a single point of authority.*

[29] B. Varghese, N. Wang, D. Bermbach, C.-H. Hong, E. de Lara, W. Shi, et al., "A survey on edge performance benchmarking," ACM Computing Surveys, vol. 54, no. 3, art. 66, 2021. https://doi.org/10.1145/3444692
— *Cite in Part A (iv) and Section 2.4: methodological grounding for the offline-autonomy and performance measurements.*

[30] P. P. Ray and M. P. Pradhan, "Performance analysis of localised large language models in resource-constrained edge for Python and Rust APIs," Journal of Edge Computing, vol. 5, no. 1, pp. 47–89, 2026. https://doi.org/10.55056/jec.1047
— *Cite in Part A (iv): a recent JEC exemplar of rigorous benchmarking on institution-grade, resource-constrained hardware, whose reporting style (repeated runs, per-scenario tables) the evaluation follows.*

[31] N. Balyk, S. Leshchuk, and D. Yatsenyak, "Design and implementation of an IoT-based educational model for smart homes: a STEM approach," Journal of Edge Computing, vol. 2, no. 2, pp. 148–162, 2023. https://doi.org/10.55056/jec.632
— *Cite in Section 1 (edge relevance paragraph): JEC precedent for edge deployments situated in educational institutions.*

[32] M. El Mazbouh, R. Shah, and K. Lee, "If evidence matters, why does the data die? Implementing education management information systems (EMIS) in development contexts," Frontiers in Education, vol. 10, art. 1616717, 2025. https://doi.org/10.3389/feduc.2025.1616717
— *Cite in Section 1 and Part B prose: recent evidence that EMIS deployments capture data but fail at institutional use — the utilization gap the proposed workflow design addresses.*

[33] B. Efron, "Bootstrap methods: another look at the jackknife," The Annals of Statistics, vol. 7, no. 1, pp. 1–26, 1979. https://doi.org/10.1214/aos/1176344552
— *Cite in Section 2.4 / Part A (iv): the canonical source for the bootstrap confidence intervals used when reporting measured latencies and sync durations.*

[34] Institute of Educational Analytics, "Basic educational statistics of Ukraine (2023/24 academic year)" ["Основні цифри освіти"], 2024. [Online]. Available: https://iea.gov.ua/diyalnist/naukovo-analitichna-diyalnist/osnovni-czyfry-osvity/ (summary tables also at https://osvita.ua/news/data/93396/)
— *Cite in Part C: the sector-size figures (about 740 vocational pre-higher education institutions; over 330 thousand students).*

---

## Cover note — source URLs per system (Part B; for editors/reviewers, not for the reference list)

- Ellucian Banner Student / Faculty Load and Compensation: https://banner.jcu.edu/ellucian/user/Banner_Student_8.14_and_9.3.7_User_Guide.pdf ; FLAC handbook: https://apps.northeaststate.edu/documents/repository/Evening%20and%20Distance%20Education/SOP/Faculty_Load_and_Compensation_Manual_by_Ellucian.pdf
- SAP Student Lifecycle Management (IS-HER-CM): https://help.sap.com/docs/SAP_S4HANA_ON-PREMISE/0dd6552bb884415f93aaa24c788ae644/7984cf535b804808e10000000a174cb4.html
- openSIS (OS4ED): https://github.com/OS4ED/openSIS-Classic
- Fedena (feature tour; community edition): https://fedena.com/feature-tour
- «Деканат» (ПП «Політек-СОФТ»): https://www.politek-soft.kiev.ua/index.php?do=products&product=deanery
- АСУ «ВНЗ» / АС «Деканат» (ІВС «Освіта», osvita.net): https://vuz.osvita.net/en/as-dekanat/ ; module overview PDF: https://vuz.osvita.net/wp-content/uploads/2024/05/ASU_VNZ_2024.pdf
- EDEBO (national registry; treated as upstream source, not an EMIS): https://info.edbo.gov.ua/

*Note: "1С:Коледж" was considered for inclusion but excluded — no verifiable current vendor documentation of its capabilities for the Ukrainian market was found during preparation, and cell values could not be supported.*
