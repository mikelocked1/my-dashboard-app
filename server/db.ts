import * as schema from "@shared/schema";

// Create a simple mock database for development when PostgreSQL is not available
function createMockDatabase() {
  const memoryStore = {
    users: new Map(),
    doctors: new Map(),
    healthData: new Map(),
    appointments: new Map(),
    healthAlerts: new Map(),
    aiHealthTips: new Map(),
    nextId: 1
  };

  return {
    select: () => ({
      from: (table: any) => ({
        where: (condition: any) => ({
          limit: (n: number) => [],
          orderBy: (order: any) => []
        }),
        leftJoin: (joinTable: any, condition: any) => ({
          where: (condition: any) => ({
            limit: (n: number) => [],
            orderBy: (order: any) => []
          })
        }),
        orderBy: (order: any) => ({
          limit: (n: number) => []
        }),
        limit: (n: number) => []
      })
    }),
    insert: (table: any) => ({
      values: (data: any) => ({
        returning: () => {
          const id = memoryStore.nextId++;
          const record = { 
            id, 
            ...data, 
            createdAt: new Date().toISOString(), 
            updatedAt: new Date().toISOString() 
          };
          return [record];
        }
      })
    }),
    update: (table: any) => ({
      set: (data: any) => ({
        where: (condition: any) => ({
          returning: () => []
        })
      })
    }),
    delete: (table: any) => ({
      where: (condition: any) => ({ rowCount: 0 })
    })
  };
}

// Initialize database connection
let db: any;

if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('localhost')) {
  try {
    // Try to use real database
    const { Pool, neonConfig } = require('@neondatabase/serverless');
    const { drizzle } = require('drizzle-orm/neon-serverless');
    const ws = require('ws');
    
    neonConfig.webSocketConstructor = ws;
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    db = drizzle({ client: pool, schema });
    console.log('Connected to PostgreSQL database');
  } catch (error) {
    console.warn('Failed to connect to PostgreSQL, using mock database:', error);
    db = createMockDatabase();
  }
} else {
  console.log('Using mock database for development (set DATABASE_URL to use PostgreSQL)');
  db = createMockDatabase();
}

export { db };