from flask import Flask, jsonify, render_template, url_for, request, redirect
import sqlalchemy
from sqlalchemy.ext.automap import automap_base
from sqlalchemy.orm import Session
from sqlalchemy import create_engine
from config import password
from geojson import Point, Feature, FeatureCollection, dumps, loads
import datetime

engine = create_engine(f'postgresql://postgres:{password}@localhost:5433/Activity_Replay')
# Declare a Base using `automap_base()`
Base = automap_base()
# Use the Base class to reflect the database tables
Base.prepare(engine, reflect=True)
# Assign table names to variables
Activities = Base.classes.activities
Trackpoints = Base.classes.track_data_points
# Create session
session = Session(engine)

# initiate app
app = Flask(__name__)

all_datapoints = session.query(Activities.act_id, Trackpoints.act_id).filter(Activities.act_id == Trackpoints.act_id).all()

import datetime 
  
def convert(n): 
    return str(datetime.timedelta(seconds = n))

# define routes
@app.route("/")
def index():
    return render_template("index.html")

@app.route("/summary/<activity_id>")
def summary_data(activity_id):
    # Get activity summary data
    data = session.query(Activities).filter_by(act_id=activity_id).first()
    duration = convert(round(data.act_tot_time, 0))
    # duration = convert(data.act_tot_time).split(".")[0]
    Dsum = {
    "id": data.act_id,
	"name": data.act_name,
	"date": data.act_date,
	"type": data.act_type,
	# "total_distance": (f'{round(data.act_distance, 2)}'),
    "total_distance": round(data.act_distance*0.000621371, 2),
	"duration": duration,
	"elevation_gain": (f'{data.act_elegain} Meters'),
	"elevation_loss": (f'{data.act_eleloss} Meters'),
	"avg_speed": (f'{round(data.act_avgspeed*2.24, 1)}'),
	"max_speed": (f'{round(data.act_max_speed*2.24, 1)}'),
	"timestamp": data.act_timestamp,
    "avg_hrt_rate": data.act_avg_hrt_rate,
    "max_hrt_rate": data.act_max_hrt_rate,
    "calories": data.act_calories,
    }
    return jsonify(Dsum)

@app.route("/trackpoints/<activity_id>")
def trackpoint_data(activity_id):
    data = session.query(Trackpoints).filter_by(act_id=activity_id).all()
    # data = session.query(all_datapoints).filter_by(act_id=activity_id).all()
    trackpoints = [{
        "id": trackpoint.act_id,
        "time": trackpoint.tr_time,
        "latitude": trackpoint.tr_latitude,
        "longitude": trackpoint.tr_longtitude,
        "hrt_rate": trackpoint.tr_hrt_rate,
        "speed": trackpoint.tr_speed,
        "altitude": trackpoint.tr_altitude,
        "distance": trackpoint.tr_distance,
    } for trackpoint in data]
    return jsonify(trackpoints)

@app.route("/all_data/<activity_id>")
def all_data(activity_id):
    # Get activity summary data
    data = session.query(Activities).filter_by(act_id=activity_id).first()
    tdata = session.query(Trackpoints).filter_by(act_id=activity_id).all()

    trackpoints = [{
        "id": trackpoint.act_id,
        "time": trackpoint.tr_time,
        "latitude": trackpoint.tr_latitude,
        "longitude": trackpoint.tr_longtitude,
        "hrt_rate": trackpoint.tr_hrt_rate,
        "speed": trackpoint.tr_speed,
        "altitude": trackpoint.tr_altitude,
        "distance": trackpoint.tr_distance,
    } for trackpoint in tdata],

    data = {
    "id": data.act_id,
	"name": data.act_name,
	"date": data.act_date,
	"type": data.act_type,
	"total_distance": data.act_distance,
	"duration": data.act_tot_time,
	"elevation_gain": data.act_elegain,
	"elevation_loss": data.act_eleloss,
	"avg_speed": data.act_avgspeed,
	"max_speed": data.act_max_speed,
	"timestamp": data.act_timestamp,
    "avg_hrt_rate": data.act_avg_hrt_rate,
    "max_hrt_rate": data.act_max_hrt_rate,
    "calories": data.act_calories,
    "trackpoints": trackpoints
    }
    return jsonify(data)

@app.route("/activity_dates")
def get_activity_dates():
    dates = []
    activity_data = session.query(Activities)
    for record in activity_data:
        (activities) = record
        if activities.act_date not in  dates:
            dates.append(activities.act_date)
    return jsonify(dates)

@app.route("/activity_numbers")
def get_unique_ids():
    ids = []
    for record in all_datapoints:
        (activity_act_id, trackpoint_act_id) = record
        if trackpoint_act_id not in ids:
            ids.append(trackpoint_act_id)
    return jsonify(ids)

import decimal
import flask.json

@app.route("/geojson/<activity_id>")
def geojson(activity_id):
    data = session.query(Trackpoints).filter_by(act_id=activity_id).order_by(Trackpoints.tr_distance).all()
    features = []
    
    for trackpoint in data:
        point = Point((trackpoint.tr_longtitude, trackpoint.tr_latitude))
        properties = {
            "id": trackpoint.act_id,
            "time": trackpoint.tr_time,
            "latitude": trackpoint.tr_latitude,
            "longitude": trackpoint.tr_longtitude,
            "hrt_rate": trackpoint.tr_hrt_rate,
            "altitude": trackpoint.tr_altitude,
            "distance": trackpoint.tr_distance,
            "speed": trackpoint.tr_speed
        }
        
        features.append(Feature(geometry=point, properties=properties))
        
    feature_collection = FeatureCollection(features)

    dump = dumps(feature_collection)
    geojson = loads(dump)

    return geojson

if __name__ == "__main__":
    app.run(debug=True)