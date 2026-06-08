import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'geometry_db',
  password: 'твой_пароль',
  port: 5432,
});

export default pool;