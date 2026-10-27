# CampusIQ friend location sharing — two-device setup

Friend locations only sync when both browsers talk to the **same running CampusIQ server process**. Running a separate `./campusiq` on each laptop creates two unrelated in-memory session stores.

## Recommended: HTTPS tunnel for two laptops

1. On the host Mac, start CampusIQ from this folder:
   ```sh
   ./run-mac.sh
   ```
   Leave this terminal running. CampusIQ listens on port 8080.
2. Install Cloudflare Tunnel (`cloudflared`) on the host Mac if it is not already installed.
3. In a second Terminal window, run:
   ```sh
   cloudflared tunnel --url http://localhost:8080
   ```
4. Copy the `https://….trycloudflare.com` URL that the command prints. Both devices must open **that exact same HTTPS URL**. Do not use `localhost` on the second laptop.
5. On device A, enter a name, click **Create new session**, enable **Share my live location**, then click **Join friend's session** if needed. Copy the invite link.
6. On device B, open the invite link (or enter the exact same code), enter a different name, enable **Share my live location**, and click **Join friend's session**.
7. Both participants must grant location permission. Their markers should appear on the same map and the peer list should update every few seconds.

The tunnel URL is temporary and changes when the tunnel restarts. Share it only with people you trust. CampusIQ's demo backend stores locations in memory and has no account system or persistent storage. Stop sharing when finished; close the tunnel and stop the server. Do not use this demo for safety-critical tracking.

## Why `localhost` did not work on two laptops

`localhost` always means “this device”. Laptop A's `http://localhost:8080` and laptop B's `http://localhost:8080` are different servers, so their session codes and location records never meet. A shared HTTPS URL solves both the common-server problem and browser geolocation's secure-context requirement.
