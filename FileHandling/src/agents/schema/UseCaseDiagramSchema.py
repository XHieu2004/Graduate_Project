# JSON Schema for Use Case Diagram
import json

JSON_USE_CASE_DIAGRAM_SCHEMA = {
    "diagramType": "Use Case Diagram",
    "diagramName": "string",
    "actors": [
        {
            "name": "string",
            "description": "string"
        }
    ],
    "useCases": [
        {
            "name": "string",
            "description": "string"
        }
    ],
    "relationships": [
        {
            "from": "string", # Actor name or Use Case name
            "to": "string",   # Use Case name or Use Case name
            "type": "association" # association, includes, extends, generalizes
        }
    ]
}

JSON_USE_CASE_DIAGRAM_SCHEMA_STRING = json.dumps(JSON_USE_CASE_DIAGRAM_SCHEMA, indent=2)

def VALIDATE_SCHEMA_USE_CASE_DIAGRAM(data):
    """
    Validates a dictionary against the Use Case Diagram schema.
    """
    if not isinstance(data, dict):
        return False
    if "diagramType" not in data or data["diagramType"] != "Use Case Diagram":
        return False
    if "diagramName" not in data or not isinstance(data["diagramName"], str):
        return False
    if "actors" not in data or not isinstance(data["actors"], list):
        return False
    if "useCases" not in data or not isinstance(data["useCases"], list):
        return False
    if "relationships" not in data or not isinstance(data["relationships"], list):
        return False
    return True
