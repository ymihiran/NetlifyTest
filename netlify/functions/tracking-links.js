const { getDB } = require("./db");

exports.handler = async () => {
  try {
    const db = await getDB();
    const trackingCol = db.collection("tracking_links");

    // Get all tracking links, only vessel_name and tracking_link
    const links = await trackingCol.find({}, { projection: { _id: 0, vessel_name: 1, tracking_link: 1 } }).toArray();

    return {
      statusCode: 200,
      body: JSON.stringify(links)
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
