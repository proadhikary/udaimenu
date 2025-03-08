import csv
import json

# Read CSV and convert it to JSON
def csv_to_json(csv_filename, json_filename):
    data = {}

    with open(csv_filename, mode="r", encoding="utf-8") as file:
        reader = csv.DictReader(file)
        for row in reader:
            meal_time = row["time"].strip()
            meal_type = row["type"].strip()
            meal_entry = {day.lower(): row[day] for day in ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]}

            if meal_time not in data:
                data[meal_time] = {}

            data[meal_time][meal_type] = meal_entry

    with open(json_filename, mode="w", encoding="utf-8") as json_file:
        json.dump(data, json_file, indent=4)

# Run the conversion
csv_to_json("menu.csv", "menu.json")

print("✅ JSON file created: menu.json")