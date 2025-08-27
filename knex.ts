// knex.ts
import knexLib from "knex";
import config from "./knexfile";

const env = (process.env.NODE_ENV as string) || "development";
const knex = knexLib(config[env]);

export default knex;
