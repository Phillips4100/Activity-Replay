function dropDown(ids) {
    var dropdownMenu = d3.select("#selDataset");
    ids.forEach((id) => {
      dropdownMenu.append("option").text(id).attr("value", id);
    });
  };
  
  d3.json("http://127.0.0.1:5000/activity_dates").then(ids => {
    dropDown(ids);
  })
  
function buildTable(activityID) {
    var table = d3.select("#activity-summary")
    d3.json(`http://127.0.0.1:5000/summary/${activityID}`).then((data) => {
        Object.entries(data).forEach(([key, value]) => {
            if (key=="avg_hrt_rate") {
                key = "Avg Heart Rate"
                table.append("h5").text(`${key}: ${value}`);
            } else if (key=="max_hrt_rate") {
                key = "Max Heart Rate"
                table.append("h5").text(`${key}: ${value}`);
            // } else if (key=="total_distance") {
            //     key = "Total Distance"
            //     value = value*.00062
            //     table.append("h5").text(`${key}: ${value} miles`);
            // } else if (key=="duration") {
            //     key = "Duration"
            //     value = value/60
            //     table.append("h5").text(`${key}: ${value} min`);
            } else {
                table.append("h5").text(`${key}: ${value}`);
            }
        })
    });
};

function deleteCurrent() {
    d3.select("#activity-summary").selectAll("h5").remove();
    d3.select("#map").remove();
    d3.select("#mapping").append("div").attr("id", "map").style("height", "500px")
    d3.select("#SVGbox-gaugeBox").remove();
}

function optionChanged(activityID) {
    deleteCurrent();
    buildTable(activityID);
    buildMap(activityID)
    speedGauge(activityID);
    // moveGuage(activity_number);
};

// function moveGuage(activity_number) {


//     d3.json(`http://127.0.0.1:5000/geojson/${activity_number}`).then(data => {
//         console.log("Hello")
//         var speedList = data.features.map(data => data.properties.speed);
//         speedList.forEach(speed => {
//             // var input = d3.select("#myValues").attr("value", speed)
//             $(input).keyup(d3.select("#myValues").attr("value", speed))
//         })
//     })
// }


function speedGauge(selectedID) {
    d3.json(`http://127.0.0.1:5000/geojson/${selectedID}`).then(data => {
        // IDselected=ids.filter(id.activity_id=selectedID)
        maxSpeed = d3.max(data.features.map(data => data.properties.speed));
        maxSpeed = +maxSpeed
        console.log(`Max Speed: ${maxSpeed}`);
        var gauges = []
        var opt = {
            gaugeRadius: 140,
            minVal: 0,
            maxVal: 50,
            needleVal: maxSpeed*2.24, 
            //needleVal: Math.floor(Math.random() * 50) + 1 ,
            tickSpaceMinVal: 2,
            tickSpaceMajVal: 10,
            divID: "gaugeBox",
            gaugeUnits: "mph"
        }
        console.log(opt);
        gauges[0] = new drawGauge(opt)
        // document.addEventListener("DOMContentLoaded", function (event, maxSpeed) {
        //     var opt = {
        //         gaugeRadius: 140,
        //         minVal: 0,
        //         maxVal: 50,
        //         needleVal: maxSpeed, 
        //         //needleVal: Math.floor(Math.random() * 50) + 1 ,
        //         tickSpaceMinVal: 2,
        //         tickSpaceMajVal: 10,
        //         divID: "gaugeBox",
        //         gaugeUnits: "mph"
        //     }
        //     console.log(opt);
        //     gauges[0] = new drawGauge(opt)
        // });
    });
}





function buildMap(activity_number) {
    d3.json(`http://127.0.0.1:5000/geojson/${activity_number}`).then(data => {
        // maxSpeed = d3.max(data.features.map(data => data.properties.speed));
        // console.log(maxSpeed);
        // var gauges = []
        // document.addEventListener("DOMContentLoaded", function (event) {
        //     // d3.select("#marker").on("propertychanged", function(event) {
        //     // Create new variable called buildGauge and use it to replace (60)
        //     // var buildGauge = d3.json("C:/Users/bbahaneb/Documents/DU Data Bootcamp/Digital-Workout-Tracker/App2/data/test2.geojson").then(collection => {
        //     //     var features = collection.features.filter(function (d) {
        //     //         return d.properties.Speed > 0
        //     //         return d.properties.Time != null
        //     //     })

        //     // var speeds = data.features.filter(feature => feature.properties.speed)
        //     // console.log(speeds);

        //     var opt = {
        //         gaugeRadius: 140,
        //         minVal: 0,
        //         maxVal: 100,
        //         needleVal: Math.round(10),
        //         tickSpaceMinVal: 1,
        //         tickSpaceMajVal: 10,
        //         divID: "gaugeBox",
        //         gaugeUnits: "mph"
        //     }
        //     console.log(opt);

        //     gauges[0] = new drawGauge(opt);
        // })

        // Create the tile layer that will be the background of our map
        var gomap = L.tileLayer("https://api.mapbox.com/styles/v1/mapbox/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}", {
            attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
            maxZoom: 18,
            id: "outdoors-v11",
            accessToken: API_KEY
        });

        var features = data.features.filter(function(d) {
            return d.properties.id >= 0
        });

        var properties = data.features;
        console.log(properties);

        // calculate center of map and add map layer
        latC = d3.median(properties.map(item => item.properties.latitude))
        lonC = d3.median(properties.map(item => item.properties.longitude))
        console.log(`lat: ${latC}`)
        console.log(`lon: ${lonC}`)

        var map = L.map('map')
        .addLayer(gomap)
        .setView([latC, lonC], 11);

        var svg = d3.select(map.getPanes().overlayPane).append("svg");
        var g = svg.append("g").attr("class", "leaflet-zoom-hide");

        // the latitude and longitude coordinates will need to be transformed
        var transform = d3.geoTransform({
            point: projectPoint
        })
        var d3path = d3.geoPath().projection(transform);

        function projectPoint(x, y) {
            var point = map.latLngToLayerPoint(new L.LatLng(y, x));
            this.stream.point(point.x, point.y);
        }

        // function to convert our points to a line
        const toLine = d3.line().curve(d3.curveLinear)
            .x((d) => applyLatLngToLayer(d).x)
            .y((d) => applyLatLngToLayer(d).y);

        // adding the path itself (as a line), the traveling circle, the points themselves
        // here is the line between points
        var linePath = g.selectAll(".lineConnect")
            .data([features])
            .enter()
            .append("path")
            .attr("class", "lineConnect");

        // This will be our traveling circle
        var marker = g.append("circle")
            .attr("r", 8)
            .attr("id", "marker")
            .attr("class", "travelMarker");

        var origin = [data.features[0]]
        
        var begin = g.selectAll("g.start_point")
            .data(origin)
            .enter()
            .append('g')
            .attr('class', '.start_point');
            begin
            .append("circle", )
            .attr("r", 6)
            .style("fill", "green")
            .style("opacity", "1");

        var text = g.selectAll('text')
            .data(origin)
            .enter()
            .append('text')
            .text("Start")
            .attr('class', 'locnames')
            .attr('y', function(d) {
                return -10
            })
            .attr('x', function(d) {
            return -5
        })
        // Add our items to the actual map (and account for zooming)
        map.on("zoom", reset);
        reset();
        transition();

    function reset() {
        var bounds = d3path.bounds(data),
            topLeft = bounds[0],
            bottomRight = bounds[1];
            console.log(bounds)
        begin.attr("transform", d => 
            "translate(" + applyLatLngToLayer(d).x + "," + applyLatLngToLayer(d).y + ")");
        // ptFeatures.attr("transform", d => 
        //     "translate(" + applyLatLngToLayer(d).x + "," + applyLatLngToLayer(d).y + ")");
        marker.attr("transform", function() {
              const coords = features[0].geometry.coordinates;
                          const pt = map.latLngToLayerPoint(new L.LatLng(coords[1], coords[0]));
            console.log(coords)
              return "translate(" + pt.x + "," + pt.y + ")";
          });
        text.attr("transform", function(d) {
            return "translate(" +
                applyLatLngToLayer(d).x + "," +
                applyLatLngToLayer(d).y + ")";
            });
        // Setting the size and location of the overall SVG container
        svg.attr("width", bottomRight[0] - topLeft[0] + 120)
            .attr("height", bottomRight[1] - topLeft[1] + 120)
            .style("left", topLeft[0] - 50 + "px")
            .style("top", topLeft[1] - 50 + "px");
        linePath.attr("d", toLine);
        // linePath.attr("d", d3path);
        g.attr("transform", "translate(" + (-topLeft[0] + 50) + "," + (-topLeft[1] + 50) + ")");
    } // end reset


    function transition() {
        linePath.transition()
            .duration(25000)
            .attrTween("stroke-dasharray", tweenDash)
    }
    function tweenDash() {
        return function(t) {
            //total length of path (single value)
            var l = linePath.node().getTotalLength();
            // console.log(l)
            interpolate = d3.interpolateString("0," + l, l + "," + l);
            //t is fraction of time 0-1 since transition began
            var marker = d3.select("#marker");
        
            // p is the point on the line (coordinates) at a given length
            // along the line. In this case if l=50 and we're midway through
            // the time then this would 25.
            var p = linePath.node().getPointAtLength(t * l);
    
            //Move the marker to that point
            marker.attr("transform", "translate(" + p.x + "," + p.y + ")"); //move marker
            // console.log(interpolate(t))
            return interpolate(t);
        }
    } //end tweenDash
    function projectPoint(x, y) {
        var point = map.latLngToLayerPoint(new L.LatLng(y, x));
        this.stream.point(point.x, point.y);
    } //end projectPoint

    function applyLatLngToLayer(d) {
        return map.latLngToLayerPoint(
            new L.LatLng(d.geometry.coordinates[1], d.geometry.coordinates[0]));
    };
    });
}

buildTable(1926552470);
buildMap(1926552470);
speedGauge(1926552470);
// moveGuage(1926552470);