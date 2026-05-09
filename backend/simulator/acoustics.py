import random

_zones = {
    "B1": {"noise": 45.0, "sonar": False},
    "B2": {"noise": 38.0, "sonar": False},
    "B3": {"noise": 52.0, "sonar": False},
    "B4": {"noise": 41.0, "sonar": False},
    "B5": {"noise": 47.0, "sonar": False},
    "B6": {"noise": 35.0, "sonar": False},
    "A1": {"noise": 44.0, "sonar": False},
    "A2": {"noise": 50.0, "sonar": False},
    "A3": {"noise": 39.0, "sonar": False},
    "A4": {"noise": 33.0, "sonar": False},
    "A5": {"noise": 55.0, "sonar": False},
    "A6": {"noise": 37.0, "sonar": False},
}

def get_acoustic_data():
    return {k: dict(v) for k, v in _zones.items()}

def tick_acoustics():
    for zone_id, data in _zones.items():
        if not data["sonar"]:
            data["noise"] = round(
                min(100, max(20, data["noise"] + (random.random() - 0.48) * 4)), 1
            )

def trigger_spike(zone_id: str):
    if zone_id in _zones:
        _zones[zone_id]["noise"] = round(88 + random.random() * 12, 1)
        _zones[zone_id]["sonar"] = True

def clear_spike(zone_id: str):
    if zone_id in _zones:
        _zones[zone_id]["sonar"] = False
