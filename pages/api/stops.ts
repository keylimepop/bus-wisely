// pages/api/stops.ts
import type { NextApiRequest, NextApiResponse } from "next";
import stopsData from "../../data/stops.json"; // GTFS stops file

type Stop = {
  stop_id: string;
  stop_name: string;
  stop_lat: string;
  stop_lon: string;
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { lat, lon } = req.query;
  if (!lat || !lon) return res.status(400).json({ error: "Missing lat/lon" });

  const userLat = parseFloat(lat as string);
  const userLon = parseFloat(lon as string);

  const nearest = (stopsData as Stop[])
    .map((stop) => ({
      ...stop,
      stop_lat: Number(stop.stop_lat),
      stop_lon: Number(stop.stop_lon),
      distance: Math.sqrt(
        (Number(stop.stop_lat) - userLat) ** 2 +
          (Number(stop.stop_lon) - userLon) ** 2
      ),
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 15);

  res.status(200).json(nearest);
}
