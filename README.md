# The Daily Grind — dual-iPad coffee orders

A café kiosk web app for two iPads on the same Wi-Fi:

- **Customer iPad** (`/customer`) — large-button menu, cart, and place order (no payment)
- **Barista iPad** (`/barista`) — live FIFO queue, mark ready / done, short completed history

Orders sync in real time over Server-Sent Events. Refreshing either iPad does not lose the queue (`data/orders.json`).

## Run locally

```bash
npm install
npm run dev
```

Then on the computer:

- Home: [http://localhost:3000](http://localhost:3000)
- Customer kiosk: [http://localhost:3000/customer](http://localhost:3000/customer)
- Barista queue: [http://localhost:3000/barista](http://localhost:3000/barista)

`npm run dev` already binds to `0.0.0.0:3000` so other devices on the LAN can connect.

## Dual-iPad setup (same Wi-Fi)

1. Start the app on a laptop, Mac mini, or Raspberry Pi on the café Wi-Fi (`npm run dev`, or `npm run build && npm start` for a longer shift).
2. Find that machine’s LAN address:
   - macOS: `ipconfig getifaddr en0`
   - Linux: `hostname -I`
   - Windows: `ipconfig` and use the IPv4 address
3. On the **customer iPad**, open Safari to `http://YOUR-LAN-IP:3000/customer`.
4. On the **barista iPad**, open Safari to `http://YOUR-LAN-IP:3000/barista`.
5. Optional: Share → **Add to Home Screen** so each iPad opens like a kiosk app. Use the same address; do not use `localhost` on the iPads.

Both iPads must talk to **the same host**. The barista screen updates as soon as a customer places an order — no pull-to-refresh.

On first use, tap **Enable new-order chime** on the barista iPad if you want an audible cue (Safari requires a tap before sound).

If the iPads cannot connect, check the café firewall allows port 3000 on the host machine.

## Edit the menu

All drinks, sizes, extras and prices live in one file:

```text
data/menu.json
```

Amounts are in **pence** (`380` = £3.80). After a change, refresh the customer iPad (in production, restart the server).

Useful fields:

- `cafeName` / `tagline` — shown on the home and kiosk screens
- `drinks[].name`, `description`, `sizes[]` — size `name` is what customers see (`Small`, `Regular`, `Large`, or `Single` / `Double` for espresso)
- `drinks[].extras` — which extras from the shared `extras` list are allowed on that drink
- `extras[].pricePence` and `group` — `milk` options are mutually exclusive; `shot` and `syrup` can combine with milk

Starter prices (GBP):

| Drink | Sizes |
| --- | --- |
| Espresso | Single £2.20 / Double £2.60 |
| Americano | Small £2.80 / Regular £3.20 / Large £3.60 |
| Latte, Cappuccino, Flat white | £3.40 / £3.80 / £4.20 |
| Mocha | £3.60 / £4.00 / £4.40 |

Extras: oat or almond milk +£0.40, extra shot +£0.60, syrup +£0.40.

## Production

```bash
npm run build
npm start
```

This also listens on `0.0.0.0:3000`. Put a reverse proxy (Caddy, nginx, or similar) in front if you want HTTPS on the café LAN.

## Tests

```bash
npm test
```

## Notes

- v1 has no payments, accounts, inventory, or printing.
- Completed tickets stay on the barista screen for a short time so they do not vanish the instant you tap **Done**.
- British English throughout the UI.
