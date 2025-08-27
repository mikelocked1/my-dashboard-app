// knexfile.ts
import type { Knex } from "knex";

const common: Partial<Knex.Config> = {
  client: "pg",
  migrations: {
    tableName: "knex_migrations",
    directory: "./migrations",
  },
  pool: { min: 0, max: 10 },
};

const config: { [key: string]: Knex.Config } = {
  development: {
    ...common,
    // Use DATABASE_URL in dev if you want to test against the same DB as production.
    // Otherwise fallback to a local DB string.
    connection: process.env.DATABASE_URL || "postgres://localhost:5432/mydb",
  },

  production: {
    ...common,
    // For Render (and many managed PGs) pass an object so we can set ssl properly:
    connection: {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    },
  },
};

export default config;

