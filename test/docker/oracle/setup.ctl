OPTIONS(SKIP=1)

LOAD DATA
    INFILE "/2010_alcohol_consumption_by_country.csv"

    REPLACE
    INTO TABLE consumption2010

    FIELDS TERMINATED BY ","
    OPTIONALLY ENCLOSED BY '"'
    (location, alcohol)
