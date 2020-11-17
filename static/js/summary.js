function init_() {
    d3.json("http://127.0.0.1:5000/activity/list").then(data => {
    
        var table = []
        for (var i = 0; i < data.length; i++) {
            table[i] = {
                "Date": data[i].date,
                "Type": data[i].type,
                "total_distance": data[i].total_distance,
                "Time": data[i].duration,
                "avg_speed": data[i].avg_speed,
                "max_speed": data[i].max_speed,
                "Name": data[i].name
            }
        }
        // console.log(data)
        console.log(table)
        var tbody = d3.select('tbody')
        renderTable();

        var filter = d3.select('.btn-default');

        filter.on('click', function() {
            // $("#table").empty();
            d3.event.preventDefault();
            // d3.select("tbody").empty();
            
            // collect input values
            var date = d3.select('#date');
            var dateVal = date.property("value").toLowerCase().trim();
            var type = d3.select('#type');
            var typeVal = type.property("value").toLowerCase().trim();
            var name = d3.select('#name');
            var nameVal = name.property("value").toLowerCase();
            var distance = d3.select('#distance')
            var distanceVal = distance.property('value').toLowerCase().trim();
            
            // create filters for each value
            if (dateVal != "") {
                Data1 = table.filter(input => input.date <= dateVal)
            }
            if (typeVal != "") {
                Data1 = table.filter(input => input.Type === typeVal)
            }
            if (nameVal != "") {
                Data1 = table.filter(input => input.Name === nameVal)
            }
            if (distanceVal != "") {
                Data1 = table.filter(input => input.total_distance >= distanceVal)
            }
            // console.log(ufoData1)
            renderNewTable();
        });

        // create table
        function renderTable() {
            table.forEach(function(activity) {
                // location.reload();
                //  console.log (sightings);
                var row = tbody.append('tr')
                Object.entries(activity).forEach(function([key, value]) {
                    var cell = tbody.append('td');
                    cell.text(value);
                });
            });
        }

        function renderNewTable() {
           $("tbody").empty();
            console.log(Data1);
            Data1.forEach(function(activity) {
                var row = tbody.append('tr')
                Object.entries(activity).forEach(function([key, value]) {
                    var cell = tbody.append('td');
                    cell.text(value);
                });
            });
        }

    });

}
init_()