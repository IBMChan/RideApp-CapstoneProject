# rideUtils.py
import sys
import json
import math

def haversine(lat1, lon1, lat2, lon2):
    R = 6371  # km
    dLat = math.radians(lat2 - lat1)
    dLon = math.radians(lon2 - lon1)
    a = math.sin(dLat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dLon / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

def calculate_distance(data):
    pickup = data["pickup"]
    drop = data["drop"]
    distance = haversine(pickup["lat"], pickup["lng"], drop["lat"], drop["lng"])
    return {"distance": round(distance, 2)}

def calculate_fare(data):
    pickup = data["pickup"]
    drop = data["drop"]
    distance = haversine(pickup["lat"], pickup["lng"], drop["lat"], drop["lng"])
    fare = round(distance * 15, 2)  # ₹15 per km
    return {"distance": round(distance, 2), "fare": fare}

if __name__ == "__main__":
    method = sys.argv[1]
    params = json.loads(sys.argv[2])

    if method == "distance":
        print(json.dumps(calculate_distance(params)))
    elif method == "fare":
        print(json.dumps(calculate_fare(params)))
    else:
        print(json.dumps({"error": "Unknown method"}))
