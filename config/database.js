const {
  DB_USER = "postgres",
  DB_PASSWORD = "bieiFOuPaXQKdWEYtLyOPpgVzOhvFneT",
  DB_NAME = "railway",
  DB_HOST = "monorail.proxy.rlwy.net",
  DB_PORT = "27861"
} = process.env;

module.exports = {
  development: {
    username: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    host: DB_HOST,
    port: DB_PORT,
    dialect: "postgres"
  },
  test: {
    username: DB_USER,
    password: DB_PASSWORD,
    database: `${DB_NAME}_test`,
    host: DB_HOST,
    port: DB_PORT,
    dialect: "postgres"
  },
  production: {
    username: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    host: DB_HOST,
    port: DB_PORT,
    dialect: "postgres"
  }
};
