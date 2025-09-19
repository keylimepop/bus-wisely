/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";

type Stop = {
  stop_id: string;
  stop_name: string;
  stop_lat: number;
  stop_lon: number;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { lat, lon } = req.query;
  if (!lat || !lon) {
    return res.status(400).json({ error: "Missing lat/lon" });
  }

  const userLat = parseFloat(lat as string);
  const userLon = parseFloat(lon as string);

  // Fetch stops.json from GitHub
  const stopsUrl = "https://raw.githubusercontent.com/keylimepop/bus-wisely-data/main/data/stops.json";
  let stopsData: any[];
  try {
    const stopsRes = await axios.get(stopsUrl);
    stopsData = stopsRes.data;
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch stops.json" });
  }

  // Haversine distance function
  function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) ** 2;
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  }

  // Convert stop_lat and stop_lon to numbers and sort stops by distance to user
  const stops: Stop[] = (stopsData as any[]).map(stop => ({
    stop_id: stop.stop_id,
    stop_name: stop.stop_name,
    stop_lat: Number(stop.stop_lat),
    stop_lon: Number(stop.stop_lon),
  }));

  const sortedStops: Stop[] = stops.sort((a, b) => {
    const da = haversine(userLat, userLon, a.stop_lat, a.stop_lon);
    const db = haversine(userLat, userLon, b.stop_lat, b.stop_lon);
    return da - db;
  });

  // Filter by unique prefix (before "@")
  const seenPrefixes = new Set<string>();
  const uniqueStops: Stop[] = [];

  for (const stop of sortedStops) {
    const prefix = stop.stop_name.split("@")[0].trim();
    if (!seenPrefixes.has(prefix)) {
      seenPrefixes.add(prefix);
      uniqueStops.push(stop);
    }
    if (uniqueStops.length >= 15) break; // stop after getting 15 unique prefix stops
  }

  res.status(200).json(uniqueStops);
}
