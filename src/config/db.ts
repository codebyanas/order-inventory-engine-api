import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@prisma/client";

/**
 * Parses DATABASE_URL into database connection configuration parameters.
 */
const getDbConfig = () => {
  const dbUrlString = process.env.DATABASE_URL;

  if (!dbUrlString) {
    throw new Error(
      "[Database Config Error]: DATABASE_URL is missing in environment variables."
    );
  }

  try {
    const dbUrl = new URL(dbUrlString);
    const host = dbUrl.hostname;
    const database = dbUrl.pathname.substring(1);

    if (!host) {
      throw new Error(
        "[Database Config Error]: Hostname is missing in DATABASE_URL."
      );
    }
    if (!database) {
      throw new Error(
        "[Database Config Error]: Database name is missing in DATABASE_URL."
      );
    }

    const isLocalhost = host === "localhost" || host === "127.0.0.1";

    return {
      host,
      port: Number(dbUrl.port) || 3306,
      user: dbUrl.username,
      password: dbUrl.password,
      database,
      ssl: isLocalhost ? false : true,
    };
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error("[Database Config Error]: Invalid DATABASE_URL format.");
    }
    throw error;
  }
};

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

/**
 * Creates a Prisma Client instance with MariaDB adapter and serverless pool settings.
 */
const createPrismaClient = () => {
  const config = getDbConfig();

  // Pass pool options directly to PrismaMariaDb to prevent TypeScript type mismatch
  const adapter = new PrismaMariaDb({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: config.database,
    ssl: config.ssl,
    connectionLimit: 5,
    connectTimeout: 30000, // 30 seconds connection timeout for TiDB Cloud
    acquireTimeout: 30000, // 30 seconds pool acquire timeout
  });

  return new PrismaClient({ adapter });
};

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

/**
 * Connects explicitly to the database using Prisma.
 */
export const connectDB = async (): Promise<void> => {
  try {
    await prisma.$connect();
    console.log("MySQL Database connected successfully via Prisma.");
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[Database Connection Failed]:", errorMessage);
  }
};