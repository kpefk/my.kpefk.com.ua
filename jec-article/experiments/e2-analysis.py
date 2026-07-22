#!/usr/bin/env python3
"""E2 analysis: descriptive stats + bootstrap CI + box-plot of teacher load vs limit.
Input: CSV from e2-extraction.sql query (1): teacher_hash,rate,hours_limit,confirmed_hours
Optional: --manual CSV (teacher_hash,manual_minutes,system_minutes) -> Wilcoxon signed-rank.
"""
import sys, csv, random, statistics as st, argparse
import matplotlib; matplotlib.use('Agg'); import matplotlib.pyplot as plt
p = argparse.ArgumentParser(); p.add_argument('loads_csv'); p.add_argument('--manual'); a = p.parse_args()
rows = list(csv.DictReader(open(a.loads_csv)))
util = [float(r['confirmed_hours'])/float(r['hours_limit']) for r in rows if float(r['hours_limit'])>0]
random.seed(42)
boots = sorted(st.mean(random.choices(util,k=len(util))) for _ in range(10000))
print(f"teachers={len(util)} mean_util={st.mean(util):.3f} sd={st.stdev(util):.3f} "
      f"CI95=[{boots[250]:.3f},{boots[9750]:.3f}] over_limit={sum(u>1 for u in util)}")
fig, ax = plt.subplots(figsize=(4.4,4.2))
ax.boxplot([u*100 for u in util], widths=0.5)
ax.axhline(100, color='black', ls='--', lw=1, label='statutory limit (720×rate)')
ax.set_ylabel('Annual load, % of individual limit'); ax.set_xticks([])
ax.legend(frameon=False); plt.tight_layout()
plt.savefig('results/e2-load-vs-limit.png', dpi=300); plt.savefig('results/e2-load-vs-limit.svg')
if a.manual:
    from scipy.stats import wilcoxon
    m = list(csv.DictReader(open(a.manual)))
    d1=[float(x['manual_minutes']) for x in m]; d2=[float(x['system_minutes']) for x in m]
    w = wilcoxon(d1,d2)
    print(f"Wilcoxon signed-rank: W={w.statistic} p={w.pvalue:.4g} n={len(m)}")
