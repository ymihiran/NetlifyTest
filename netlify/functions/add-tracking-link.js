const { getDB } = require("./db");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method Not Allowed" }) };
  }

  try {
    const payload = JSON.parse(event.body);
    const required = ["vessel_name", "tracking_link"];

    if (!required.every(k => payload[k])) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing required fields" }) };
    }

    const db = await getDB();
    const trackingCol = db.collection("tracking_links");

    // Upsert: update if exists, else insert new
    await trackingCol.updateOne(
      { vessel_name: payload.vessel_name.trim() },
      {
        $set: {
          tracking_link: payload.tracking_link.trim(),
          timestamp: new Date()
        }
      },
      { upsert: true }
    );

    return {
      statusCode: 201,
      body: JSON.stringify({ message: `Tracking link saved for ${payload.vessel_name}` })
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
