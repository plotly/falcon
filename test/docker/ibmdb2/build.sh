#!/bin/bash
set -e

DB_ADMIN=db2inst1
DB_USER=db2user1

case $(whoami) in
root)
	# Setup user ${DB_USER}
	adduser ${DB_USER}
	(echo ${DB2USER1_PASSWORD}; echo ${DB2USER1_PASSWORD}) | passwd ${DB_USER} > /dev/null 2>&1

	# Grant SELECT privilege on tables in schema ${DB_ADMIN} to user ${DB_USER}
	su - $DB_ADMIN -c $0

	;;

${DB_ADMIN})
	# Start database instance
	db2start

	# Build SAMPLE database
	db2sampl

	# Grant CONNECT privilege on database user ${DB_USER}
	db2 connect to sample
	echo db2 grant connect on database to user ${DB_USER}
	db2 grant connect on database to user ${DB_USER}

	# Grant SELECT privilege on tables in schema ${DB_ADMIN} to user ${DB_USER}
	db2 list tables | tail -n +4 | head -n -3 | awk '{print $1}' | while read table
	do
		db2 connect to sample
		echo db2 grant select on ${DB_ADMIN}.${table} to user ${DB_USER}
		db2 grant select on ${DB_ADMIN}.${table} to user ${DB_USER}
	done

	# Stop database instance
	db2 force applications all
	db2 terminate
	db2stop

	;;

*)
	echo "error: '$0' must be invoked by root"

esac
