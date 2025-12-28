const { getDB } = require("./db");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };

  try {
    const payload = JSON.parse(event.body);
    const required = ["whatsapp_number", "order_date", "called_date", "colour"];
    if (!required.every(k => payload[k])) return { statusCode: 400, body: JSON.stringify({error:"Missing required fields"}) };

    const db = await getDB();
    const ordersCol = db.collection("orders");

    await ordersCol.insertOne({
      whatsapp_number: payload.whatsapp_number,
      order_date: new Date(payload.order_date),
      called_date: new Date(payload.called_date),
      colour: payload.colour,
      timestamp: new Date()
    });

    return { statusCode: 201, body: JSON.stringify({ message: "Order saved successfully" }) };
  } catch(err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
