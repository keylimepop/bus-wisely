# Bus Wisely

Bus Wisely is a Next.js + Tailwind app that displays upcoming bus arrivals at the nearest stops to the user. TransLink’s GTFS Realtime and static feeds are used, combining location data with live arrival predictions.

I was motivated to build Bus Wisely because I am blessed with three bus routes that take me from home to university – but that means I never know which stop to head for to catch the next arrival. I figured it would be nice to see at a glance which buses were arriving at various stops near me (including future arrivals) to help me decide which one to head towards for my best shot at catching a soonest-arriving option!

## Features
- Geolocation detection
- Retrieval and processing of GTFS static and realtime data
- Display of upcoming arrivals for multiple stops and routes
- Built with Next.js (Pages Router), Tailwind CSS, and TypeScript

## Planned Features
- Performance optimisation via caching and reducing data payloads
- User favourite stops and routes
- Search by any location; map integration
- Dark mode

## Tech Stack
- **Frontend**: Next.js, React, Tailwind CSS
- **Backend**: Next.js API routes, Axios
- **Data Sources**: TransLink GTFS Realtime & Static feeds
- **Language**: TypeScript
