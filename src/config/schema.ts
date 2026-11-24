import { pgTable, varchar, numeric, integer, serial, timestamp, text, pgEnum, } from "drizzle-orm/pg-core";

export const PRODUCT_STATUS = ["published", "deleted"] as const;
export const productStatusEnum = pgEnum("product_status", PRODUCT_STATUS);


// ROLES
export const rolesTable = pgTable("roles", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  title: varchar({ length: 255 }).notNull().unique(),
  description: text(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// USERS
export const usersTable = pgTable("users", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  username: varchar({ length: 255 }).notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
  password: varchar({ length: 255 }).notNull(),
  roleId: integer("role_id").notNull().references(() => rolesTable.id),
  bio: text("bio"),
  image: text("image"),
  imagePublicId: varchar("image_public_id", { length: 255 }),  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});


//CATEGORIES
export const categoriesTable = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()),
});

//PRODUK
export const productsTable = pgTable("products", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 150 }).notNull(),
  categoryId: integer("category_id").notNull().references(() => categoriesTable.id),
  price: numeric("price", { precision: 12, scale: 2 }).notNull(),
  stock: integer("stock").notNull().default(1),
  description: text("description"),
  image: text("image"),
  imagePublicId: varchar("image_public_id", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()),
  status: productStatusEnum("status").notNull().default("published"),
});

//PET
export const PET_GENDER = ["male", "female"] as const;
export const petGenderEnum = pgEnum("pet_gender", PET_GENDER);

export const petsTable = pgTable("pets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  breed: varchar("breed", { length: 100 }), //ras hewan tsb
  gender: petGenderEnum("gender"),
  age: integer("age"),
  weight: numeric("weight", { precision: 5, scale: 2 }),
  image: text("image"),
  imagePublicId: varchar("image_public_id", { length: 255 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()),
});

//GROOMING
export const GROOMING_STATUS = ["available", "unavailable"] as const;
export const groomingStatusEnum = pgEnum("grooming_status", GROOMING_STATUS);

//LAYANAN GROOMING
export const groomingServicesTable = pgTable("grooming_services", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 150 }).notNull(),
  description: text("description"), // Penjelasan umum layanan grooming
  treatments: text("treatments"), // Daftar tindakan yang dilakukan pada hewan
  price: numeric("price", { precision: 12, scale: 2 }).notNull(),
  image: text("image"),
  imagePublicId: varchar("image_public_id", { length: 255 }),
  status: groomingStatusEnum("status").notNull().default("available"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()),
});

//BOOKING
export const BOOKING_STATUS = [
  "pending",
  "confirmed",
  "processing",
  "completed",
  "cancelled",
] as const;
export const bookingStatusEnum = pgEnum("booking_status", BOOKING_STATUS);

export const bookingsTable = pgTable("bookings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  employeeId: integer("employee_id").references(() => usersTable.id),
  petId: integer("pet_id").notNull().references(() => petsTable.id),
  layanan: integer("service_id").notNull().references(() => groomingServicesTable.id),
  totalPrice: numeric("total_price", { precision: 12, scale: 2 }).notNull(),
  bookingDate: timestamp("booking_date").notNull(),
  notes: text("notes"),
  status: bookingStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()),
});

//TRANSAKSI
export const PAYMENT_STATUS = ["pending", "success", "failed"] as const;
export const paymentStatusEnum = pgEnum("payment_status", PAYMENT_STATUS);

export const BOOKING_PAYMENT_STAGE = ["dp", "lunasan", "full"] as const;
export const bookingPaymentStageEnum = pgEnum(
  "booking_payment_stage",
  BOOKING_PAYMENT_STAGE,
);

export const bookingTransactionsTable = pgTable("booking_transactions", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id").notNull().references(() => bookingsTable.id),
  paymentStage: bookingPaymentStageEnum("payment_stage").notNull(),
  jumlah: numeric("jumlah", { precision: 12, scale: 2 }).notNull(),
  paymentMethod: varchar("payment_method", { length: 50 }),
  transactionId: varchar("transaction_id", { length: 255 }).unique(),
  paymentUrl: text("payment_url"),
  paymentStatus: paymentStatusEnum("payment_status").notNull().default("pending"),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()),
});

//CART
export const cartsTable = pgTable("carts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  productId: integer("product_id").notNull().references(() => productsTable.id, { onDelete: "cascade" }),
  quantity: integer("quantity").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
});

//riwayat transaksi
export const riwayatTransaksiTable = pgTable("riwayat_transaksi", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  productDetails: text("product_details").notNull(),
  totalPrice: numeric("total_price", { precision: 12, scale: 2 }).notNull(),
  transactionId: varchar("transaction_id", { length: 255 }).unique(),
  paymentMethod: varchar("payment_method", { length: 50 }),
  paymentUrl: text("payment_url"),
  paymentStatus: paymentStatusEnum("payment_status").default("pending").notNull(),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
});
