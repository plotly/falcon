cd release/
for d in */ ; do
	echo ${d%/}
    zip -r -X Plotly.Database.Connector.${d%/}.zip $d
done
