// knexfile.ts
import type { Knex } from "knex";
// No need to import PgPool or NeonPool directly since we'll use default pooling

const common: Partial<Knex.Config> = {
  client: "pg",
  migrations: {
    tableName: "knex_migrations",
    directory: "./migrations",
  },
  pool: { min: 0, max: 10 }, // Use default Knex pool settings
};

const config: { [key: string]: Knex.Config } = {
  development: {
    ...common,
    connection: process.env.DATABASE_URL || "postgres://postgres:@localhost:5432/mydb",
  },
  production: {
    ...common,
    connection: {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    },
  },
};

export default config;