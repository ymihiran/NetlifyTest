const { getDB } = require("./db");

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, OPTIONS"
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "ok" };
  }

  try {
    const db = await getDB();
    const trackingCol = db.collection("tracking_links");

    const links = await trackingCol.find({}, { projection: { _id: 0, vessel_name: 1, tracking_link: 1 } }).toArray();

    return { statusCode: 200, headers, body: JSON.stringify(links) };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
