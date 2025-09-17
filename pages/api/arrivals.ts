/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import * as GtfsRealtimeBindings from "gtfs-realtime-bindings";
import tripsData from "../../data/trips.json";

type Trip = {
  trip_id: string;
  route_id: string;
  trip_headsign: string;
};

// Lookup: tripId -> headsign
const trips: Trip[] = tripsData as Trip[];
const tripToHeadsign: Record<string, string> = {};
trips.forEach((t) => {
  tripToHeadsign[t.trip_id] = t.trip_headsign;
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { stopNo } = req.query;
  if (!stopNo) return res.status(400).json({ error: "Missing stopNo" });

  const apiKey = process.env.TRANSLINK_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "Missing API key" });

  try {
    // 1. Fetch GTFS realtime feed
    const response = await axios.get(
      `https://gtfsapi.translink.ca/v3/gtfsrealtime?apikey=${apiKey}`,
      { responseType: "arraybuffer" }
    );

    // 2. Decode
    const feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(
      new Uint8Array(response.data)
    );

    // 3. Group arrivals by trip headsign
    const arrivalsByHeadsign: Record<string, number[]> = {};

    feed.entity.forEach((entity: any) => {
      const tripUpdate = entity.tripUpdate;
      if (!tripUpdate || !tripUpdate.stopTimeUpdate) return;

      const tripId = tripUpdate.trip?.tripId || "";
      const headsign = tripToHeadsign[tripId] || "Unknown";

      tripUpdate.stopTimeUpdate.forEach((stu: any) => {
        if (stu.stopId === stopNo && stu.arrival?.time) {
          const arrivalMs = Number(stu.arrival.time) * 1000;
          const inMinutes = Math.max(
            0,
            Math.round((arrivalMs - Date.now()) / 60000)
          );
          if (!arrivalsByHeadsign[headsign]) arrivalsByHeadsign[headsign] = [];
          arrivalsByHeadsign[headsign].push(inMinutes);
        }
      });
    });

    // 4. Sort and trim (3 arrivals per trip headsign)
    const result = Object.entries(arrivalsByHeadsign).map(
      ([headsign, times]) => ({
        trip: headsign,
        arrivals: times.sort((a, b) => a - b).slice(0, 100),
      })
    );

    res.status(200).json(result);
  } catch (err: any) {
    console.error("Error fetching GTFS Realtime:", err);
    res.status(500).json({ error: "Failed to get realtime data" });
  }
}
