# Formal Model of the Curriculum and Teaching-Load Assignment Subsystem

## 1. Formal data model

The subsystem is organised in three layers: a *normative* layer (approved curricula), an *operational* layer (year-specific working plans), and an *assignment* layer (teacher–load records governed by a draft/confirmed lifecycle). We formalise each layer as sets and tuples that mirror the relational schema.

**Normative layer.** Let $S$ be the set of specialties and $P$ the set of educational programmes, with a total function $\mathrm{spec}: P \to S$. A *curriculum* is a tuple

$$C = (p, f, b, y), \qquad p \in P,$$

where $f$ is the form of education, $b$ the admission basis, and $y \in \mathbb{N}$ the entry year; the quadruple is unique (enforced by a composite uniqueness constraint on the corresponding relation). A curriculum owns a totally ordered set of *versions* $V(C) = \{v_1, v_2, \dots\}$, each $v = (C, n, \pi, \delta)$ with version number $n$, publication flag $\pi \in \{0,1\}$ and deprecation timestamp $\delta \in \mathbb{T} \cup \{\bot\}$. A published version ($\pi = 1$) is immutable (Section 5, Invariant I2). A version contains ordered *sections* $\Sigma(v)$, each section contains ordered *components* $K(\sigma)$ (disciplines, practices, attestation items), and each component $\kappa$ is distributed over semesters by *terms*: a term $\tau = (\kappa, m, e, h, c, \omega_{\mathrm{cw}}, \omega_{\mathrm{cp}}, \sigma_\tau)$ carries the semester number $m$, ECTS credits $e$, hours $h$, the final-control form $c \in \{\mathrm{EXAM}, \mathrm{CREDIT}, \mathrm{GRADED\_CREDIT}, \bot\}$, course-work / course-project flags, and a default subgroup count $\sigma_\tau \geq 1$. The pair $(\kappa, m)$ is unique.

**Operational layer.** For a published version $v$ and an academic year $Y$ (e.g. "2024–2025") there is at most one *working curriculum* $W = (v, Y)$. It refines each normative term $\tau$ into a *working term* $\omega = (W, \tau, \vec{h}, \mu_p, \mu_\ell, \sigma, \phi, a, i, w, k)$, where $\vec{h} = (h_{\mathrm{lec}}, h_{\mathrm{pr}}, h_{\mathrm{lab}}, h_{\mathrm{sem}}, h_{\mathrm{ind}}, h_{\mathrm{cons}})$ is the per-kind hour split, $\mu_p, \mu_\ell \in \{\mathrm{STREAM}, \mathrm{PER\_GROUP}\}$ are the distribution modes for practical and laboratory classes, $\sigma \geq 1$ the subgroup count, $\phi \in \{\mathrm{ORAL}, \mathrm{WRITTEN}, \bot\}$ the exam format, $a, i \in \mathbb{N}$ the counts of in-class and independent control works, $w$ the practice duration in weeks, and $k$ the diploma-committee size (default 3). Academic groups are bound to versions by an active-binding relation $B \subseteq G \times V$; we write $G(v) = \{g : (g,v) \in B,\ \text{binding active}\}$ and $n_s(g)$ for the number of active students of group $g$.

**Assignment layer.** A *subject assignment* is a tuple

$$A = (W, \tau, g, t_p, s, \nu, d, u_a, u_d), \qquad g \in G(v) \cup \{\bot\},$$

where $g = \bot$ denotes a *stream* assignment (shared by all groups of the version), $t_p$ is the primary teacher (possibly $\bot$ while drafting), $s \in \{\mathrm{DRAFT}, \mathrm{CONFIRMED}\}$ the lifecycle status, $\nu, d$ the order number and order date (set only when confirmed), and $u_a, u_d$ the acting deputy and the signing director. Each subject assignment owns *lesson assignments* $\Lambda(A)$: a lesson $\lambda = (A, \chi, j, h, t_o)$ carries the lesson kind $\chi$ (lecture, practice, lab, seminar, consultation, supervised independent work, semester control, control-works checking, practice supervision, course-work supervision, diploma committee seat, pre-control consultation), an optional subgroup number $j \in \{1..\sigma\} \cup \{\bot\}$, an integer hour volume $h$, and an optional *override teacher* $t_o$. The teacher who actually carries the hours of a lesson is

$$\mathrm{eff}(\lambda) \;=\; \begin{cases} t_o(\lambda), & t_o(\lambda) \neq \bot,\\[2pt] t_p(A(\lambda)), & \text{otherwise.} \end{cases} \tag{1}$$

Personal diploma supervision is deliberately kept outside this group-centric structure: a relation $D \subseteq \mathrm{Student} \times \tau \times \mathrm{Teacher} \times \{\mathrm{SUPERVISOR}, \mathrm{CONSULTANT}\}$ records who supervises or consults each student's thesis; the triple (student, term, teacher) is unique, and supervision hours are never stored — they are recomputed from $|D|$ on demand (Eq. 6), so they cannot become stale when the supervisor set changes.

## 2. Hour norms

The following equations are implemented as pure functions and verified by unit tests; all constants derive from the national workload norms for professional pre-higher education. Let $n_g$ denote the number of groups taking a control event and $n_s$ the corresponding student count.

**Semester control** (credit vs. examination):

$$H_{\mathrm{ctl}}(c, \phi, n_g, n_s) \;=\; \begin{cases} 2\,n_g, & c \in \{\mathrm{CREDIT}, \mathrm{GRADED\_CREDIT}\},\\ 0.33\,n_s, & c = \mathrm{EXAM},\ \phi = \mathrm{ORAL},\\ 3\,n_g + 0.5\,n_s, & c = \mathrm{EXAM},\ \phi = \mathrm{WRITTEN},\\ 0, & \text{otherwise (incl. } c = \mathrm{EXAM}, \phi = \bot\text{).} \end{cases} \tag{2}$$

**Checking of control (module) works**, where $a$ works are written in class and $i$ during independent study, one script per student:

$$H_{\mathrm{cw}}(a, i, n_s) \;=\; 0.25\,a\,n_s \;+\; 0.33\,i\,n_s. \tag{3}$$

**Practice supervision** for a practice component lasting $w > 0$ weeks:

$$H_{\mathrm{pr}} \;=\; \begin{cases} 18\,w\,\max(\sigma', 1), & \text{educational practice},\\ 1 \cdot w\,n_s, & \text{technological / pre-graduation practice},\\ 0, & \text{otherwise}, \end{cases} \tag{4}$$

where $\sigma'$ is the subgroup multiplier of the pure function ($\sigma' \geq 2$ multiplies the weekly norm, each subgroup being led separately at the full rate). In the generation service the function is invoked with $\sigma' = 1$ and the multiplication is realised structurally instead: one lesson row per subgroup, each carrying the full $18w$ (see Deviations). Production-type practice is *not* multiplied by subgroups — $n_s$ already fixes the total volume regardless of how many supervisors share the students.

**Course work and course project supervision** (per student; both norms add if a term unusually has both):

$$H_{\mathrm{cwk}} \;=\; 3\,n_s\,[\omega_{\mathrm{cw}}] \;+\; r\,n_s\,[\omega_{\mathrm{cp}}], \qquad r = \begin{cases} 3, & \text{general-competency section},\\ 4, & \text{professional section}. \end{cases} \tag{5}$$

**Diploma supervision and defence committee.** Each thesis carries a shared pool of 16 hours divided equally among all persons assigned to that student for that term (supervisor and consultants); each committee member additionally receives 0.5 h per defended student:

$$h_{\mathrm{dip}}(s, \tau) \;=\; \frac{16}{|\,\mathrm{assignees}(s, \tau)\,|}, \qquad H_{\mathrm{com}} \;=\; 0.5\,n_s \ \text{per committee seat}. \tag{6}$$

**Pre-control consultation**, 2 h per group before any credit or examination:

$$H_{\mathrm{pcc}}(c, n_g) \;=\; \begin{cases} 2\,n_g, & c \neq \bot,\\ 0, & c = \bot. \end{cases} \tag{7}$$

**Annual limit.** A teacher $t$ employed at rate $\rho(t) \in [0.25, 1.5]$ may carry at most

$$L(t) \;=\; \mathrm{round}\bigl(720 \cdot \rho(t)\bigr) \ \text{hours per academic year.} \tag{8}$$

At materialisation time every computed volume from Eqs. (2)–(7) is rounded to the nearest integer, because lesson rows store integer hours for the signed order document; fractional norms (0.25/0.33/0.5) therefore only round once, at the group level.

## 3. Algorithms

**Algorithm 1 — GenerateDraftAssignments.**
*Input:* working curriculum $W$, acting user $u$. *Output:* fresh DRAFT assignment set for $W$; CONFIRMED records are never modified.

1. Load $W$ with its working terms $\Omega(W)$ ordered by (section order, component order, semester number).
2. $G \leftarrow G(v(W))$ (groups actively bound to the version); for each $g \in G$ compute $n_s(g)$ over active students.
3. **Snapshot of prior appointments.** For every existing DRAFT subject assignment $A$ of $W$ with key $k_A = (\tau(A), \mathrm{scope}(A))$, where scope is the group or the marker "stream": store $P[k_A] \leftarrow t_p(A)$; for every lesson $\lambda \in \Lambda(A)$ with $t_o(\lambda) \neq \bot$ store $O[k_A, \chi(\lambda), j(\lambda)] \leftarrow t_o(\lambda)$.
4. Initialise output buffers $R_{\mathrm{subj}} \leftarrow \varnothing$, $R_{\mathrm{les}} \leftarrow \varnothing$. Define the helper $\mathrm{EmitLessons}(A, \chi, h, \sigma)$: if $\sigma \geq 2$, append one lesson row per subgroup $j \in \{1..\sigma\}$, each with the *full* hours $h$ and override $O[k_A, \chi, j]$ if present; otherwise append a single row with $j = \bot$ and override $O[k_A, \chi, \bot]$.
5. For each working term $\omega \in \Omega(W)$ with normative term $\tau$ and subgroup count $\sigma$:
   1. **Lectures (stream).** If $h_{\mathrm{lec}} > 0$: emit a stream subject ($g = \bot$, primary $\leftarrow P[(\tau, \mathrm{stream})]$ or $\bot$, status DRAFT); $\mathrm{EmitLessons}(\cdot, \mathrm{LECTURE}, h_{\mathrm{lec}}, \sigma)$.
   2. **Other stream kinds.** Collect (seminar, consultation, independent-work) hours, plus practice hours if $\mu_p = \mathrm{STREAM}$ and lab hours if $\mu_\ell = \mathrm{STREAM}$; if any are positive, emit one stream subject and $\mathrm{EmitLessons}$ for each positive kind.
   3. **Per-group practice/lab.** If $\mu_p = \mathrm{PER\_GROUP}$ and $h_{\mathrm{pr}} > 0$, or $\mu_\ell = \mathrm{PER\_GROUP}$ and $h_{\mathrm{lab}} > 0$: for each $g \in G$ emit a subject with scope $g$ and $\mathrm{EmitLessons}$ for those kinds (full hours per group, enabling distinct teachers).
   4. **Control events (per group, no subgroup split).** For each $g \in G$: $h_1 \leftarrow \mathrm{round}(H_{\mathrm{ctl}}(c_\tau, \phi, 1, n_s(g)))$ (Eq. 2), $h_2 \leftarrow \mathrm{round}(H_{\mathrm{cw}}(a, i, n_s(g)))$ (Eq. 3), $h_3 \leftarrow \mathrm{round}(H_{\mathrm{pcc}}(c_\tau, 1))$ (Eq. 7); if $h_1 + h_2 + h_3 > 0$ emit a subject for $g$ with one lesson row per positive volume.
   5. **Practice supervision.** If the component is a practice: for each $g \in G$ compute $h \leftarrow \mathrm{round}(H_{\mathrm{pr}})$ (Eq. 4 with $\sigma' = 1$); if $h > 0$ emit a subject for $g$ and $\mathrm{EmitLessons}(\cdot, \mathrm{PRACTICE\_SUPERVISION}, h, \sigma)$.
   6. **Course work / project.** If $\omega_{\mathrm{cw}} \lor \omega_{\mathrm{cp}}$: for each $g \in G$ compute $h \leftarrow \mathrm{round}(H_{\mathrm{cwk}})$ (Eq. 5); if $h > 0$ emit a subject with a single supervision row.
   7. **Defence committee.** If the component is a diploma project or qualification-work defence: for each $g \in G$ compute $h \leftarrow \mathrm{round}(0.5\, n_s(g))$ (Eq. 6); if $h > 0$ emit a subject and $\mathrm{EmitLessons}(\cdot, \mathrm{DIPLOMA\_COMMITTEE}, h, k)$ — the committee size $k$ plays the role of $\sigma$, producing one independently assignable *seat* row per member.
6. **Atomic replacement.** In a single transaction: delete all DRAFT subject assignments of $W$ (lesson rows cascade); bulk-insert $R_{\mathrm{subj}}$; bulk-insert $R_{\mathrm{les}}$.
7. Return the assignment list in document order.

**Algorithm 2 — ConfirmByOrder.**
*Input:* working curriculum $W$ (year $Y$), order number $\nu$, order date $d$, acting user $u$. *Output:* number of confirmed records and a warning list $\Phi$.

1. If $\mathrm{DRAFT}(W) = \varnothing$: **reject** (nothing to confirm).
2. **C0 (hard).** If $\exists A \in \mathrm{DRAFT}(W): t_p(A) = \bot$: **reject**, reporting the count of unassigned components.
3. **C1 (hard).** $H \leftarrow \mathrm{AnnualHours}(Y)$ (Algorithm 3). If $\exists t: H(t) > L(t)$ (Eq. 8): **reject**, listing each offending teacher with $H(t)$ and $L(t)$.
4. $\Phi \leftarrow \varnothing$; append soft warnings:
   1. **C6** — $u$ holds the administrator role rather than the director role (the order is legally the director's act);
   2. **R1** — $d$ is later than 1 September of the start of $Y$;
   3. **J1** — no trade-union approval is recorded on $W$;
   4. **D1** — some teacher is primary on more than 5 distinct disciplines within $\mathrm{DRAFT}(W)$;
   5. **D2** — some teacher supervises more than 8 theses (role SUPERVISOR) in year $Y$.
5. **Atomic transition.** One bulk update: for all $A \in \mathrm{DRAFT}(W)$ set $s \leftarrow \mathrm{CONFIRMED}$, $\nu(A) \leftarrow \nu$, $d(A) \leftarrow d$, $u_d(A) \leftarrow u$.
6. Return $(|\mathrm{DRAFT}(W)|, \Phi)$.

**Algorithm 3 — AnnualHours($Y$).**

1. $\Lambda_Y \leftarrow$ all lesson rows whose parent subject assignment has academic year $Y$ — *across every working curriculum of the year and irrespective of status*.
2. $H \leftarrow$ empty map. For each $\lambda \in \Lambda_Y$: $t \leftarrow \mathrm{eff}(\lambda)$ (Eq. 1); if $t \neq \bot$ then $H(t) \mathrel{+}= h(\lambda)$.
3. For every teacher having diploma assignments in $Y$ (queried without a pre-filtered teacher list, so that a teacher whose *only* load is thesis supervision is still covered): for each assignment $(s, \tau)$ add $h_{\mathrm{dip}}(s, \tau)$ (Eq. 6) to $H(t)$.
4. Return $H$.

## 4. Complexity and idempotence

Let $T = |\Omega(W)|$ be the number of working terms, $G = |G(v)|$ the number of bound groups, $\sigma$ the maximal subgroup/committee width (bounded by a small constant, $\sigma \leq \max(2, k)$), and $K$ the constant number of lesson kinds. Step 5 of Algorithm 1 performs, per term, $O(K\sigma)$ work for the stream subjects and $O(G\sigma)$ work for each of the per-group families (5.3–5.7), hence

$$T_{\mathrm{gen}} \;=\; O\bigl(T \cdot (K + G)\,\sigma\bigr) \;=\; O(T \cdot (G + K)),$$

since $\sigma = O(1)$. The number of materialised lesson rows is $|\Lambda| = O(T\,G\,\sigma)$, which also bounds the memory footprint together with the snapshot maps $P, O$ (proportional to the previous draft size). Database traffic is a constant number of set-oriented queries plus one three-statement transaction — no per-row round-trips. Confirmation is dominated by the year-wide limit check: $T_{\mathrm{conf}} = O(|\Lambda_Y| + |\mathrm{DRAFT}(W)| + |D_Y|)$, i.e. linear in the lesson rows of the academic year; the aggregation in Algorithm 3 is a single pass with $O(1)$ map updates per row.

**Idempotence of generation with respect to teacher appointments.** Define the *key* of a subject row as $(\tau, \mathrm{scope})$ and of a lesson row as $(\tau, \mathrm{scope}, \chi, j)$. For a fixed working-plan configuration and group population, Algorithm 1 is a deterministic function of its inputs: the set of emitted keys and their hour volumes depend only on $\Omega(W)$, the modes $\mu_p, \mu_\ell$, $\sigma$, and the counts $n_s(g)$. Repeating the algorithm therefore reproduces exactly the same keyed structure (up to freshly minted surrogate identifiers).

Appointment preservation follows from the snapshot maps. Before deletion, step 3 records $t_p$ under every subject key and $t_o$ under every lesson key at which an override exists. During emission, each newly created row looks up *its own key* in $P$ (resp. $O$) and restores the stored teacher, defaulting to $\bot$. Since regeneration under unchanged inputs emits the same key set, every previously stored appointment is looked up successfully and restored, and no key can receive a foreign appointment because keys are unique within a draft ($(\tau, \mathrm{scope})$ pairs are emitted at most once per family, and lesson keys extend subject keys injectively). Hence $\mathrm{Gen} \circ \mathrm{Gen} = \mathrm{Gen}$ on the observable state (keys, hours, appointments). When inputs *do* change — e.g. a distribution mode flips from STREAM to PER_GROUP — keys that disappear take their appointments with them, which is the intended semantics: an appointment is meaningful only relative to the structure it was made in. The delete-and-insert pair runs inside one transaction, so a concurrent reader never observes a half-replaced draft.

## 5. Invariants

**I1 (Confirmation preserves the load limit).** *If ConfirmByOrder succeeds, then in the resulting state $\forall t: H(t) \leq L(t)$.*
*Proof.* $H$ is a function of the lesson rows' hours, override teachers, subject primary teachers, and the diploma-supervision relation (Algorithm 3). The confirming update (step 5) writes only the status, order number, order date, and signer fields — none of the inputs of $H$. Therefore $H^{\mathrm{post}} = H^{\mathrm{pre}}$, and $H^{\mathrm{pre}} \leq L$ pointwise is exactly what guard C1 verified before the write; a violation raises an exception and the update is never issued (check-before-write). The transition itself is a single set-oriented update statement and hence atomic: no observer sees a partially confirmed order. Two remarks sharpen the claim. First, C1 aggregates *all* lesson rows of the year, DRAFT and CONFIRMED alike, so confirming one working curriculum cannot push a teacher over the limit through hours hiding in another plan of the same year — including thesis-supervision hours, which live outside the lesson table but are added by Algorithm 3. Second, the guard and the update are not wrapped in one serialisable transaction, so a concurrent appointment edit in the check-to-write window could in principle invalidate the check; the window is small, edits to CONFIRMED rows are refused outright, and the invariant is re-establishable by revoke–reconfirm, but a strictly stronger guarantee would require transactional enclosure (see Deviations). $\square$

**I2 (Published-version immutability ⇒ reproducibility of confirmed orders).** *Every confirmed order can be reproduced from the version it was generated against.*
*Proof.* Every structural mutation of the normative layer (create/update/delete of sections, components, terms, elective blocks, display projections, time-budget and calendar entries) passes through a single guard that rejects the operation whenever the owning version has $\pi = 1$; deletion of a published or deprecated version is likewise refused, as is deletion of any version referenced by group bindings or working curricula. Referential integrity closes the remaining gap: subject assignments reference terms with delete-restrict semantics, terms restrict to components, components to sections, and sections to versions, so no element on the path from a confirmed assignment to its version can be removed while the assignment exists. Consequently the normative structure reachable from a confirmed order is bit-identical to the structure at confirmation time. Volumes are additionally *materialised*: lesson rows store integer hours copied at generation, so the order document does not depend on later drift in the operational layer (student counts, working-term hour splits) — reproducing the printed order is a pure read of the confirmed rows joined to the frozen version. Corrections are expressed as new versions (structure duplication into a fresh draft), never as in-place edits. $\square$

**I3 (Revoke is the exact inverse of confirm on assignment state).** *For any working curriculum, applying revoke after confirm restores the pre-confirmation assignment state.*
*Proof.* Confirm modifies precisely four fields of each affected row: $s: \mathrm{DRAFT} \to \mathrm{CONFIRMED}$, $\nu: \bot \to \nu_0$, $d: \bot \to d_0$, $u_d: \bot \to u$. Revoke performs the pointwise inverse on all CONFIRMED rows of the plan — status back to DRAFT and the three order fields back to $\bot$ — and touches nothing else; primary teachers, overrides, hours, and the diploma relation are untouched by both operations. The composition is therefore the identity on assignment state (modulo bookkeeping timestamps). Revoke additionally requires at least one CONFIRMED row, and it executes the bulk reset *and* the creation of an audit record (actor, action, target plan, IP, revert count, stated reason) inside one transaction, so the legally significant reversal cannot occur unlogged, nor can a log entry exist for a reversal that did not complete. After revocation the rows are again editable and re-confirmable under a new order. $\square$

## Deviations found

The following points differ from, or refine, the brief; in each case the text above follows the code.

1. **Educational-practice subgroup multiplier is structural, not arithmetic.** The pure function accepts a subgroup multiplier ($18w \times \sigma'$), but the generator calls it with the default $\sigma' = 1$ and instead emits one PRACTICE_SUPERVISION lesson row per subgroup, each carrying the full $18w$. The aggregate effect ($\sigma \cdot 18w$) is identical; the per-row representation is what enables a distinct supervisor per subgroup.
2. **Committee norm is per member *per student*.** Each committee seat receives $\mathrm{round}(0.5 \cdot n_s)$ hours, not a flat 0.5 h per member; seats are materialised via the subgroup mechanism ($\sigma := k$, the committee size), one independently assignable row per member.
3. **C1 is broader than "all working curricula of the year".** The limit check aggregates every lesson row with the given academic year regardless of status — confirmed orders *and* drafts of other plans — plus year-wide diploma-supervision hours computed without a teacher pre-filter (covering teachers whose only load is supervision).
4. **Confirm's guard and write are not one transaction.** The C0/C1 checks precede a single atomic bulk update, but no enclosing transaction serialises check and write; I1's proof notes this residual check-to-write window explicitly.
5. **D1 scope.** The five-discipline warning counts distinct components only within the DRAFT set of the plan being confirmed, not across the whole year (unlike D2, which is year-wide).
6. **Rounding at materialisation.** Fractional norms (0.25/0.33/0.5 h) are rounded to integers per group when lesson rows are created, because stored hours are integers destined for the printed order; the pure functions themselves remain exact, as their unit tests assert.
7. **Idempotence is up to surrogate identifiers.** Regeneration mints fresh row identifiers; the fixed-point property holds on the keyed observable state (keys, hours, appointments), not on primary keys.
