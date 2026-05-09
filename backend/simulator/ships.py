import random
import math

SHIP_TYPES = ["cargo", "tanker", "fishing", "naval", "research"]

_ships = []

def _init_ships():
    global _ships
    _ships = []
    for i in range(18):
        in_bob = i < 10
        _ships.append({
            "id": i + 1,
            "lat": (10 + random.random() * 10) if in_bob else (11 + random.random() * 14),
            "lng": (79 + random.random() * 8) if in_bob else (62 + random.random() * 12),
            "speed": round(10 + random.random() * 35, 1),
            "type": random.choice(SHIP_TYPES),
            "heading": random.random() * 360,
            "region": "BOB" if in_bob else "AS",
        })

_init_ships()

def get_ships():
    return [dict(s) for s in _ships]

def tick_ships():
    for ship in _ships:
        rad = math.radians(ship["heading"])
        speed = ship["speed"] / 3000
        ship["lat"] += math.cos(rad) * speed
        ship["lng"] += math.sin(rad) * speed
        ship["heading"] += (random.random() - 0.5) * 8

        if ship["region"] == "BOB":
            if ship["lat"] < 8 or ship["lat"] > 22: ship["heading"] += 180
            if ship["lng"] < 78 or ship["lng"] > 92: ship["heading"] += 180
        else:
            if ship["lat"] < 8 or ship["lat"] > 26: ship["heading"] += 180
            if ship["lng"] < 58 or ship["lng"] > 76: ship["heading"] += 180

        ship["heading"] %= 360
        ship["lat"] = round(ship["lat"], 4)
        ship["lng"] = round(ship["lng"], 4)
