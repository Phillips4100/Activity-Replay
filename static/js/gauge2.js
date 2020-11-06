var gauges = []
    document.addEventListener("DOMContentLoaded", function (event) {
        var opt = {
            gaugeRadius: 140,
            minVal: 0,
            maxVal: 50,
            needleVal: Math.floor(Math.random() * 50) + 1 ,
            tickSpaceMinVal: 2,
            tickSpaceMajVal: 10,
            divID: "gaugeBox",
            gaugeUnits: "mph"
        }
        console.log(opt);
        gauges[0] = new drawGauge(opt)
});
