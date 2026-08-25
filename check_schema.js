import insforge from './src/utils/insforge.js';

async function check() {
  const { data, error } = await insforge.database.sql('SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = \'public\'');
  console.log("Tables:", JSON.stringify(data || error, null, 2));
}

check();
