const { getDB } = require("./db");

exports.handler = async () => {
  try {
    const db = await getDB();
    const ordersCol = db.collection("orders");

    const pipeline = [
      { $sort: { order_date: -1 } },
      { $group: { _id: "$colour", latest_order_date: { $first: "$order_date" } } }
    ];

    const results = await ordersCol.aggregate(pipeline).toArray();
    const data = {};
    results.forEach(r => data[r._id] = r.latest_order_date.toISOString().split("T")[0]);

    return { statusCode: 200, body: JSON.stringify(data) };
  } catch(err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
