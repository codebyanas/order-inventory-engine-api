# 📦 Order & Inventory Engine API

A production-ready, highly modular RESTful backend API built with **Node.js**, **Express.js**, **TypeScript**, **Prisma ORM**, and **TiDB Cloud Database** (Serverless MySQL Compatible).

---

## 📑 Table of Contents

- [Overview](#-overview)
- [Tech Stack](#-tech-stack)
- [Project Architecture](#-project-architecture)
- [Environment Configuration](#-environment-configuration)
- [Getting Started](#-getting-started)
- [Available Scripts](#-available-scripts)
- [API Endpoints](#-api-endpoints)
- [Cloud Database & Troubleshooting](#-cloud-database--troubleshooting)
- [License](#-license)

---

## 📌 Overview

The **Order & Inventory Engine API** is designed to handle relational inventory and order management system operations. It supports multi-file Prisma schemas, automated seeding with fake data generators, database migrations, and seamless data synchronization between local development environments and cloud-native databases like TiDB Cloud.

---

## 🛠 Tech Stack

- **Runtime Environment:** Node.js
- **Framework:** Express.js
- **Language:** TypeScript (`tsx` for hot-reloading)
- **Database ORM:** Prisma ORM (v7+)
- **Database Engine:** MySQL / TiDB Cloud (Serverless)
- **Data Seeding & Tooling:** `@faker-js/faker`, Prisma CLI, `mysqldump`

---

## 📁 Project Architecture

```text
order-inventory-engine-api/
├── prisma/
│   ├── schema/
│   │   ├── base.prisma           # Datasource & Generator configurations
│   │   ├── user.prisma           # User model & auth role declarations
│   │   ├── product.prisma        # Product & stock management schema
│   │   ├── order.prisma          # Order & OrderItem relational schemas
│   │   └── migrations/           # SQL migration history (Tracked in Git)
│   └── seed.ts                   # Relational database seeder script
├── src/
│   ├── config/                   # Environment & Prisma client instance setup
│   ├── controllers/              # Business logic handlers for Users, Products & Orders
│   ├── middlewares/              # Authentication, CORS, and error handlers
│   ├── routes/                   # API endpoint route declarations
│   └── server.ts                 # Express application entry point
├── .env                          # Connection strings & sensitive keys (Git-ignored)
├── .gitignore                    # Version control ignore definitions
├── backup.sql                    # Local database dump (Git-ignored)
├── fix.sql                       # TiDB Cloud SQL mode relaxation script (Git-ignored)
├── package.json                  # Dependencies & utility execution scripts
└── tsconfig.json                 # TypeScript compiler configuration