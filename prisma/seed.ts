import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { faker } from "@faker-js/faker";

const dbUrlString = process.env.DATABASE_URL;
if (!dbUrlString) {
  throw new Error("DATABASE_URL is not set in environment variables.");
}

const dbUrl = new URL(dbUrlString);

const adapter = new PrismaMariaDb({
  host: dbUrl.hostname,
  port: Number(dbUrl.port) || 3306,
  user: dbUrl.username,
  password: dbUrl.password,
  database: dbUrl.pathname.substring(1),
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Cleaning old database records...");

  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.product.deleteMany({});

  console.log("Generating 200 products with randomized dates...");

  const brands = ["Apple", "Dell", "Logitech", "Samsung", "Sony", "Asus", "Lenovo", "Razer", "LG", "HP"];
  const categories = ["Laptop", "Monitor", "Wireless Headphones", "Gaming Mouse", "Mechanical Keyboard", "SSD Storage", "Smartwatch"];

  const productsData = Array.from({ length: 200 }).map(() => {
    const brand = faker.helpers.arrayElement(brands);
    const category = faker.helpers.arrayElement(categories);
    const modelNumber = faker.string.alphanumeric(4).toUpperCase();

    return {
      title: `${brand} ${faker.commerce.productAdjective()} ${category} ${modelNumber}`,
      price: parseFloat(faker.commerce.price({ min: 15, max: 2500, dec: 2 })),
      stock: faker.number.int({ min: 10, max: 150 }),
      createdAt: faker.date.past({ years: 1 }),
    };
  });

  await prisma.product.createMany({
    data: productsData,
  });

  console.log("200 products re-seeded with realistic dates!");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });