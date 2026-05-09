"""
Parses Darwin Core Archive occurrence.txt files from the datasets folder.
All four datasets are loaded once at startup and cached.
"""
import csv
import os
from pathlib import Path
from collections import defaultdict

DATASETS_DIR = Path(__file__).parent.parent / "datasets"

MAMMAL_DATASETS = [
    "dwca-zd_327-v1.0",   # Bahamas Marine Mammal Strandings
    "dwca-zd_502-v1.0",   # Virginia Aquarium Strandings 1988-2008
    "dwca-zd_820-v1.0",   # NMML Gulf of Alaska Survey 2003
]

COASTAL_DATASET = "dwca-coastal_and_marine_species-v1.0"

# ── Cached results (populated at startup) ────────────────────────────────────
_cache: dict = {}


def _read_occurrence(folder_name: str) -> list[dict]:
    path = DATASETS_DIR / folder_name / "occurrence.txt"
    if not path.exists():
        return []
    rows = []
    with open(path, encoding="utf-8", errors="replace") as f:
        reader = csv.DictReader(f, delimiter="\t")
        for row in reader:
            rows.append(row)
    return rows


def _safe_float(val: str) -> float | None:
    try:
        return float(val)
    except (ValueError, TypeError):
        return None


def load_all() -> dict:
    """Load and process all datasets. Returns the shared cache dict."""
    global _cache
    if _cache:
        return _cache

    # ── Marine mammal datasets ────────────────────────────────────────────
    mammal_rows: list[dict] = []
    for folder in MAMMAL_DATASETS:
        mammal_rows.extend(_read_occurrence(folder))

    # Species index: vernacularName → {scientific, count, datasets}
    species_index: dict[str, dict] = {}
    stranding_events: list[dict] = []

    for row in mammal_rows:
        vernacular  = (row.get("vernacularName") or "").strip()
        scientific  = (row.get("scientificName") or "").strip()
        order       = (row.get("order") or "").strip()
        family      = (row.get("family") or "").strip()
        lat         = _safe_float(row.get("decimalLatitude"))
        lng         = _safe_float(row.get("decimalLongitude"))
        year        = row.get("year", "").strip()
        month       = row.get("month", "").strip()
        dataset_id  = row.get("datasetID", "").strip()
        dataset_name = row.get("datasetName", folder).strip()
        habitat     = (row.get("habitat") or "").strip()
        remarks     = (row.get("occurrenceRemarks") or "").strip()

        if not vernacular or vernacular.lower() in ("cetaceans", "dolphins", "baleen whales", "beaked whales", "pilot whales", "pygmy sperm whales"):
            vernacular = scientific  # fall back to scientific name for groups

        key = vernacular.lower()
        if key not in species_index:
            species_index[key] = {
                "vernacularName": vernacular,
                "scientificName": scientific,
                "order":          order,
                "family":         family,
                "count":          0,
                "datasets":       set(),
            }
        species_index[key]["count"] += 1
        if dataset_name:
            species_index[key]["datasets"].add(dataset_name)

        if lat is not None and lng is not None:
            stranding_events.append({
                "lat":         lat,
                "lng":         lng,
                "year":        int(year) if year.isdigit() else None,
                "month":       int(month) if month.isdigit() else None,
                "vernacular":  vernacular,
                "scientific":  scientific,
                "dataset":     dataset_name,
                "habitat":     habitat,
                "remarks":     remarks,
            })

    # Convert sets → lists for JSON serialisation
    species_list = []
    for entry in species_index.values():
        entry["datasets"] = sorted(entry["datasets"])
        species_list.append(entry)
    species_list.sort(key=lambda x: -x["count"])

    # ── Coastal species dataset ───────────────────────────────────────────
    coastal_rows = _read_occurrence(COASTAL_DATASET)
    coastal_species: dict[str, dict] = {}
    for row in coastal_rows:
        vernacular  = (row.get("vernacularName") or "").strip()
        scientific  = (row.get("scientificName") or "").strip()
        if not vernacular:
            continue
        key = vernacular.lower()
        if key not in coastal_species:
            coastal_species[key] = {"vernacularName": vernacular, "scientificName": scientific, "count": 0}
        coastal_species[key]["count"] += 1

    coastal_list = sorted(coastal_species.values(), key=lambda x: -x["count"])

    # ── Year-wise stranding breakdown ─────────────────────────────────────
    by_year: dict[int, int] = defaultdict(int)
    for ev in stranding_events:
        if ev["year"]:
            by_year[ev["year"]] += 1
    yearly = [{"year": y, "count": c} for y, c in sorted(by_year.items())]

    # ── Build cache ────────────────────────────────────────────────────────
    _cache = {
        "mammal_species":      species_list,
        "coastal_species":     coastal_list,
        "stranding_events":    stranding_events,
        "stranding_yearly":    yearly,
        "total_strandings":    len(stranding_events),
        "total_mammal_species": len(species_list),
        "total_coastal_species": len(coastal_list),
        "dataset_summary": [
            {
                "id":     "zd_327",
                "name":   "Bahamas Marine Mammal Strandings",
                "source": "Bahamas Marine Mammal Research Organisation / OBIS-SEAMAP",
                "records": sum(1 for r in mammal_rows if "327" in r.get("datasetID",""))
            },
            {
                "id":     "zd_502",
                "name":   "Virginia Aquarium Strandings 1988–2008",
                "source": "Virginia Aquarium Stranding Response / OBIS-SEAMAP",
                "records": sum(1 for r in mammal_rows if "502" in r.get("datasetID",""))
            },
            {
                "id":     "zd_820",
                "name":   "NMML Gulf of Alaska Survey 2003",
                "source": "National Marine Mammal Laboratory / NOAA",
                "records": sum(1 for r in mammal_rows if "820" in r.get("datasetID",""))
            },
            {
                "id":     "coastal",
                "name":   "Coastal and Marine Species",
                "source": "National Biodiversity Data Centre, Ireland",
                "records": len(coastal_rows)
            },
        ],
    }
    return _cache
