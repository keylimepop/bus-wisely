"use client";

import { useEffect, useState } from "react";
import axios from "axios";

type Stop = {
  stop_id: string;
  stop_name: string;
  stop_lat: number;
  stop_lon: number;
};

type Arrival = {
  trip: string;
  arrivals: number[];
};

export default function Home() {
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(
    null
  );
  const [stops, setStops] = useState<Stop[]>([]);
  const [buses, setBuses] = useState<Record<string, Arrival[]>>({});

  // Get user location
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      (err) => console.error(err)
    );
  }, []);

  // Fetch nearest stops when we have location
  useEffect(() => {
    if (!location) return;

    axios
      .get(`/api/stops?lat=${location.lat}&lon=${location.lon}`)
      .then((res) => setStops(res.data.slice(0, 15))) // top 15 stops
      .catch(console.error);
  }, [location]);

  // Fetch arrivals for each stop
  useEffect(() => {
    stops.forEach((stop) => {
      axios
        .get(`/api/arrivals?stopNo=${stop.stop_id}`)
        .then((res) =>
          setBuses((prev) => ({ ...prev, [stop.stop_id]: res.data }))
        )
        .catch(console.error);
    });
  }, [stops]);

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-4">🚍 Nearby Bus Times</h1>

      {!location && <p>Getting your location...</p>}

      {stops.map((stop) => (
        <div key={stop.stop_id} className="mb-6 border-b pb-2">
          <h2 className="font-semibold">{stop.stop_name}</h2>
          <table className="w-full border mt-2 table-fixed">
            <thead>
              <tr>
                <th className="border p-2 text-left w-1/2">Bus</th>
                <th className="border p-2 text-left w-1/2">Next Arrivals (min)</th>
              </tr>
            </thead>
            <tbody>
              {buses[stop.stop_id] ? (
                buses[stop.stop_id].map((arrival) => (
                  <tr key={arrival.trip}>
                    <td className="border p-2 w-1/2">{arrival.trip}</td>
                    <td className="border p-2 w-1/2">
                      {arrival.arrivals.slice(0, 3).join(", ")}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={2} className="border p-2 text-gray-500">
                    Loading...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ))}
    </main>
  );
}
