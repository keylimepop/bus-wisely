/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import * as GtfsRealtimeBindings from "gtfs-realtime-bindings";
import routesData from "../../data/routes.json";
import tripsData from "../../data/trips.json";

type Route = {
  route_id: string;
  route_short_name: string;
};

type Trip = {
  trip_id: string;
  route_id: string;
};

// Map tripId -> route_short_name
const tripToRoute: Record<string, string> = {};
const routes: Route[] = routesData as Route[];
const trips: Trip[] = tripsData as Trip[];

trips.forEach((t) => {
  const route = routes.find((r) => r.route_id === t.route_id);
  if (route) tripToRoute[t.trip_id] = route.route_short_name;
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
    const response = await axios.get(
      `https://gtfsapi.translink.ca/v3/gtfsrealtime?apikey=${apiKey}`,
      { responseType: "arraybuffer" }
    );

    const feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(
      new Uint8Array(response.data)
    );

    // Group arrivals by route
    const arrivalsByRoute: Record<string, number[]> = {};

    feed.entity.forEach((entity: any) => {
      const tripUpdate = entity.tripUpdate;
      if (!tripUpdate || !tripUpdate.stopTimeUpdate) return;

      tripUpdate.stopTimeUpdate.forEach((stu: any) => {
        if (stu.stopId === stopNo && stu.arrival?.time) {
          const arrivalMs = Number(stu.arrival.time) * 1000;
          const inMinutes = Math.max(
            0,
            Math.round((arrivalMs - Date.now()) / 60000)
          );

          const routeShortName = tripUpdate.trip?.tripId
            ? tripToRoute[tripUpdate.trip.tripId] || "Unknown"
            : "Unknown";

          if (!arrivalsByRoute[routeShortName]) arrivalsByRoute[routeShortName] = [];
          arrivalsByRoute[routeShortName].push(inMinutes);
        }
      });
    });

    // Sort each route's arrivals and keep next 3
    for (const route in arrivalsByRoute) {
      arrivalsByRoute[route].sort((a, b) => a - b);
      arrivalsByRoute[route] = arrivalsByRoute[route].slice(0, 3);
    }

    res.status(200).json(arrivalsByRoute);
  } catch (err: any) {
    console.error("Error fetching GTFS Realtime:", err);
    res.status(500).json({ error: "Failed to get realtime data" });
  }
}