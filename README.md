# AquaSense AI — Marine Risk Intelligence

A real-time marine environmental risk intelligence dashboard for monitoring acoustic pollution, vessel traffic, and ecological impact across the Bay of Bengal and Arabian Sea.

## Tech Stack

- **Frontend**: React + Vite + TailwindCSS v4 + Leaflet.js + Zustand + Recharts
- **Backend**: FastAPI + Python (local dev only)
- **Data**: OBIS-SEAMAP Darwin Core Archive datasets (2,046 stranding events, 42 species)

## Features

- Live ship simulation (cargo, tanker, fishing, naval, research vessels)
- Acoustic risk engine: `risk = acoustic×0.4 + density×0.4 + sensitivity×0.2`
- Multi-level alert system (critical / elevated / advisory)
- AI environmental analysis with species-level insights
- 4 view modes: Combined · Traffic · Acoustic · Sensitivity
- Marine biodiversity overlay with protected zones and whale corridors
- Collapsible analytics bar with risk trend and zone distribution charts
- Predictive zone forecasting (stable / escalating / critical / decreasing)

## Local Development

```bash
# Frontend
cd frontend
npm install
npm run dev

# Backend (optional — frontend works standalone)
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

## Deployment

Frontend is deployed on [Vercel](https://vercel.com). The simulation runs entirely client-side — no backend required for the live demo.
