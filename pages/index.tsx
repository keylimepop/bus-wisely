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
      (err) => console.error("Geolocation error:", err)
    );
  }, []);

  // Fetch nearest stops once location is available
  useEffect(() => {
    if (!location) return;

    axios
      .get(`/api/stops?lat=${location.lat}&lon=${location.lon}`)
      .then((res) => setStops(res.data)) // backend already limits to 15 unique stops
      .catch((err) => console.error("Error fetching stops:", err));
  }, [location]);

  // Fetch arrivals for each stop
  useEffect(() => {
    stops.forEach((stop) => {
      axios
        .get(`/api/arrivals?stopNo=${stop.stop_id}`)
        .then((res) =>
          setBuses((prev) => ({ ...prev, [stop.stop_id]: res.data }))
        )
        .catch((err) =>
          console.error(`Error fetching arrivals for ${stop.stop_id}:`, err)
        );
    });
  }, [stops]);

  return (
    <main className="p-6">
      <h1 className="text-3xl font-bold mb-4">Bus Wisely: is it time to dash?</h1>

      {!location && <p>Getting your location...</p>}

      {stops.map((stop) => (
        <div key={stop.stop_id} className="mb-6">
          <h2 className="font-bold mb-2">
            <span className="bg-white border-2 border-indigo-400 px-3 py-1 rounded-full inline-block">
              {stop.stop_name}
            </span>
          </h2>
          <table className="w-full mt-2 table-fixed border-separate border-spacing-0">
            <thead>
              <tr className="bg-indigo-900">
                <th className="p-2 text-left w-1/2 font-bold text-white border-b-2 border-indigo-400">Bus</th>
                <th className="p-2 text-left w-1/2 font-bold text-white border-b-2 border-indigo-400">Next Arrivals (min)</th>
              </tr>
            </thead>
            <tbody>
              {buses[stop.stop_id] ? (
                buses[stop.stop_id].map((arrival) => (
                  <tr key={arrival.trip} className="bg-indigo-50">
                    <td className="p-2 w-1/2 border-b border-indigo-100 border-r border-indigo-100">{arrival.trip}</td>
                    <td className="p-2 w-1/2 border-b border-indigo-100">{arrival.arrivals.slice(0, 3).join(", ")}</td>
                  </tr>
                ))
              ) : (
                <tr className="bg-indigo-50">
                  <td colSpan={2} className="p-2 text-gray-500 border-b border-indigo-100 border-r border-indigo-100">
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
