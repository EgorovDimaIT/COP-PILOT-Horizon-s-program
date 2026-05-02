def create_ngsi_grain_lot(lot_id: str, crop_type: str, protein_value: float, location_lat: float, location_lon: float, solana_hash: str):
    return {
        "id": f"urn:ngsi-ld:GrainLot:{lot_id}",
        "type": "GrainLot",
        "@context": [
            "https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld",
            "https://raw.githubusercontent.com/smart-data-models/dataModel.Agrifood/master/context.jsonld"
        ],
        "cropType": { "type": "Property", "value": crop_type },
        "protein": { "type": "Property", "value": protein_value, "unitCode": "P1" },
        "location": {
            "type": "GeoProperty",
            "value": {
                "type": "Point",
                "coordinates": [location_lon, location_lat]
            }
        },
        "solanaHash": { "type": "Property", "value": solana_hash }
    }
