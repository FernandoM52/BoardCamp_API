import { Router } from "express";
import { validateSchema } from "../middlewares/validadeSchema.middleware.js";
import { customerSchema } from "../schemas/customer.schema.js";
import {
  createCustomer, getCustomers, getCustomerById, updateCustomer,
} from "../controllers/customers.controller.js";

const customersRouter = Router();

customersRouter.get("/customers", getCustomers);
customersRouter.get("/customers/:id", getCustomerById);
customersRouter.post("/customers", validateSchema(customerSchema), createCustomer);
customersRouter.put("/customers/:id", validateSchema(customerSchema), updateCustomer);

export default customersRouter;
