# CampusIQ — MUJ Real Map + DSA Features (v25 combined GeoJSON + POI pins)

## Run on macOS
```bash
make clean
make
./campusiq
```
Open http://localhost:8080. Stop with Ctrl+C.

## Included
- One Leaflet map using OpenStreetMap tiles and attribution.
- Searchable campus destination directory covering AB blocks, Central/New Library, AWS Lab, Mechanical Workshop, XRD Lab, Lecture Hall Complex, Dome, workshop, auditorium, cafeteria, sports, admin, hostel/mess and main gate.
- In-app turn-by-turn walking route requested from the OpenStreetMap pedestrian routing service and drawn on the Leaflet map. Step instructions include turn direction, road/path name where available, segment distance, total distance, and estimated walking time. No Google Maps redirect.
- Light pastel interface.
- UI controls for accessibility preference, crowd-aware routing, closure testing, timetable entry, and intermediate stops.
- C HTTP server and Dijkstra implementation in `src/`.

## Important limitation
This is a DSA prototype, not a verified real-time indoor navigation service. The classroom directory contains sample room labels and approximate building-level coordinates. The C Dijkstra graph uses schematic demo nodes/edges and is **not georeferenced to the Leaflet map**. The new preference controls are UI demonstrations; they do not yet send geographic routes to the C backend. Crowd levels and closures are not live feeds. The timetable helper saves an entry for the current page session and helps search the room code; it is not yet connected to an official timetable.

To make room-level routing accurate, replace sample room entries in `public/realmap.js` and graph data in `src/graph.c` with MUJ-verified room/floor coordinates and a connected walkable-path network. Live crowd/closure routing requires a trusted data source.

Map tiles © OpenStreetMap contributors. Follow https://operations.osmfoundation.org/policies/tiles/; do not bulk-download tiles.

## Campus coverage notes
- The destination directory includes user-requested campus facilities and other common destinations.
- AB1/AB2 pins are approximate reference anchors only.
- Destinations without coordinates are listed but cannot be routed until verified coordinates are added. The website does not redirect to Google Maps.
- Full campus coverage needs an official/verified campus POI dataset and walkable paths. A community reference map is linked in the interface at https://manipalmaplive.vercel.app/.
- Names like “New Library”, “AWS Lab”, and “XRD Lab” should be confirmed against the current campus signage/map before assigning exact pins.

## In-app directions status
The app requests a pedestrian route from the public FOSSGIS OSRM foot router using OpenStreetMap data and displays turn-by-turn instructions in CampusIQ. It is a best-effort route based on mapped paths; MUJ-specific footpaths may be missing, and the AB1/AB2 pins in this starter are approximate building anchors. Room-level and indoor directions require verified room coordinates, entrances, floor plans, and paths. The public routing service is for light use and has no uptime guarantee; see https://routing.openstreetmap.de/about.html.

## Food & cafe directory (v11 update)
The searchable directory now includes reported food outlets and cafes around MUJ, including campus/hostel-area outlets and a few clearly labelled nearby off-campus options. Outlet names and location cues were gathered from public MUJ/student guides and public business listings; availability and outlet names can change. The current directory stores user-supplied Google Maps place-pin coordinates for the locations where a specific place URL was provided. Some directory entries still have no confirmed pin; CampusIQ does not invent coordinates for those entries and may try a public OpenStreetMap search when directions are requested. Place pins are not proof of a door-level indoor route.


## v12 theme and indoor-routing readiness
- Updated the interface to a beige, cream and brown colour theme.
- Updated map and directory copy so it no longer suggests Google Maps redirects for missing coordinates.
- Added an indoor-navigation readiness panel explaining the required verified data for exact classroom/lab routes, including floor plans, room doors, entrances, staircases, lifts and accessible links between floors.
- Outdoor turn-by-turn instructions use the OpenStreetMap foot-routing service when mapped coordinates and pedestrian paths are available.
- Exact indoor directions are not enabled yet: no verified MUJ floor plans or room-level route graph were supplied. Do not treat approximate AB1/AB2 anchors as classroom-door coordinates.


## Coordinate accuracy note (v13)

Some destinations now use publicly mapped OpenStreetMap coordinates: Sharda Pai Auditorium (26.84333, 75.56575), Administrative Block (26.84175, 75.56589), and Material Science Lab on the AB1 corridor (26.84319, 75.56465). These are mapped point/building locations, not verified entrance-door coordinates. Room numbers such as AB1-101 or AB2-204 currently inherit a building pin and must not be treated as exact classroom-door locations. Exact indoor directions require a verified floor plan with room positions, entrances, corridors, staircases, and lifts. Do not describe these coordinates as exact indoor navigation.

## v15: map tap and friend location sharing
- Tap any point on the Leaflet map to drop a pin and display its latitude/longitude. The popup offers “Use as destination” so the selected point can be used for an in-app outdoor route (routing still depends on mapped footpaths).
- Added opt-in location sharing by display name and shared session code. Participants in the same session send their browser location every 5 seconds; other participants appear as markers on the map.
- Sharing is a lightweight demo feature: locations are stored in server memory only and disappear when the C server restarts. It has no login, encryption beyond whatever transport the host provides, or abuse protection. Use only on a trusted network with people who consent. For friends connecting from different networks, deploy the backend on a public HTTPS server; `localhost` alone is not remotely accessible.
- To stop sharing, untick the sharing checkbox. Use different names in the same session. Geolocation works only when the browser permits it (localhost is treated as a secure context).
- Beige/brown theme overrides were strengthened in this version.


## Imported campus GeoJSON routing data

The user-provided Overpass Turbo export is bundled at `public/export.geojson` (OpenStreetMap ODbL attribution applies). CampusIQ draws mapped path/corridor line features and uses their connected LineString vertices as a local fallback routing graph if both public pedestrian routing services fail. The local fallback only routes where the exported paths are connected and within 180 m of the mapped graph. Elevator polygons are displayed only indirectly as map data and are not automatically connected as vertical graph edges; exact room doors/floor transitions still require verified floor plans and OSM level mapping.


## Live friend-location sharing (important deployment requirement)

The C backend now handles concurrent browser requests and protects shared session data with a mutex. It returns all active participants for the requested session and expires inactive participants after 30 seconds.

**Both participants must open the same server origin.** Do not run `./campusiq` independently on both laptops and use `localhost:8080` on each: each localhost is a different server and has separate in-memory session data. For same-Wi-Fi testing, run the server on one host and open that host's LAN IP on the other device; however, browser geolocation generally requires HTTPS (except localhost), so real multi-device GPS requires deploying the site behind HTTPS on one shared host.

On both devices, use the same HTTPS website address, create a new session on one device, then enter that exact code and click **Join friend's session** on the other. Both users must enable sharing and grant location permission.


## v25: imported complete supplied campus GeoJSON + place pins

- Replaced `public/export.geojson` with the exact GeoJSON uploaded in this conversation (`export (1).geojson`; OpenStreetMap/Overpass export timestamp 2025-08-11). It contains 194 features: 188 LineStrings and 6 elevator-footprint Polygons, with 1,311 coordinate vertices in total. All source feature coordinates are retained.
- The map now renders the elevator footprints as well as mapped path/corridor linework. The local walking graph is built from connected, allowed pedestrian/path LineString segments; elevator polygons are displayed but are **not** automatically connected as indoor vertical route edges.
- Added user-provided Google Maps place-pin coordinates to the searchable destination directory and displayed in-area POI markers. Directory map links now open the exact coordinate for pinned places. The Highland road pin is kept separate from the Highland business listing; it is not mislabelled as the restaurant entrance. Mangal Chai Ghar is retained but flagged outside the MUJ campus bounds because its supplied longitude (75.7749225) is far from the campus cluster (around 75.56).
- Friend sharing now continues polling peers even when local GPS is unavailable, avoids overlapping 4-second update loops, removes own markers when sharing is turned off, and shows explicit shared-origin/localhost warnings. The C server now reads complete HTTP request bodies across partial socket reads.

## Friend sharing deployment checklist

The backend stores live shares in memory in the one running C process. **Both participants must connect to the same backend origin and same server process.** If both open `http://localhost:8080`, each laptop talks to itself and the locations cannot cross between devices. For two-device GPS, deploy this app behind a single public HTTPS origin (required by browser geolocation on non-localhost origins), or use a properly configured HTTPS tunnel pointing to one running server. Do not launch separate servers for each participant. The share state resets when the server restarts and is only suitable for consent-based testing with trusted participants.

## Quick start on macOS

Run `./run-mac.sh` from this folder; it recompiles the C backend for the current Mac and starts it on port 8080. Open `http://localhost:8080` on the same Mac. For cross-device friend GPS, follow `FRIEND_SHARING_SETUP.md` to use one shared HTTPS tunnel URL on both devices.


## Directory UI update (v26)
- Removed all per-card “Find on Google Maps” links; directory cards select destinations within CampusIQ.
- Brown dots on the map are selectable directory destination markers for entries with coordinates. Classroom/building anchors may be approximate.
- AB1/AB2 classroom entries display the block name as the title and room number in a separate labeled field; search and dropdown still support the room number.


### Named destination map markers (v28)

CampusIQ directory pins now render as brown map-pin icons with always-visible destination-name labels, rather than unlabeled brown circles. Click a marker to select that destination. Labels may overlap in dense areas; zoom in to separate them.


### Map display update (v29)

Removed custom brown directory pin overlays and their always-visible labels. The basemap's own labels remain visible. Selecting a directory/search/dropdown destination pans the map to its coordinates without adding a custom destination marker. This avoids clutter but does not add native map labels for places that the basemap itself does not label.


### Destination marker display (v30)

Directory destinations with valid in-campus coordinates are marked with small, subtle brown dots without always-visible text labels. Click a dot to see the destination name/details or select it. Locations with approximate or missing coordinates are not represented as exact entrance markers.


### Map-style destination labels (v31)

Destinations with valid coordinates render with a category glyph and a compact, light label resembling native POI labels rather than generic brown dots. Markers remain clickable to select the destination. They are overlays and may overlap in dense areas; zoom in to separate them.


### Engraved-style campus labels (v32)

The permanent emoji markers, dots, and tooltip boxes have been replaced with a canvas label layer. Destination names are drawn as plain map-style text over the map surface, with a subtle pale halo and collision avoidance. Labels appear at zoom 17 and above, and are redrawn when the map moves or zooms. These labels are rendered client-side over the basemap rather than baked into raster tile files; this avoids modifying or redistributing third-party map tiles while achieving the intended integrated look.


### Search/dropdown fix (v33)

Restored initialization of destination dropdown options and directory cards, which was accidentally removed while replacing the map marker layer. The destination search input event listener remains active. Search field and results are explicitly layered above the map for interaction.


### Timetable and attendance dashboard (v34)

- Upload timetable CSV (`day,start,end,subject,room,faculty`) or an `.ics` calendar export.
- Uploaded classes are displayed by weekday and stored in browser localStorage on this device.
- Upload attendance CSV (`subject,attended,conducted`) for subject-wise and overall attendance percentages.
- At/above 75%, “Can miss” is calculated as the maximum consecutive absences starting now if no further classes are attended in between. Below 75%, the dashboard instead shows consecutive classes required to recover to 75%.
- CSV template download buttons are included.
- This does not directly connect to SLCM. No SLCM credentials are requested or stored. Direct integration requires an official authorized API or university-approved connector.

## Academic tools (v35)
- **Quick attendance calculator:** enter classes conducted and classes attended; it calculates current percentage, the maximum consecutive classes that can be missed while staying at/above 75%, or the number of consecutive classes needed to recover to 75%.
- **Timetable photo reader:** upload a clear timetable image/screenshot. Browser OCR (Tesseract.js CDN) extracts text for review; because OCR can misread tables, review/correct the extracted text before importing. The most reliable reviewed format is CSV rows with `day,start,end,subject,room,faculty`.
- **Day-based timetable view:** select Today, a specific weekday, or All days. Room details display with each class when they were included in the uploaded timetable.
- **Academic calendar / holidays:** upload a CSV with `date,holiday,details` or an `.ics` calendar. Entries are saved locally in the browser. The official MUJ holiday list is not pre-filled; load the official calendar when available.

Attendance and holiday calculations depend on the data entered/uploaded and are not an official SLCM integration. Verify all extracted data and official attendance policies.


## Academic calendar and long-weekend planner (v38)
- The MUJ 2026–2027 academic calendar is bundled in the frontend and displayed for all students.
- Academic-calendar upload and clear controls have been removed; students do not upload the universal calendar.
- The personal timetable photo reader/upload remains separate and student-specific.
- The long-weekend planner uses the preloaded MUJ calendar to suggest breaks requiring 1–2 weekdays off. Calendar entries can include observances/events, so students must verify official no-class notices before planning absences.

## v45 timetable correction
- Weekday detection now uses a clustered header row rather than every occurrence of a weekday word in the OCR body, preventing faculty text from assigning all classes to Saturday.
- Reviewed CSV rows may omit start/end times; weekday and subject are sufficient to import a class, and the weekly view labels entries as 1st lecture, 2nd lecture, etc.
- Break/lunch/free-period entries display as BREAK. Room details are shown when detected or provided in the reviewed row.
- OCR results still need a visual review when the source timetable is blurry or its table grid is ambiguous.


## Timetable photo reader (v48)

The photo reader accepts PNG/JPG/JPEG and preprocesses images in-browser by enlarging small screenshots and applying grayscale/contrast enhancement before OCR. It attempts to infer weekday rows or columns from OCR word positions. If the layout cannot be mapped confidently, it shows the extracted text for correction instead of silently assigning classes to days. Review every subject, weekday, room and break before importing; no OCR system can guarantee perfect recognition for all image quality and table layouts.


### LHC location pin
The searchable directory now includes “Lecture Hall Complex (LHC)” and “LHC” aliases with an approximate campus map anchor (26.84235, 75.56595). This pin is explicitly marked approximate and should be checked against the official MUJ map before using it for precise turn-by-turn navigation.


## Timetable import note (v50)
The experimental timetable-photo/OCR feature has been removed because it could misread weekday columns and room numbers. Timetable display remains available through structured CSV or ICS import. The CSV template uses `day,start,end,subject,room,faculty`; select a weekday to see only that day's classes. Imported information is not inferred from photos.


## Map destination update (v58)
- Destination markers now use a CampusIQ-owned custom marker instead of Leaflet's default blue pin.
- Removed Google Maps wording and visible "verify exact location" copy from destination popups.
- Added usable coordinates for the campus destinations in the directory, including AB3, Dome Building, Central Library, New Library, AWS Lab, Mechanical Workshop, XRD Lab, Workshop Building, Ramdas Pai Amphitheatre, Food Court, Sports Complex, hostel/mess, MUJ Main Gate, DSW/001 AB1 and the listed food outlets.
- Tea Post's dropdown entry is now shown as GHS. Tea Post remains a search alias for compatibility.
- Mangal Chai Ghar has been moved to the Wild Garden area.
- Important: for locations where no coordinates were supplied, the current pins are approximate campus anchors for selection/routing and should be replaced with exact coordinates when available.
