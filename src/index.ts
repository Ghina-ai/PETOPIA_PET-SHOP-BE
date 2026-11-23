import express from "express";
import cors from "cors";
import authRouter from "./routes/auth/auth.routes";
import productRouter from "./routes/produk/produk.routes";
import karyawanRoutes from "./routes/karyawan/karyawan.routes";
import groomingRoutes from "./routes/grooming/grooming.routes";
import petsRoutes from "./routes/pets/pets.routes";

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/products", productRouter);
app.use("/api/v1/karyawan", karyawanRoutes);
app.use("/api/v1/grooming", groomingRoutes);
app.use("/api/v1/pets", petsRoutes);

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
