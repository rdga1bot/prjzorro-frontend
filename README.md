# prjzorro-frontend

Next.js frontend for **Prozorro Analytics** — an open-source platform for analyzing Ukrainian public procurement data from [Prozorro](https://prozorro.gov.ua) (CC BY).

## Features

- Tender search with filters: region, CPV, buyer, risk level, amount range, date
- Risk flag dashboard (R001–R014) with scores and severity breakdown
- Company profiles: buyer/supplier history, relationship network graph (D3.js)
- Hromada (municipality) spending map
- CSV / XLSX export
- Email alert subscriptions

## Tech stack

- [Next.js 14](https://nextjs.org) (App Router, ISR)
- TypeScript, Tailwind CSS
- D3.js (force-directed company network)

## Getting started

```bash
cp .env.example .env.local
npm install
npm run dev
```

Environment variables:

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | API base URL (e.g. `http://localhost:8080`) |

## API

This frontend consumes the REST API documented in [prjzorro-schema](https://github.com/rdga1bot/prjzorro-schema).

## License

GNU General Public License v3.0 — see [LICENSE](LICENSE).

Data: Prozorro Public API, [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
