-- E2: anonymized extraction from the PRODUCTION database (read-only).
-- Run as a read-only role. Table/column names match prisma/schema.prisma @@map values.
-- :year — academic year, e.g. '2025-2026'.

-- (1) Per-teacher annual confirmed hours vs statutory limit round(720*rate)
SELECT md5(t.id) AS teacher_hash,
       t.rate::numeric AS rate,
       ROUND(720 * t.rate) AS hours_limit,
       SUM(la.hours * CASE WHEN sa.group_id IS NULL THEN 1 ELSE 1 END) AS confirmed_hours
FROM teacher_load_lesson_assignments la
JOIN teacher_load_subject_assignments sa ON sa.id = la.subject_assignment_id
JOIN teachers t ON t.id = COALESCE(la.override_teacher_id, sa.primary_teacher_id)
WHERE sa.academic_year = :year AND sa.status = 'CONFIRMED'
GROUP BY t.id, t.rate
ORDER BY confirmed_hours DESC;

-- (2) Status distribution per working curriculum
SELECT wc.academic_year, sa.status, COUNT(*)
FROM teacher_load_subject_assignments sa
JOIN working_curricula wc ON wc.id = sa.working_curriculum_id
GROUP BY 1,2 ORDER BY 1,2;

-- (3) Lesson-type distribution (confirmed only)
SELECT la.lesson_type, COUNT(*), SUM(la.hours) AS total_hours
FROM teacher_load_lesson_assignments la
JOIN teacher_load_subject_assignments sa ON sa.id = la.subject_assignment_id
WHERE sa.academic_year = :year AND sa.status = 'CONFIRMED'
GROUP BY 1 ORDER BY 3 DESC;

-- (4) Diploma supervision hours per teacher (computed pool 16/|assignees per student|)
SELECT md5(d.teacher_id) AS teacher_hash, COUNT(*) AS assignments,
       SUM(16.0 / c.cnt) AS diploma_hours
FROM diploma_supervision_assignments d
JOIN (SELECT student_id, curriculum_component_term_id, COUNT(*) cnt
      FROM diploma_supervision_assignments GROUP BY 1,2) c
  ON c.student_id = d.student_id AND c.curriculum_component_term_id = d.curriculum_component_term_id
WHERE d.academic_year = :year
GROUP BY d.teacher_id;
