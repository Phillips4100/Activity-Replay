from flask import Flask, jsonify, render_template, url_for, request, redirect
import sqlalchemy
from sqlalchemy.ext.automap import automap_base
from sqlalchemy.orm import Session
from sqlalchemy import create_engine
from config import password

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

all_datapoints = session.query(activities.act_id, track_data_points.act_id).filter(activities.act_id == track_data_points.act_id).all()

# define routes
@app.route("/")
def index():
    return render_template("index.html")

@app.route("/latlng/<activity_id>")
def latlng(activity_id):
    # Get latitude/longitude list for plotting
    data = session.query(Trackpoints).filter_by(act_id=activity_id).all()
    latlng = [[trckpt.tr_latitude, trckpt.tr_longtitude] for trckpt in data]
    return jsonify(latlng)

@app.route("/summary/<activity_id>")
def summary_data(activity_id):
    # Get activity summary data
    data = session.query(Activities).filter_by(act_id=activity_id).first()
    data = {
    "id": data.act_id,
    "type": data.act_type,
    "duration": data.act_duration,
    "total_distance": data.act_tot_distance,
    "avg_hrt_rate": data.act_avg_hrt_rate,
    "max_hrt_rate": data.act_max_hrt_rate,
    "calories": data.act_calories,
    }
    return jsonify(data)

@app.route("/trackpoints/<activity_id>")
def trackpoint_data(activity_id):
    data = session.query(Trackpoints).filter_by(act_id=activity_id).all()
    data = [{
        "id": trackpoint.act_id,
        "time": trackpoint.tr_time,
        "latitude": trackpoint.tr_latitude,
        "longitude": trackpoint.tr_longtitude,
        "hrt_rate": trackpoint.tr_hrt_rate,
        "altitude": trackpoint.tr_altitude,
        "distance": trackpoint.tr_distance
    } for trackpoint in data]
    return jsonify(data)

@app.route("/all_data/<activity_id>")
def all_data(activity_id):
    all_data = []
    activity_data = session.query(Activities, Trackpoints).filter(Activities.act_id == Trackpoints.act_id).filter_by(act_id=activity_id).all()
    for record in activity_data:
        (activities, trackpoint) = record
        data = {
            "act_id": activities.act_id,
            "act_type": activities.act_type,
            "act_duration": activities.act_duration,
            "act_total_distance": activities.act_tot_distance,
            "act_avg_hrt_rate": activities.act_avg_hrt_rate,
            "act_max_hrt_rate": activities.act_max_hrt_rate,
            "act_calories": activities.act_calories,
            "tp_id": trackpoint.act_id,
            "tp_type": trackpoint.tr_time,
            "tp_duration": trackpoint.tr_latitude,
            "tp_total_distance": trackpoint.tr_longtitude,
            "tp_avg_hrt_rate": trackpoint.tr_hrt_rate,
            "tp_max_hrt_rate": trackpoint.tr_altitude,
            "tp_calories": trackpoint.tr_distance
        }
        all_data.append(data)
    return jsonify(all_data)

@app.route("/activity_numbers")
def get_unique_ids():
    ids = []
    for record in all_datapoints:
        (activity_act_id, trackpoint_act_id) = record
        if trackpoint_act_id not in ids:
            ids.append(trackpoint_act_id)
    return jsonify(ids)

if __name__ == "__main__":
    app.run(debug=True)