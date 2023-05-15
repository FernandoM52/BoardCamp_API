import { Router } from "express";
import { validateSchema } from "../middlewares/validadeSchema.middleware.js";
import { rentSchema } from "../schemas/rent.schema.js";
import {
  createRent, deleteRent, finalizeRent, getRentals,
} from "../controllers/rentals.controller.js";

const rentalsRouter = Router();

rentalsRouter.get("/rentals", getRentals);
rentalsRouter.post("/rentals", validateSchema(rentSchema), createRent);
rentalsRouter.post("/rentals/:id/return", finalizeRent);
rentalsRouter.delete("/rentals/:id", deleteRent);

export default rentalsRouter;
