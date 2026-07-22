#!/bin/bash
# E1 lifecycle: runner.sh <setup|seed|bench> [T G R]
set -e
PGBIN=/tmp/pgbin/package/native/bin
CSV=/sessions/jolly-compassionate-ptolemy/mnt/my.kpefk.com.ua/jec-article/experiments/results/e1-timings.csv
export POSTGRES_URI="postgresql://bench@localhost:5432/bench?host=/tmp"
case "$1" in
 setup)
  $PGBIN/pg_ctl -D /tmp/pgdata stop -m immediate 2>/dev/null || true
  rm -rf /tmp/pgdata /tmp/e1-ids.json
  $PGBIN/initdb -D /tmp/pgdata -U bench --no-sync -E UTF8 >/dev/null
  $PGBIN/pg_ctl -D /tmp/pgdata -o "-p 5432 -k /tmp -c fsync=off -c synchronous_commit=off -c full_page_writes=off" -w start >/dev/null
  node -e "const {Client}=require('/sessions/jolly-compassionate-ptolemy/mnt/backend.kpefk.com.ua/node_modules/pg');const fs=require('fs');(async()=>{let c=new Client({host:'/tmp',port:5432,user:'bench',database:'postgres'});await c.connect();await c.query('DROP DATABASE IF EXISTS bench');await c.query('CREATE DATABASE bench');await c.end();c=new Client({host:'/tmp',port:5432,user:'bench',database:'bench'});await c.connect();await c.query(fs.readFileSync('/tmp/ddl.sql','utf8'));await c.end();console.log('ddl applied')})().catch(e=>{console.error(e.message);process.exit(1)})"
  $PGBIN/pg_ctl -D /tmp/pgdata -w stop >/dev/null; echo "setup done" ;;
 seed|bench)
  $PGBIN/pg_ctl -D /tmp/pgdata -o "-p 5432 -k /tmp -c fsync=off -c synchronous_commit=off -c full_page_writes=off" -w start >/dev/null 2>&1 || true
  node /sessions/jolly-compassionate-ptolemy/mnt/my.kpefk.com.ua/jec-article/experiments/e1/e1-bench.js "$2" "$3" "$4" "$CSV" "$1"
  $PGBIN/pg_ctl -D /tmp/pgdata -w stop >/dev/null ;;
esac
