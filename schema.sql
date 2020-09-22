--- load with
--- sqlite3 database.db < schema.sql

CREATE TABLE user (
	userid VARCHAR(50) PRIMARY KEY,
	password varchar(255) NOT NULL,
	highscore INTEGER DEFAULT 0


);
