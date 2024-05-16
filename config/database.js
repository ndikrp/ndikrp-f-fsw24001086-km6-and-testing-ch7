const {
  DB_USER = "postgres",
  DB_PASSWORD = "admin",
  DB_NAME = "ch7_dev",
  DB_HOST = "localhost",
  DB_PORT = "5432",
} = process.env;

module.exports = {
  test: {
    database: process.env.DATABASE_URL,
    dialect: 'postgres'
  }
}
