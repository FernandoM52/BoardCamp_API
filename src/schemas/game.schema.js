import joi from "joi";

export const gameSchema = joi.object({
  name: joi.string().required(),
  image: joi.string().required(),
  stockTotal: joi.number().positive().integer().required(),
  pricePerDay: joi.number().positive().required(),
});
