var map;

var species = "All";
var disease = "All";
var minYear = 2005;
var maxYear = 2015;

var mbAttr = 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
       '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
       'Imagery � <a href="http://mapbox.com">Mapbox</a>',
	mbUrl = 'https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoiZGV2Z3JnIiwiYSI6ImNqYmdib3h4dDM0ODEzNGxsNjEwZnY3bmcifQ.f-EHd0-Ks_tqckT-XNU7Lg';

var grayscale = L.tileLayer(mbUrl, { id: 'mapbox.light', attribution: mbAttr }),
    streets = L.tileLayer(mbUrl, { id: 'mapbox.streets', attribution: mbAttr });

var os = L.tileLayer( 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    subdomains: ['a','b','c']
});

var baseLayers = {
    "Street": streets,
    "Grayscale": grayscale,
    "OpenStreet": os

};

var dzongkhagLayer = L.geoJson(dzongkhagJson, {
    style: function (feature) {
        return {
                fill:false,
                "color": "red",
                "weight": "1",
                "fill-opacity": 0.3
            
        };
    }
});

var dzongkhagLabel = L.geoJson(dzongkhagNameJson, {

    pointToLayer: function (feature, latlng) {

        var dist = feature.properties.name;

        var myIcon = L.divIcon({
            iconSize: new L.Point(50, 50),
            className: "textLabelclass",
            html: dist
        });

        return L.marker(latlng, { icon: myIcon });        
    }
});



var overlayMaps = {
    "Dzongkhag Boundary": dzongkhagLayer,
    "Dzongkhag Name": dzongkhagLabel

};

map = new L.Map('map', {
    layers: [grayscale, dzongkhagLayer],
    defaultExtentControl: true,
    center: new L.LatLng(27.783687, 85.311584),
    zoom: 8
    
});

L.control.layers(baseLayers, overlayMaps).addTo(map);
dzongkhagLayer.addTo(map);

var geojsonLayer;
var markersLayer;

var legend = {
    "Bird": "#DAF23D",
    "Cattle": "#15E889",
    "Canine": "#0515FA",
    "Cat": "#F59967",
    "Dog": "#80b1d3",
    "Goat and Sheep": "#b3de69",
    "Horse": "#fb8072",
    "Pig": "#1F211F",
    "Mixed": "#B08F87"
}

function updateOutbreakLayer() {  

    chartDataArray = [];
    disease = document.getElementById("disease").value;

    if (map.hasLayer(markersLayer)) {
        map.removeLayer(markersLayer);
    }

    geojsonLayer = L.geoJson(outbreak, {
        filter: function (feature, layer) {
            if (disease == "All" && species == "All") {
                return feature.properties.year <=maxYear && feature.properties.year >= minYear && feature.properties.year <= maxYear;
            }
        },
        onEachFeature : onEachFeature,
        pointToLayer: function (feature, latlng) {
            return L.circleMarker(latlng, {
                radius: 4,
                fillColor : "#5b0d0a",
                color: "#000",
                weight: 0.5,
                opacity: 1,
                fillOpacity: 1

            })
        }
    });

    markersLayer = new L.markerClusterGroup();
    markersLayer.addLayer(geojsonLayer).addTo(map);

    
    if (chartDataArray.length > 0) {
        var output = chartDataArray.reduce(function (out, curr){
            var y = curr.year,
                v = +curr.cases,
                d = +curr.deaths;
            out.jsonOutbreak[y] = (out.jsonOutbreak[y] || 0) + 1;
            out.jsonCases[y] = (out.jsonCases[y] || 0) + v;
            out.jsonDeath[y] = (out.jsonDeath[y] || 0) + d;
            return out;
        },
        {
            'jsonOutbreak': {}, 'jsonCases': {}, 'jsonDeath' : {} });

        createChart(output); 
    } else {
        createBlankchart();
    }
}

function onEachFeature(feature, layer) {
    //var popupContent = "<p>I started out as a GeoJSON " +
    //          feature.geometry.type + ", but now I'm a Leaflet vector!</p>";
    var popupContent = "";


    if (feature.properties && feature.properties.obDate) {

        popupContent += '<h4>Outbreak Date: ' + layer.feature.properties.obDate + '</h4>' +

        'Diagonosis: ' + layer.feature.properties.diagonosis + '<br \/>'+
        'Species: ' + layer.feature.properties.species + '<br \/>' +
        'Cases: ' + layer.feature.properties.cases + '<br \/>' +
        'Deaths: ' + layer.feature.properties.deaths + '<br \/>' +

            'Location: ' + layer.feature.properties.village + ', ' + layer.feature.properties.gewog + ', ' + layer.feature.properties.dzongkhag 

        chartDataArray.push(layer.feature.properties);
    }

    layer.bindPopup(popupContent);
}

function updateSpecies(s) {

    species = s;
    updateOutbreakLayer();
}

function jsonToArray(obj) {
    return Object.keys(obj).map(function (k) { console.log(k); console.log(obj[k]); return obj[k] });
}

var getKeys = function(arr) {
    var key, keys = [];

    for (key in arr) {
        keys.push(key);
    }
}

function createBlankchart() {
    var chartDiv = '#chartDiv';

    //tick Interval
    var ti = null;

    chartType = 'column';

    var titleText = '';
    var yAxisText = '';
    var valSuffix = '';

    var yearArray = [], caseArray = [], deathArray = [];

    for (i = minYear; i<=maxYear; i++) {
        yearArray.push(i);
        caseArray.push(null);
        deathArray.push(null);
    }

    $("#infoDiv").hide();

    document.getElementById("infoDiv").style.visibility = 'visible';
    $(chartDiv).highcharts({
        title : {
            text: titleText,
            style : { color : '#000000'},
            x: -20 //center
        },
        chart : {
            type: chartType
        },
        credits: {
            enabled: false
        },
        xAxis: {
            categories : yearArray,
            tickInterval: ti
        },
        yAxis: {
            title: {
                text: yAxisText,
                style: { color: '#000000' }
            },

            plotLines: [{
                value: 0,
                width: 1,
                color: '#808080'
            }]
        },
        
        plotOptions: {
            column: {
                pointPadding: 0.2,
                borderWidth: 0
            }
        },
        exporting: { enabled: false }, // hiding context menu
        series: [{
            name: 'Cases',
            data: caseArray
        },
        {
            name: 'Deaths',
            data: deathArray


        }]


    });
}


//Chat type: line or column

function createChart(jsonData) {
    var yearArray = getKeys(jsonData.jsonOutbreak);
    var outbreakArray = jsonToArray(jsonData.jsonOutbreak);
    var caseArray = jsonToArray(jsonData.jsonCases);
    var deathArray = jsonToArray(jsonData.jsonDeath);

    var outbreakTotal = outbreakArray.reduce(function(a,b) {
        return a+b;
    });

    var caseTotal = caseArray.reduce(function(a,b) {
        return a+b;
    });

    var deathTotal = caseArray.reduce(function(a,b) {
        return a+b;
    });

    //Generate Circles
    $('#infoDiv').show();
    drawCircles(caseTotal,deathTotal);

    document.getElementById("oText").textContent = "Total outbreak incidents: " + outbreakTotal;

    var chartDiv = '#chartDiv';

    var ti = null;

    chartType = 'column';

    var titleText = 'Disease Outbreak';
    var subtitleText = minYear + ' - ' + maxYear;
    var yAxisText = 'Numbers';
    var valSuffix = '';

    if(disease != "All") {
        if (disease == "BQ") {
            titleText = "Black Quarter";
        }
        else if (disease == "FMD") {
            titleText = "Foot and Mouth Disease";
        }

        else if (disease == "HPAI") {
            titleText = "Highly Pathogenic Avian Influenza (HPAI)";
        }
        else if (disease == "HS") {
            titleText = "Haemorrhagic Septicaemia (HS)";
        } else if (disease == "PPR") {
            titleText = "Peste des Petits Ruminants (PPR)";
        }
        else if (disease == "NCD") {
            titleText = "Non-communicable Disease (NCD)";
        }
        else if (disease == "ND") {
            titleText = "Newcastle Disease (ND)";
        }
        else {
            titleText = disease;
        }
    }

    if (minYear == maxYear) {
        subtitleText = minYear;
    }

console.log(caseArray);
console.log(deathArray);
    $(chartDiv).highcharts({
        title: {
            text: titleText,
            style: {color : '#000000'},
            x: -20
        },
        subtitle: {
            text: subtitleText,
            style: { color : '#000000' },
            x: -20
        },
        chart: {
            type : chartType
        },
        credits: {
            enabled : false
        },
        xAxis: {
            categories: yearArray,
            tickInterval: ti,
        },
        yAxis : {
            title: {
                text: yAxisText,
                style: {color : '#000000'}
            },

            plotLines: [{
                value: 0,
                width: 1,
                color: '#808080'
            }]
        },
        plotOptions: {
            column: {
                pointPadding: 0.2,
                borderWidth: 0
            }
        },

        series: [{
            name : 'Cases',
            data: caseArray
        },
        {
            name: 'Deaths',
            data: deathArray
        }]
    });

}

function drawCircles (cValue, dValue) {
    var cRadius = 80;
    var dRadius = parseInt(Math.sqrt(cRadius * cRadius * dValue / cValue));

    //set the radius of dCircle
    var dCircle = document.getElementById("dCircle");
    dCircle.setAttribute("r", dRadius);

    var cX = 90;
    var cY = cX + cRadius - dRadius;

    dCircle.setAttribute("cy", cY);

    document.getElementById("cText").textContent = cValue;
    document.getElementById("cTitle").textContent = "Cases: " + cValue;

    document.getElementById("dText").textContent = dValue;
    document.getElementById("dTitle").textContent = "Deaths: " + dValue;
}




