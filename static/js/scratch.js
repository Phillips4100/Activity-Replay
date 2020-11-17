function dropDown(ids) {
    var dropdownMenu = d3.select("#selDataset");
    ids.forEach((id) => {
      dropdownMenu.append("option").text(id).attr("value", id);
    });
  };
  
  d3.json("http://127.0.0.1:5000/activity_ids").then(id => {
    dropDown(id);
  });

//   function getIdByDate(date) {
//     data = ('http://127.0.0.1:5000/summary')
//     return (data).filter(
//         function(data){ return data.date == date }
//     );
//   }

function buildTable(activityID) {
    var table = d3.select("#activity-summary")
    d3.json(`http://127.0.0.1:5000/activity/${activityID}`).then((data) => {
        Object.entries(data).forEach(([key, value]) => {
            if (key=="name") {
                key = "name"
                table.append("h5").text(`${value}`);
            } else {
                table.append("h5").text(`${key}: ${value}`);
            }
        })
    });
};

function deleteCurrent() {
    d3.select("#activity-summary").selectAll("h5").remove();
    d3.select("#map").remove();
    d3.select("#mapping").append("div").attr("id", "map").style("height", "450px");
    d3.select("#SVGbox-gaugeBox").remove();
    d3.select("#elevation").remove();
    d3.select("#mapping").append("div").attr("id", "elevation").style("height", "170px");
}

function optionChanged(activityID) {
    deleteCurrent();
    buildTable(activityID);
    buildMap(activityID)
    speedGauge(activityID);
    getaltGraph(activityID)
};

function getaltGraph(activity_number) {
    d3.json(`http://127.0.0.1:5000/geojson/${activity_number}`).then(filtered => {
        altitude = d3.select(filtered.features.map(data => data.properties.altitude))._groups[0][0];
        distance = d3.select(filtered.features.map(data => data.properties.distance))._groups[0][0];

        var x = distance
        var y = altitude
        frames = []
        n = x.length
        for (var i = 0; i < n; i++) {
            frames[i] = {data: [{x: [], y: []}]}
            frames[i].data[0].x = x.slice(0, i+1);
            frames[i].data[0].y = y.slice(0, i+1);
          }
        // console.log(frames)
        // console.log(Math.min(...y))
        // console.log(Math.max(...y))
        var trace1 = [{
            // x: frames[1].data[0].x,
            // y: frames[1].data[0].y,
            x: x,
            y: y,
            type: 'scatter',
            mode: 'lines',
            line: {color: 'tan'},
            fill: 'tozeroy',
          }];

        var layout1 = {
            width: 920,
            height: 170,
            plot_bgcolor: "light-blue",
            xaxis: {
                range: [
                    frames[x.length-1].data[0].x[0],
                    frames[x.length-1].data[0].x[x.length-1]
                  ]},
            yaxis: {
                range: [Math.min(...y)-10, Math.max(...y)+10]},
            margin: {
                l: 40,
                r: 0,
                b: 50,
                t: 10,
                pad: 5
              },
            updatemenus: [{
                x: 0,
                y: 0,
                yanchor: 'top',
                xanchor: 'left',
                showactive: false,
                direction: 'left',
                auto_play: true,
                type: 'buttons',
                pad: {t: -120, l: 10},
                buttons: [{
                    method: 'animate',
                    args: [null, {
                        mode: 'immediate',
                        auto_play: true,
                        fromcurrent: true,
                        transition: {
                            duration: "20s",
                            auto_play: true,
                        },
                        frame: {duration: 0, redraw: false}
                    }],
                    label: 'Go!'
                }, {
                    method: 'animate',
                    args: [[null], {
                        mode: 'immediate',
                        transition: {duration: 0},
                        frame: {duration: 0, redraw: false}
                    }],
                    label: 'Stop'
                }]
            }]
        };
        
        Plotly.newPlot('elevation', trace1, layout1);
        }).then(function() {
          Plotly.addFrames('elevation', frames);
        });
    }

function buildMap(activity_number) {
    d3.json(`http://127.0.0.1:5000/geojson/${activity_number}`).then(data => {

        // Create the tile layer that will be the background of our map
        var gomap = L.tileLayer("https://api.mapbox.com/styles/v1/mapbox/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}", {
            attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
            maxZoom: 16,
            id: "outdoors-v11",
            accessToken: API_KEY
        });

        var features = data.features.filter(function(d) {
            return d.properties.id >= 0
        });

        var properties = data.features;
        // console.log(properties);

        // calculate center of map and add map layer and setView
        d3path = d3.geoPath().projection(transform);
        bounds = d3path.bounds(data);

        function getCenter(bounds) {
            lon1 = bounds[0][0]
            lon2 = bounds[1][0]
            lat1 = bounds[0][1]
            lat2 = bounds[1][1]
            lonc = Math.abs(lon1-lon2)/2
            latc = Math.abs(lat1 - lat2)/2
            latC = latc + (d3.min(properties.map(item => item.properties.latitude)))
            lonC = lonc + (d3.min(properties.map(item => item.properties.longitude)))
            // console.log(lon1 - lon2)
            // console.log(lat1 - lat2)
            return [latC, lonC]
        };
        // console.log(getCenter(bounds))

        function getZoom(bounds) {
            lat1 = bounds[0][1]
            lat2 = bounds[1][1]
            latc = Math.abs(lat1 - lat2)
            zoom = 0
            if (latc < .0152) {
                zoom = 15;
              } else if (latc >= .0152 && latc <.03) {
                zoom = 14;
              } else if (latc >= .03 && latc <.062) {
                zoom = 13;
              } else if (latc >= .062 && latc <.13) {
                zoom = 12;
              } else if (latc >= .13 && latc <.23) {
                zoom = 11;
              } else if (latc >= .23 && latc <=.6) {
                zoom = 10;
              } else {
                zoom = 9;
              }              
            return (zoom)
        };

        // console.log(getZoom(bounds))
        var map = L.map('map')
        .addLayer(gomap)
        .setView(getCenter(bounds), getZoom(bounds))

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
            // console.log(bounds)
        
        begin.attr("transform", d => 
            "translate(" + applyLatLngToLayer(d).x + "," + applyLatLngToLayer(d).y + ")");

        marker.attr("transform", function() {
              const coords = features[0].geometry.coordinates;
                          const pt = map.latLngToLayerPoint(new L.LatLng(coords[1], coords[0]));
            // console.log(coords)
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
function speedGauge(selectedID) {
    d3.json(`http://127.0.0.1:5000/geojson/${selectedID}`).then(data => {
        // IDselected=ids.filter(id.activity_id=selectedID)
        maxSpeed = d3.max(data.features.map(data => data.properties.speed));
        maxSpeed = +maxSpeed
        // console.log(`Max Speed: ${maxSpeed}`);
        var gauges = []
        var opt = {
            gaugeRadius: 140,
            minVal: 0,
            maxVal: 50,
            needleVal: maxSpeed*2.24, 
            tickSpaceMinVal: 2,
            tickSpaceMajVal: 10,
            divID: "gaugeBox",
            gaugeUnits: "mph"
        }
        // console.log(opt);
        gauges[0] = new drawGauge(opt)
    });
}

buildTable(5636969541);
buildMap(5636969541);
speedGauge(5636969541);
getaltGraph(5636969541);