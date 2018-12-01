#!/bin/bash
set -e

sqlplus XDB/xdb @/setup.sql
sqlldr userid=XDB/xdb control=/setup.ctl

echo Ready
