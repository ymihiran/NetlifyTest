const { getDB } = require("./db");

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, OPTIONS"
  };

  // Handle preflight
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "ok" };
  }

  try {
    const db = await getDB();
    const shipsCol = db.collection("ships");

    const latest = await shipsCol.find().sort({ timestamp: -1 }).limit(1).toArray();
    if (!latest.length) {
      return { statusCode: 404, headers, body: JSON.stringify({ error: "No records found" }) };
    }

    const latestBatchId = latest[0].batch_id;
    const ships = await shipsCol.find({ batch_id: latestBatchId }).sort({ timestamp: 1 }).toArray();

    const response = ships.map(ship => {
      ship._id = ship._id.toString();
      return ship;
    });

    return { statusCode: 200, headers, body: JSON.stringify(response) };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
