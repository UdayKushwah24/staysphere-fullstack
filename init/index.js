const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const mongoose = require("mongoose");
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const initData = require("./data.js");
const Listing = require("../models/listing.js");

const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });
const MONGO_URL = "mongodb://127.0.0.1:27017/airbnb";

main()
  .then(() => {
    console.log("connected to DB");
  })
  .catch((err) => {
    console.log(err);
  });

async function main() {
  await mongoose.connect(MONGO_URL);
}

const initDB = async () => {
  await Listing.deleteMany({});
  const dataWithGeometry = await Promise.all(
    initData.data.map(async (obj) => {
      const enriched = { ...obj, owner: "648c6b8f4f1a256f4d6f9e9b" };
      try {
        const response = await geocodingClient
          .forwardGeocode({ query: obj.location, limit: 1 })
          .send();
        const feature = response.body.features[0];
        if (feature && feature.geometry) {
          enriched.geometry = feature.geometry;
        } else {
          enriched.geometry = { type: "Point", coordinates: [0, 0] };
        }
      } catch (err) {
        console.warn(`Geocoding failed for ${obj.location}: ${err.message}`);
        enriched.geometry = { type: "Point", coordinates: [0, 0] };
      }
      return enriched;
    })
  );
  await Listing.insertMany(dataWithGeometry);
  console.log("data was initialized");
};

initDB();
