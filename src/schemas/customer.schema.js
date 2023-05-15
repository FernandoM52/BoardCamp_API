import joi from "joi";

export const customerSchema = joi.object({
  name: joi.string().required(),
  phone: joi.string().pattern(/^[0-9]+$/, "numbers").min(10).max(11)
    .required(),
  cpf: joi.string().length(11).required(),
  birthday: joi.string().isoDate().strict().required(),
});
