// function init() {
//   var dropdown = d3.select("#selDataset");
//   d3.json("http://127.0.0.1:5000/activity_numbers").then((data)=> {
//     console.log(`Activity Numbers:${data}`);
//       data.forEach(function(activity) {
//           dropdown.append("option").text(activity.activityId).property("value")
//       })
//   })
// };
// init();

// Logan Added
function dropDown(ids) {
  var dropdownMenu = d3.select("#selDataset");
  ids.forEach((id) => {
    dropdownMenu.append("option").text(id).attr("value", id);
  });
};

d3.json("http://127.0.0.1:5000/activity_numbers").then(ids => {
  dropDown(ids);
})

function buildTable(activityID) {
  var table = d3.select("#activity-summary")
  d3.json(`http://127.0.0.1:5000/summary/${activityID}`).then((data) => {
      Object.entries(data).forEach(([key, value]) => {
          table.append("h5").text(`${key}: ${value}`);
      })
  })
};

buildTable(1926552470);




// Create the tile layer that will be the background of our map
var gomap = L.tileLayer("https://api.mapbox.com/styles/v1/mapbox/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}", {
attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
maxZoom: 18,
id: "light-v10",
accessToken: API_KEY
});

var map = L.map('map')
  .addLayer(gomap)
  .setView([39.464005418121815, -107.3228301666677], 12);
  // .viewreset(reset());

// Add our tile layer to the map
// gomap.addTo(map);

var svg = d3.select(map.getPanes().overlayPane).append("svg");
var g = svg.append("g").attr("class", "leaflet-zoom-hide");


d3.json("http://127.0.0.1:5000/geojson/1926552470").then(collection => {
  console.log(collection)

  function applyLatLngToLayer(d) {
    var y = d.geometry.coordinates[0]
    var x = d.geometry.coordinates[1]
    return map.latLngToLayerPoint(new L.LatLng(y, x))
  }

var features = collection.features.filter(function(d) {
  return d.properties.distance > 0
  // return d.properties.Time != null
})
// console.log(collection)

// Do stuff here
// the latitude and longitude coordinates will need to be transformed
// var transform = d3.geo.transform({
var transform = d3.geoTransform({
  point: projectPoint
});

var d3path = d3.geoPath().projection(transform);

// function projectPoint(x, y) {
//   var point = map.latLngToLayerPoint(new L.LatLng(y, x));
//   this.stream.point(point.x, point.y);
// }
// function to convert our points to a line 
// var toLine = d3.svg.line()
var toLine = d3.line()
  // .interpolate("linear")
  .curve(d3.curveLinear)
  .x(function(d) {
      return applyLatLngToLayer(d).x
  })
  .y(function(d) {
      return applyLatLngToLayer(d).y
  });

// function applyLatLngToLayer(d) {
//     var y = d.geometry.coordinates[1]
//     var x = d.geometry.coordinates[0]
//     return map.latLngToLayerPoint(new L.LatLng(y, x))
// }

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

// if you want the actual points change opacity
var ptFeatures = g.selectAll("circle")
.data(features)
.enter()
.append("circle")
.attr("r", 3)
.attr("class", "waypoints")
// .attr("class", function(d){
//     return "waypoints " + "c" + d.properties.time})      
.style("opacity", 0);

// I want the origin and destination to look different
var origin = [features[0]]

var begin = g.selectAll(".points")
.data(origin)
.enter()
.append("circle", ".points")
.attr("r", 5)
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
map.on("viewreset", reset());
// map.on('viewreset', function(reset) {
//   console.log('viewreset');
// });

reset();
transition();

// reset the SVG elements if the user repositions the map
function reset() {
  var bounds = d3path.bounds(data),
      topLeft = bounds[0],
      bottomRight = bounds[1];
    // console.log(bounds)

  text.attr("transform",
  function(d) {
      return "translate(" +
          applyLatLngToLayer(d).x + "," +
          applyLatLngToLayer(d).y + ")";
  });

  begin.attr("transform",
      function(d) {
          return "translate(" +
              applyLatLngToLayer(d).x + "," +
              applyLatLngToLayer(d).y + ")";
      }
  );

  ptFeatures.attr("transform",
      function(d) {
          return "translate(" +
              applyLatLngToLayer(d).x + "," +
              applyLatLngToLayer(d).y + ")";
      });

  marker.attr("transform",
  function() {
      var y = features[0].geometry.coordinates[0]
      var x = features[0].geometry.coordinates[1]
      return "translate(" +
          map.latLngToLayerPoint(new L.LatLng(y, x)).x + "," +
          map.latLngToLayerPoint(new L.LatLng(y, x)).y + ")";
  });

  svg.attr("width", bottomRight[0] - topLeft[0] + 60)
      .attr("height", bottomRight[1] - topLeft[1] + 60)
      .style("left", topLeft[0] - 50 + "px")
      .style("top", topLeft[1] - 50 + "px");

  linePath.attr("d", toLine)
  g.attr("transform", "translate(" + (-topLeft[0] + 50) + "," + (-topLeft[1] + 50) + ")");
};

function transition() {
  linePath.transition()
      .duration(15000)
      .attrTween("stroke-dasharray", tweenDash)
      // .each("end", function() {
      //     d3.select(this).call(transition);// infinite loop
      //     ptFeatures.style("opacity", .25)
      // });
}

function tweenDash() {
  return function(t) {
      //total length of path (single value)
      var l = linePath.node().getTotalLength(); 
      console.log(l)
      // this is creating a function called interpolate which takes
      // as input a single value 0-1. The function will interpolate
      // between the numbers embedded in a string. An example might
      // be interpolatString("0,500", "500,500") in which case
      // the first number would interpolate through 0-500 and the
      // second number through 500-500 (always 500). So, then
      // if you used interpolate(0.5) you would get "250, 500"
      // when input into the attrTween above this means give me
      // a line of length 250 followed by a gap of 500. Since the
      // total line length, though is only 500 to begin with this
      // essentially says give me a line of 250px followed by a gap
      // of 250px.
      // interpolate = d3.interpolateString("0," + l, l + "," + l);
      interpolate = d3.interpolateString("0," + l, l + "," + l);
      //t is fraction of time 0-1 since transition began
      var marker = d3.select("#marker");
    
      // p is the point on the line (coordinates) at a given length
      // along the line. In this case if l=50 and we're midway through
      // the time then this would 25.
      var p = linePath.node().getPointAtLength(t * l);
      // console.log(p)
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
});

// var traceGuage = [
//   {
//       domain: { x: [0, 1], y: [0, 1] },
//       value: value,
//       title: { text: "Belly Button Washing Frequency" },
//       type: "indicator",
//       mode: "gauge+number",
//       delta: { reference: 380 },
//       gauge: {
//           axis: { range: [null, 10] },
//           steps: [
//               { range: [0, 1], color: "darkgreen" },
//               { range: [1, 2], color: "lightgreen" },
//               { range: [2, 3], color: "lightgreen" },
//               { range: [3, 4], color: "yellow" },
//               { range: [4, 5], color: "yellow" },
//               { range: [5, 6], color: "yellow" },
//               { range: [6, 7], color: "yellow" },
//               { range: [7, 8], color: "red" },
//               { range: [8, 9], color: "red" },
//               { range: [9, 10], color: "darkred" }
//           ]
//       }
//   }
// ];
//   var layout = {
//       width: 600,
//       height: 450,
//       margin: { t: 0, b: 0 }
//   };
//   Plotly.newPlot("gauge", traceGuage, layout);

//***********************************//
// Create the map with our layers
// var map = L.map("map-id", {
//     center: [39.47730306, -106.0461143],
//     zoom: 12,})
//     .addLayer;

// var mapboxTiles = L.tileLayer('https://{s}.tiles.mapbox.com/v3/examples.map-zr0njcqy/{z}/{x}/{y}.png', {
//     attribution: '<a href="http://www.mapbox.com/about/maps/" target="_blank">Terms &amp; Feedback</a>'
// });

//***********************************//
