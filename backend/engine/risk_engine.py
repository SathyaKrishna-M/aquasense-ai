import math
from simulator.zones import ZONES
from simulator.acoustics import get_acoustic_data
from simulator.ships import get_ships


def count_ships_near(ships, lat, lng, radius=4.0):
    return sum(
        1 for s in ships
        if abs(s["lat"] - lat) < radius and abs(s["lng"] - lng) < radius
    )


def calculate_risk(acoustic_level: float, ship_density: float, sensitivity: float) -> float:
    raw = acoustic_level * 0.4 + ship_density * 0.4 + sensitivity * 100 * 0.2
    return round(min(100.0, max(0.0, raw)), 1)


def get_full_state():
    ships = get_ships()
    acoustics = get_acoustic_data()
    result = []

    for zone in ZONES:
        zid = zone["id"]
        acoustic = acoustics.get(zid, {})
        noise = acoustic.get("noise", 40.0)
        sonar = acoustic.get("sonar", False)

        density_count = count_ships_near(ships, zone["lat"], zone["lng"])
        ship_density = min(100.0, density_count * 14)

        risk = calculate_risk(noise, ship_density, zone["sensitivity"])

        result.append({
            "id": zid,
            "name": zone["name"],
            "lat": zone["lat"],
            "lng": zone["lng"],
            "noise": noise,
            "sonar": sonar,
            "ship_density": ship_density,
            "sensitivity": zone["sensitivity"],
            "risk": risk,
        })

    return {"zones": result, "ships": ships}
