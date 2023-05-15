import joi from "joi";

export const customerSchema = joi.object({
  name: joi.string().required(),
  phone: joi.string().pattern(new RegExp('^\\d{11}$')).min(10).max(11)
    .required(),
  cpf: joi.string().pattern(/^[0-9]+$/, "numbers").length(11).required(),
  birthday: joi.date().max("now").iso().required(),
});
