import connection from "../database/db.connection.js";

export async function getCustomers(req, res) {
  try {
    const customers = await connection.query("SELECT * FROM customers;");
    customers.rows = customers.rows.map((customer) => ({
      ...customer,
      birthday: new Date(customer.birthday).toISOString().split("T")[0],
    }))

    res.send(customers.rows);
  } catch (err) {
    res.status(500).send(err.message);
  }
}

export async function getCustomerById(req, res) {
  const { id } = req.params;

  try {
    const customer = await connection.query("SELECT * FROM customers WHERE id = $1;", [id]);
    if (!customer.rows[0]) return res.status(404).send("Cliente não existe");

    res.send(customer.rows[0]);
  } catch (err) {
    res.status(500).send(err.message);
  }
}

export async function createCustomer(req, res) {
  const {
    name, phone, cpf, birthday,
  } = req.body;

  try {
    const isCpfUsed = await connection.query("SELECT * FROM customers WHERE customers.cpf = $1;", [cpf]);
    if (isCpfUsed.rows[0]) return res.status(409).send("CPF já está em uso");

    await connection.query(
      `INSERT INTO customers(name, phone, cpf, birthday)
        VALUES($1, $2, $3, $4);`,
      [name, phone, cpf, birthday],
    );

    res.status(201).send("Cliente cadastrado com sucesso");
  } catch (err) {
    res.status(500).send(err.message);
  }
}

export async function updateUser(req, res) {
  const { id } = req.params;
  const {
    name, phone, cpf, birthday,
  } = req.body;

  try {
    const customer = await connection.query("SELECT * FROM customers WHERE id = $1;", [id]);
    if (!customer.rows[0]) return res.status(404).send("Cliente não existe");
    if (customer.rows[0].cpf === cpf && customer.rows[0].id !== id) return res.status(400).send("CPF já em uso")

    await connection.query(
      `UPDATE customers SET name = $1, phone = $2, cpf = $3, birthday = $4
        WHERE customers.id = $5;`,
      [name, phone, cpf, birthday, id],
    );

    res.send("Dados atualizados!");
  } catch (err) {
    res.status(500).send(err.message);
  }
}
