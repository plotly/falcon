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

        db2 create database plotly

	# Grant CONNECT privilege on database user ${DB_USER}
	db2 connect to plotly

        db2 "CREATE TABLE alcohol_consumption_by_country_2010 (Location nvarchar(64), Alcohol double)"
        db2 import from /2010_alcohol_consumption_by_country.csv of del insert into alcohol_consumption_by_country_2010 || true

	echo db2 grant connect on database to user ${DB_USER}
	db2 grant connect on database to user ${DB_USER}

	db2 connect to plotly
	echo db2 grant select on ${DB_ADMIN}.alcohol_consumption_by_country_2010 to user ${DB_USER}
	db2 grant select on ${DB_ADMIN}.alcohol_consumption_by_country_2010 to user ${DB_USER}

	# Stop database instance
	db2 force applications all
	db2 terminate
	db2stop

	;;

*)
	echo "error: '$0' must be invoked by root"

esac
