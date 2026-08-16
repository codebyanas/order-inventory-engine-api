import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

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
    const database = dbUrl.pathname.substring(1); // Remove leading slash

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

    return {
      host,
      port: Number(dbUrl.port) || 3306,
      user: dbUrl.username,
      password: dbUrl.password,
      database,
    };
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(
        "[Database Config Error]: Invalid DATABASE_URL format. Expected format: mysql://user:password@localhost:3306/dbname"
      );
    }
    throw error;
  }
};

const config = getDbConfig();

const adapter = new PrismaMariaDb({
  host: config.host,
  port: config.port,
  user: config.user,
  password: config.password,
  database: config.database,
});

export const prisma = new PrismaClient({ adapter });

export const connectDB = async (): Promise<void> => {
  try {
    await prisma.$connect();
    console.log("MySQL Database connected successfully via Prisma.");
  } catch (error: any) {
    console.error("[Database Connection Failed]");

    if (error?.code === "ECONNREFUSED") {
      console.error(
        "Reason: Connection refused. Verify that MySQL server is running and accessible on the specified port."
      );
    } else if (error?.code === "ER_ACCESS_DENIED_ERROR") {
      console.error(
        "Reason: Access denied. Invalid MySQL database username or password."
      );
    } else if (error?.code === "ER_BAD_DB_ERROR") {
      console.error(
        `Reason: Database '${config.database}' does not exist on the MySQL server.`
      );
    } else {
      console.error("Error Details:", error?.message || error);
    }

    process.exit(1);
  }
};