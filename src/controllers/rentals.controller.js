import dayjs from "dayjs";
import connection from "../database/db.connection.js";
import customParseFormat from 'dayjs/plugin/customParseFormat.js';
import utc from "dayjs/plugin/utc.js";

dayjs.extend(customParseFormat);
dayjs.extend(utc);
const date = dayjs().utcOffset(0).format("YYYY-MM-DD");

export async function getRentals(req, res) {
  try {
    const rentals = await connection.query("SELECT * FROM rentals;");

    // const editedRentals = {
    //   ...rentals.rows,
    //   customer: rentals.rows.map((rent, i) => {
    //       id: rent.rows[i].customerId,
    //   }),
    //   game:
    // }
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
    const customer = await connection.query("SELECT * FROM customers WHERE customers.id = $1;", [customerId]);
    if (!customer.rows[0]) return res.status(400).send("Cliente não existe");

    const game = await connection.query("SELECT * FROM games WHERE games.id = $1;", [gameId]);
    if (!game.rows[0]) return res.status(400).send("Jogo não existe");

    const { stockTotal } = game.rows[0];
    if (stockTotal === 0) return res.status(400).send("Jogo não está em estoque");

    const { pricePerDay } = game.rows[0];
    const originalPrice = (Number(pricePerDay) * Number(daysRented)) * 100;

    await connection.query(
      `INSERT INTO rentals("customerId", "gameId", "rentDate", "daysRented", "returnDate", "originalPrice", "delayFee")
        VALUES($1, $2, $3, $4, $5, $6, $7);`,
      [customerId, gameId, date, daysRented, null, originalPrice, null],
    );

    const newStock = stockTotal - 1;
    await connection.query(`UPDATE games SET "stockTotal" = $1 WHERE id = $2 ;`, [newStock, gameId]);

    res.status(201).send("Aluguel criado com sucesso");
  } catch (err) {
    res.status(500).send(err.message);
  }
}

export async function finalizeRent(req, res) {
  const { id } = req.params;
  if (!id) return res.sendStatus(404);

  try {
    const rental = await connection.query("SELECT * FROM rentals WHERE rentals.id = $1;", [id]);
    if (!rental.rows[0]) return res.status(404).send("Aluguel não existe");
    if (rental.rows[0].returnDate !== null) return res.status(400).send("Aluguel já foi finalizado");
    const { daysRented, rentDate, returnDate } = rental.rows[0];

    const game = await connection.query("SELECT * FROM games WHERE games.id = $1;", [rental.rows[0].gameId]);
    const { pricePerDay } = game.rows[0];

    const expectedReturnDate = dayjs(rentDate).add(daysRented, "day");
    const actualReturnDate = dayjs(returnDate);
    const delayDays = actualReturnDate.diff(expectedReturnDate, "day");

    const delayFee = delayDays > 0 ? (delayDays * pricePerDay) * 100 : 0;

    await connection.query(`UPDATE rentals SET "returnDate" = $1, "delayFee" = $2 WHERE id = $3;`, [date, delayFee, id]);

    res.send("Aluguel finalizado com sucesso");
  } catch (err) {
    res.status(500).send(err.message);
  }
}

export async function deleteRent(req, res) {
  const { id } = req.params;
  if (!id) return res.sendStatus(404);

  try {
    const rental = await connection.query("SELECT * FROM rentals WHERE rentals.id = $1;", [id]);
    if (!rental.rows[0]) return res.status(404).send("Aluguel não existe");
    if (rental.rows[0].returnDate === null) return res.status(400).send("Aluguel não foi finalizado, verifique se o jogo foi devolvido");

    await connection.query("DELETE FROM rentals WHERE rentals.id = $1;", [Number(id)],);

    res.send("Aluguel deletado");
  } catch (err) {
    res.status(500).send(err.message);
  }
}
