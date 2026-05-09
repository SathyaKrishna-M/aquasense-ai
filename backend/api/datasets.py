from fastapi import APIRouter, Query
from data_loader import load_all

router = APIRouter(prefix="/api", tags=["datasets"])


@router.get("/species")
def get_species(
    group: str = Query("mammals", description="'mammals' or 'coastal'"),
    limit: int = Query(50, le=200),
):
    """All unique species from the mammal or coastal datasets."""
    data = load_all()
    key  = "mammal_species" if group == "mammals" else "coastal_species"
    return {
        "group":   group,
        "total":   len(data[key]),
        "species": data[key][:limit],
    }


@router.get("/incidents")
def get_incidents():
    """Marine mammal stranding statistics derived from the loaded datasets."""
    data = load_all()
    return {
        "total_strandings":     data["total_strandings"],
        "total_mammal_species": data["total_mammal_species"],
        "total_coastal_species":data["total_coastal_species"],
        "yearly_breakdown":     data["stranding_yearly"],
        "dataset_summary":      data["dataset_summary"],
    }


@router.get("/stranding-events")
def get_stranding_events(limit: int = Query(100, le=500)):
    """Individual stranding occurrence records with coordinates."""
    data = load_all()
    return {
        "total":  data["total_strandings"],
        "events": data["stranding_events"][:limit],
    }


@router.get("/datasets")
def get_dataset_summary():
    """Metadata summary for all loaded datasets."""
    data = load_all()
    return {"datasets": data["dataset_summary"]}
