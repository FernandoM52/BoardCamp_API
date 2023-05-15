import dayjs from "dayjs";
import { connection } from "../database/db.connection.js";

const date = dayjs().format("YYYY-MM-DD");

export async function getRentals(req, res) {
  try {
    const rentals = await connection.query(
      `SELECT rentals.*, customers.id, customers.name AS "customerName", games.id, games.name as "gameName"
        FROM rentals
        JOIN customers ON customers.id = rentals."customerId"
        JOIN games ON games.id = rentals."gameId";`
    );

    rentals.rows = rentals.rows.map((rent) => ({
      ...rent,
      rentDate: new Date(rent.rentDate).toISOString().split("T")[0],
      returnDate: rent.returnDate === null ? null : new Date(rent.returnDate).toISOString().split("T")[0],
      customer: { id: rent.customerId, name: rent.customerName },
      game: { id: rent.gameId, name: rent.gameName },
    }));

    res.send(rentals.rows);
  } catch (err) {
    res.status(500).send(err.message);
  }
}

export async function createRent(req, res) {
  const {
    customerId, gameId, daysRented,
  } = req.body;

  try {
    const customer = await connection.query(
      "SELECT * FROM customers WHERE customers.id = $1;",
      [customerId],
    );
    if (!customer.rows[0]) return res.status(400).send("Cliente não existe");

    const game = await connection.query(
      "SELECT * FROM games WHERE games.id = $1;",
      [gameId],
    );
    if (!game.rows[0]) return res.status(400).send("Jogo não existe");

    const { stockTotal, pricePerDay } = game.rows[0];

    const rentedGames = await connection.query(
      `SELECT * FROM rentals
        WHERE "gameId" = $1 AND "returnDate" IS NULL;`,
      [gameId],
    );
    if (rentedGames.rowCount >= stockTotal) return res.status(400).send("Jogo não está em estoque");
    console.log(rentedGames.rows);

    const originalPrice = (Number(pricePerDay) * Number(daysRented));

    await connection.query(
      `INSERT INTO rentals("customerId", "gameId", "rentDate", "daysRented", "returnDate", "originalPrice", "delayFee")
        VALUES($1, $2, $3, $4, $5, $6, $7);`,
      [customerId, gameId, date, daysRented, null, originalPrice, null],
    );

    res.status(201).send("Aluguel criado com sucesso");
  } catch (err) {
    res.status(500).send(err.message);
  }
}

export async function finalizeRent(req, res) {
  const { id } = req.params;

  try {
    const rental = await connection.query(
      `SELECT rentals.*, games."pricePerDay" AS "pricePerDay"
        FROM rentals
        JOIN games ON games.id = rentals."gameId"
        WHERE rentals.id = $1;`,
      [id],
    );
    if (!rental.rows[0]) return res.status(404).send("Aluguel não existe");
    if (rental.rows[0].returnDate !== null) return res.status(400).send("Aluguel já foi finalizado");

    const { daysRented, rentDate, pricePerDay } = rental.rows[0];
    const rentDateObj = dayjs(rentDate);
    const returnDateObj = dayjs();

    const daysDelayed = returnDateObj.diff(rentDateObj, "day") - daysRented;
    const delayFee = Math.max(0, daysDelayed) * pricePerDay;

    await connection.query(
      `UPDATE rentals SET "returnDate" = $1, "delayFee" = $2
        WHERE id = $3;`,
      [returnDateObj.format("YYYY-MM-DD"), delayFee, id],
    );

    res.send("Aluguel finalizado com sucesso");
  } catch (err) {
    res.status(500).send(err.message);
  }
}

export async function deleteRent(req, res) {
  const { id } = req.params;
  if (!id) return res.sendStatus(404);

  try {
    const rental = await connection.query(
      "SELECT * FROM rentals WHERE rentals.id = $1;",
      [id],
    );
    if (!rental.rows[0]) return res.status(404).send("Aluguel não existe");
    if (rental.rows[0].returnDate === null) return res.status(400).send("Aluguel não foi finalizado, verifique se o jogo foi devolvido");

    await connection.query(
      "DELETE FROM rentals WHERE rentals.id = $1;",
      [id],
    );

    res.send("Aluguel deletado");
  } catch (err) {
    res.status(500).send(err.message);
  }
}
