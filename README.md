# Coffee Beans — dual-iPad coffee orders

A café kiosk web app for two iPads:

- **Customer iPad** (`/customer`) — large-button drinks and donut packs, cart, and place order (no payment)
- **Barista iPad** (`/barista`) — live FIFO queue, mark ready / done, short completed history

Orders sync in real time over Server-Sent Events. The queue is saved to disk so a refresh does not lose tickets.

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

Local orders are stored at `data/orders.json` (created automatically).

## Dual-iPad setup (same Wi-Fi)

Use this when you are running the app on a laptop in the café. For hosting with no laptop, see [Deploy on Railway](#deploy-on-railway).

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

## Deploy on Railway

Host the app so both iPads use Safari on a public HTTPS URL — no café laptop required.

1. Push this repo to GitHub (or merge this branch) and open [Railway](https://railway.com).
2. **New Project** → **Deploy from GitHub repo** and select this repository.
3. Railway will install, run `npm run build`, then start with **`npm start`** (already set in `railway.json`). You do not need a custom start command unless you changed the service settings. `npm start` is `next start --hostname 0.0.0.0` and honours Railway’s `PORT` variable.
4. **Volume (required so orders survive deploys):** in the service, add a volume and mount it at **`/data`**. Leave `ORDERS_PATH` unset — the app reads `RAILWAY_VOLUME_MOUNT_PATH` and writes `orders.json` on that volume. Do **not** mount the volume at `/app/data` (that folder holds the drink menu in the app image).
5. Under **Settings → Networking**, generate a public domain.
6. Keep the service at **1 replica**. Live barista updates use an in-process event stream, and a volume is attached to a single instance.
7. On the **customer iPad**, open Safari to `https://YOUR-URL/customer`.
8. On the **barista iPad**, open Safari to `https://YOUR-URL/barista`.

Optional: Share → **Add to Home Screen** on each iPad.

Check `https://YOUR-URL/api/health` — `durable` should be `true` and `ordersPath` should look like `/data/orders.json` once the volume is mounted.

### Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `PORT` | Set by Railway | Listen port. Do not hardcode it. |
| `RAILWAY_VOLUME_MOUNT_PATH` | Set by Railway when a volume is attached | Orders are saved to `$RAILWAY_VOLUME_MOUNT_PATH/orders.json`. |
| `ORDERS_PATH` | No | Absolute or project-relative file for the queue. Overrides the volume default. Example: `/data/orders.json`. |
| `DATA_DIR` | No | Directory for `orders.json` if you are not using a Railway volume variable. |

No other secrets are required for v1 (no payments or accounts).

## Edit the menu

All drinks, donuts, sizes, extras and prices live in one file:

```text
data/menu.json
```

Amounts are in **pence** (`400` = £4.00). After a change, refresh the customer iPad (in production, redeploy or restart the server).

Useful fields:

- `cafeName` / `tagline` — shown on the home and kiosk screens
- `drinks[].name`, `description`, `sizes[]` — most coffees are one size; espresso still has Single / Double
- `drinks[].extras` — which extras from the shared `extras` list are allowed on that drink
- `teas[]` — tea, decaf tea and green tea (one size at £3, no extras), shown in their own kiosk section
- `milkshakes[]` — strawberry, vanilla and chocolate (one size at £5), with or without cream at no extra charge
- `bobas[]` — tropical with mango boba, mango and dragon fruit, raspberry and pineapple with pineapple boba (one size at £4, no extras)
- `donuts[]` — topping/style plus pack sizes (`2 donuts`, `4 donuts`, `6 donuts`) matching the truck
- `extras[].pricePence` and `group` — `milk` options are mutually exclusive; syrup flavours are mutually exclusive; `cream` is a yes/no choice on milkshakes; `shot` and a syrup flavour can combine with milk

Starter prices (GBP):

| Drink | Price |
| --- | --- |
| Espresso | Single £2.50 / Double £3.00 |
| Americano | £3.50 |
| Latte, Cappuccino, Flat white | £4.00 |
| Mocha | £4.50 |
| Tea, Decaf tea, Green tea | £3.00 |
| Strawberry, Vanilla, Chocolate milkshake | £5.00 |
| Tropical with mango boba; Mango and dragon fruit; Raspberry and pineapple with pineapple boba | £4.00 |

Extras: oat milk +£0.50, extra shot +£0.50, syrup flavour +£0.50 (caramel, hazelnut, vanilla, toasted marshmallow, pistachio, cherry or orange — one per drink). Milkshakes: with cream or no cream, no extra charge.

Donut packs (no singles — same bundles as the truck):

| Style | 2 | 4 | 6 |
| --- | --- | --- | --- |
| Sugared, Cinnamon | £3 | £5 | £6 |
| Nutella topped, Oreo & Nutella topped, Biscoff topped | £5 | £7 | £9 |

## Production (local or a café computer)

```bash
npm run build
npm start
```

This binds to `0.0.0.0` and uses port **3000** unless `PORT` is set. Put a reverse proxy (Caddy, nginx, or similar) in front if you want HTTPS on the café LAN.

## Tests

```bash
npm test
```

## Notes

- v1 has no payments, accounts, inventory, or printing.
- Completed tickets stay on the barista screen for a short time so they do not vanish the instant you tap **Done**.
- British English throughout the UI.
