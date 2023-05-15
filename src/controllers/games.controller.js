import connection from "../database/db.connection.js";

export async function getGames(req, res) {
  try {
    const games = await connection.query("SELECT * FROM games;");
    res.send(games.rows);
  } catch (err) {
    res.status(500).send(err.message);
  }
}

export async function createGame(req, res) {
  const {
    name, image, stockTotal, pricePerDay,
  } = req.body;

  try {
    const gameExist = await connection.query(
      "SELECT * FROM games WHERE games.name = $1;",
      [name],
    );
    if (gameExist.rows[0]) return res.status(409).send("Nome do jogo já existe");

    await connection.query(
      `INSERT INTO games(name, image, "stockTotal", "pricePerDay")
        VALUES($1, $2, $3, $4);`,
      [name, image, stockTotal, pricePerDay],
    );

    res.status(201).send("Jogo criado com sucesso");
  } catch (err) {
    res.status(500).send(err.message);
  }
}
