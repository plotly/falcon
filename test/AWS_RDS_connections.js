export const CREDENTIALS = {
	'mariadb': {
		'host': process.env.AWS_RDS_MARIADB,
		'port': '3306',
		'username': 'masteruser',
		'password': process.env.PASSWORD_MARIADB
		},
	'mssql': {
		'host': process.env.AWS_RDS_MSSQL,
		'port': '1433',
		'username': 'masteruser',
		'password': process.env.PASSWORD_MSSQL
		},
	'mysql': {
		'host': process.env.AWS_RDS_MYSQL,
		'port': '3306',
		'username': 'masteruser',
		'password': process.env.PASSWORD_MYSQL
		},
	'postgres': {
		'host': process.env.AWS_RDS_POSTGRES,
		'port': '5432',
		'username': 'masteruser',
		'password': process.env.PASSWORD_POSTGRES,
		'database': 'plotly_datasets'
		}
};
