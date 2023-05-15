import joi from "joi";

export const rentSchema = joi.object({
  customerId: joi.number().integer().positive().required(),
  gameId: joi.number().integer().positive().required(),
  daysRented: joi.number().integer().positive().required(),
});
