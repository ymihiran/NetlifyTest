const axios = require("axios");
const pdf = require("pdf-parse");

const PDF_URL = "http://ezport.hipg.lk/Localfolder/Berthing/CQYB.pdf";
const VALID_PORTS = ["Mundra", "Deendayal", "Mumbai", "Pipavav"];


exports.handler = async () => {
  try {
    const response = await axios.get(PDF_URL, {
      responseType: "arraybuffer",
    });

    const data = await pdf(response.data);
    const lines = data.text.split("\n");

    const result = [];

    for (const line of lines) {
      const cols = line.split(/\s{2,}/);

      if (cols.length < 19) continue;

      const vesselType = cols[3]?.toLowerCase();
      if (!vesselType || !vesselType.includes("roro")) continue;

      const lastPort = cols[4];
      if (!VALID_PORTS.includes(lastPort)) continue;

      result.push({
        vessel_name: cols[6],
        eta: cols[0],
        last_port: lastPort,
        next_port: cols[5],
        discharge: cols[13],
        loading: cols[14],
        remarks: cols[18],
      });
    }

    return {
      statusCode: 200,
      body: JSON.stringify(result),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
