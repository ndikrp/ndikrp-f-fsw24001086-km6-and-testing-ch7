const {
  DATABASE_URL="postgresql://postgres:bieiFOuPaXQKdWEYtLyOPpgVzOhvFneT@monorail.proxy.rlwy.net:27861/railway"
} = process.env;

module.exports = {
  test: {
    database: DATABASE_URL,
    dialect: 'postgres'
  }
}
