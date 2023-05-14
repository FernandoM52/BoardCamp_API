import { Router } from "express";
import { createGame, getGames } from "../controllers/games.controller.js";
import { validateSchema } from "../middlewares/validadeSchema.middleware.js";
import { gameSchema } from "../schemas/game.schema.js";

const gamesRouter = Router();

gamesRouter.get("/games", getGames);
gamesRouter.post("/games", validateSchema(gameSchema), createGame);

export default gamesRouter;
