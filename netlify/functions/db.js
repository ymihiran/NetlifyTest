const { MongoClient } = require("mongodb");

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

module.exports = { getDB };
