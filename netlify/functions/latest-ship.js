const { getDB } = require("./db");

exports.handler = async () => {
  try {
    const db = await getDB();
    const shipsCol = db.collection("ships");

    // Find the latest uploaded record
    const latest = await shipsCol.find().sort({ timestamp: -1 }).limit(1).toArray();
    if (!latest.length) {
      return { statusCode: 404, body: JSON.stringify({ error: "No records found" }) };
    }

    const latestBatchId = latest[0].batch_id;

    // Get all ships in that batch, sorted by timestamp
    const ships = await shipsCol.find({ batch_id: latestBatchId }).sort({ timestamp: 1 }).toArray();

    // Convert Mongo _id to string for JSON
    const response = ships.map(ship => {
      ship._id = ship._id.toString();
      return ship;
    });

    return {
      statusCode: 200,
      body: JSON.stringify(response)
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
