const axios = require("axios");
const pdf = require("pdf-parse");
const { v4: uuidv4 } = require("uuid");

const PDF_URL = "http://ezport.hipg.lk/Localfolder/Berthing/CQYB.pdf";
const VALID_PORTS = ["Mundra", "Deendayal", "Mumbai", "Pipavav"];

async function downloadPDF(url) {
  const res = await axios.get(url, { responseType: "arraybuffer" });
  return res.data;
}

async function extractDataFromPDF(buffer) {
  const data = await pdf(buffer);
  const lines = data.text.split("\n");
  const result = [];
  const today = new Date();
  const minETA = new Date(today.getTime() - 20*24*60*60*1000);
  const maxETA = new Date(today.getTime() + 20*24*60*60*1000);

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
      batch_id: uuidv4()
    });
  }

  return result;
}

exports.handler = async () => {
  try {
    const buffer = await downloadPDF(PDF_URL);
    const ships = await extractDataFromPDF(buffer);
    return { statusCode: 200, body: JSON.stringify(ships) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
