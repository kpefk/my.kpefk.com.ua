# Experimental results — status

Hardware for all measured numbers: AMD Ryzen 5 3500U (4C/8T, virtualized sandbox),
3.8 GiB RAM, Linux; Node.js (see t1-results.json), embedded PostgreSQL 17.2
(fsync=off — timings reflect CPU/logic cost, not disk durability).
All benchmarked code is the production `dist/` build — no mocks, no reimplementation.

## T1 — Formula property tests + microbenchmarks (MEASURED)
- 8 properties × 100 000 random cases = 800 000 checks, 0 violations
  (exact limit values at rate 0.25/0.5/1.0/1.5 → 180/360/720/1080; monotonicity;
  linearity; diploma pool conservation per-student = 16 h; guard clauses).
- Microbenchmarks (mean over 10 × 10^6 iters): 3.9–28.2 ns/op per formula.
  Raw: results/t1-results.json.

## E1 — Scalability of generate()/confirm() on real service code (MEASURED)
results/e1-timings.csv, results/e1-summary.json, figures/fig4-e1-scalability.png
| T terms | G groups | generate() mean ms [95% CI] | confirm() mean ms [95% CI] |
|---|---|---|---|
| 100 | 5 | 279 [170, 448] | 40 [32, 48] |
| 500 | 10 | 785 [639, 1027] | 95 [85, 100] |
| 1000 | 10 | 1450 [1284, 1684] | 188 [169, 199] |
| 2500 | 20 | 3490 [3240, 3698] | 508 [370, 581] |
| 5000 | 20 | 7002 [6767, 7209] † | 917 [890, 944] † |

Per-term cost ≈ 1.4 ms (generate), ≈ 0.19 ms (confirm) — empirically linear, O(T).
† At T=5000 the DEFAULT Prisma interactive-transaction timeout (5 s) is exceeded and
generation aborts safely (atomicity preserved, no partial writes observed); the row
above was measured with the timeout raised to 40 s (documented configuration change).
This is a real operational boundary: the default configuration covers ≤ ~2500 terms,
two orders of magnitude above a realistic working curriculum (~100–300 terms).
confirm() at T=5000 emitted 1666 soft warnings (D1) — warning generation is included
in the timing.

## E2 — Production-data analysis (PENDING — requires production DB)
Ready-to-run: e2-extraction.sql (read-only, anonymized via md5 hashes),
e2-analysis.py (descriptive stats, bootstrap CI, box-plot vs limit, optional Wilcoxon).

## E3 — EDBO outage tolerance (PENDING — requires deployment)
Ready-to-run protocol: e3-protocol.md.

## Methods paragraphs (paste-ready)
**T1.** The normative-hour formulas were validated by randomized property testing
against eight algebraic properties derived from Order No. 686 (exactness at the four
statutory rate points, monotonicity in student and group counts, linearity of
control-work checking, conservation of the per-student thesis-supervision pool, and
guard-clause behaviour), with 10^5 random cases per property (0 violations), and
microbenchmarked at 10^6 iterations × 10 repeats per function on the production build.

**E1.** Scalability of draft generation and order confirmation was measured on the
unmodified production service code against an embedded PostgreSQL 17.2 instance
seeded with synthetic working curricula of T ∈ {100, 500, 1000, 2500, 5000} component
terms and G ∈ {5, 10, 20} groups (25 students each; one teacher per three components,
rate 1.5). Each point is the mean of 2–5 repeats with 95% bootstrap confidence
intervals (10^4 resamples). Timings were collected on a commodity virtualized x86
machine and reflect algorithmic cost rather than production I/O (fsync disabled).

**E2/E3.** [To be completed after execution on the production deployment.]
