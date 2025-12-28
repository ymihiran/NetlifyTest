const axios = require("axios");
const pdf = require("pdf-parse");
const { MongoClient } = require("mongodb");
const { v4: uuidv4 } = require("uuid");

// MongoDB setup
const uri = "mongodb+srv://yasantha:Yasantha%40123@fronxc.mhfwocx.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(uri);
let db;

async function getDB() {
  if (!db) {
    await client.connect();
    db = client.db("shipdb");
  }
  return db;
}

const PDF_URL = "http://ezport.hipg.lk/Localfolder/Berthing/CQYB.pdf";
const VALID_PORTS = ["Mundra", "Deendayal", "Mumbai", "Pipavav"];

// Helper to download PDF
async function downloadPDF(url) {
  const res = await axios.get(url, { responseType: "arraybuffer" });
  return res.data;
}

// Helper to extract ship data from PDF
async function extractDataFromPDF(buffer) {
  const data = await pdf(buffer);
  const lines = data.text.split("\n");
  const result = [];

  const today = new Date();
  const minETA = new Date(today.getTime() - 20 * 24 * 60 * 60 * 1000);
  const maxETA = new Date(today.getTime() + 20 * 24 * 60 * 60 * 1000);

  for (const line of lines) {
    const cols = line.split(/\s{2,}/);
    if (cols.length < 19) continue;

    const vesselType = cols[3]?.toLowerCase();
    if (!vesselType.includes("roro")) continue;

    const lastPort = cols[4]?.trim();
    if (!VALID_PORTS.includes(lastPort)) continue;

    result.push({
      vessel_name: cols[6].trim(),
      eta: cols[0],
      berth: cols[1].trim(),
      last_port: lastPort,
      next_port: cols[5].trim(),
      discharge: cols[13].trim(),
      loading: cols[14].trim(),
      remarks: cols[18].trim(),
      timestamp: new Date(),
    });
  }

  return result;
}

exports.handler = async (event) => {
  const db = await getDB();
  const ordersCol = db.collection("orders");
  const shipsCol = db.collection("ships");
  const trackingCol = db.collection("tracking_links");

  const { path, httpMethod, body } = event;

  try {
    // ----------------- /ships -----------------
    if (path === "/ships" && httpMethod === "GET") {
      const buffer = await downloadPDF(PDF_URL);
      const ships = await extractDataFromPDF(buffer);
      return { statusCode: 200, body: JSON.stringify(ships) };
    }

    // ----------------- /save-order -----------------
    if (path === "/save-order" && httpMethod === "POST") {
      const payload = JSON.parse(body);
      const required = ["whatsapp_number", "order_date", "called_date", "colour"];
      if (!required.every(k => payload[k])) return { statusCode: 400, body: JSON.stringify({error:"Missing required fields"}) };

      await ordersCol.insertOne({
        whatsapp_number: payload.whatsapp_number,
        order_date: new Date(payload.order_date),
        called_date: new Date(payload.called_date),
        colour: payload.colour,
        timestamp: new Date()
      });
      return { statusCode: 201, body: JSON.stringify({message: "Order saved successfully"}) };
    }

    // ----------------- /latest-orders -----------------
    if (path === "/latest-orders" && httpMethod === "GET") {
      const pipeline = [
        { $sort: { order_date: -1 } },
        { $group: { _id: "$colour", latest_order_date: { $first: "$order_date" } } }
      ];
      const results = await ordersCol.aggregate(pipeline).toArray();
      const data = {};
      results.forEach(r => data[r._id] = r.latest_order_date.toISOString().split("T")[0]);
      return { statusCode: 200, body: JSON.stringify(data) };
    }

    // ----------------- /upload-pdf -----------------
    if (path === "/upload-pdf" && httpMethod === "POST") {
      return { statusCode: 501, body: JSON.stringify({error:"File upload not yet supported in JS function"}) };
    }

    // ----------------- /latest-ship -----------------
    if (path === "/latest-ship" && httpMethod === "GET") {
      const latest = await shipsCol.find().sort({timestamp:-1}).limit(1).toArray();
      if (!latest.length) return {statusCode:404, body: JSON.stringify({error:"No records found"})};
      const latestBatchId = latest[0].batch_id;
      const ships = await shipsCol.find({batch_id: latestBatchId}).sort({timestamp:1}).toArray();
      return { statusCode: 200, body: JSON.stringify(ships) };
    }

    // ----------------- /add-tracking-link -----------------
    if (path === "/add-tracking-link" && httpMethod === "POST") {
      const payload = JSON.parse(body);
      if (!payload.vessel_name || !payload.tracking_link) return { statusCode:400, body: JSON.stringify({error:"Missing required fields"}) };

      await trackingCol.updateOne(
        { vessel_name: payload.vessel_name },
        { $set: { tracking_link: payload.tracking_link, timestamp: new Date() } },
        { upsert: true }
      );
      return { statusCode: 201, body: JSON.stringify({message:`Tracking link saved for ${payload.vessel_name}`})};
    }

    // ----------------- /tracking-links -----------------
    if (path === "/tracking-links" && httpMethod === "GET") {
      const links = await trackingCol.find({}, { projection: { _id:0, vessel_name:1, tracking_link:1 } }).toArray();
      return { statusCode: 200, body: JSON.stringify(links) };
    }

    return { statusCode: 404, body: JSON.stringify({error:"Not found"}) };

  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({error: err.message}) };
  }
};
