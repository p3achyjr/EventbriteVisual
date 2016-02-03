/* Look at $(document).ready for logic flow */

/*
 * capitalizes a string
 */
function capitalize(s){
    return s.toLowerCase().replace( /\b./g, function(a){ return a.toUpperCase(); } );
};

/*
 * returns html formatted string for a tooltip
 */
function getTooltipText(d) {
  return  "<p style='max-width: 200px'>" + d.name
          + "<br><strong>Capacity: <strong><span style='color:#468'>"
          + d.value + "</span>";
}

/*
 * takes data from Eventbrite and parses it into a form suitable for
 * our d3 visualization.
 */
function parseData(data) {
  var name, size;
  var eventsForVis = [];

  // data is an array of requests, so for each request in data, we will extract
  // the events
  for (obj of data) {
    for (var i = 0; i < obj.events.length; i++) {
      name = obj.events[i].name.text;
      size = obj.events[i].capacity;

      eventsForVis.push({name: name, value: size});
    }
  } 

  return {children: eventsForVis};
}

/*
 * returns d3 pack object
 */
function initCircleChart(w, h) {
  return d3.layout.pack()
                  .sort(null)
                  .size([w, w])
                  .padding(1.5);
}

/*
 * returns an svg
 */
function initSvg(w, h) {
  return d3.select(".container").append("svg")
                                .attr("width", w)
                                .attr("height", w)
                                .attr("class", "bubble");
}

/*
 * returns d3 tooltip
 */
function initToolTip() {
  return d3.tip()
           .offset([25, 0])
           .attr("class", "tooltip")
           .html(function(d) {
             return getTooltipText(d);
           });
}

/*
 * takes svg, bubblechart and binds data to it
 */
function initChart(svg, circle, eventsForVis) {
  return svg.selectAll(".node")
            .data(circle.nodes(eventsForVis)
            .filter(function(d) { return !d.children; }))
            .enter().append("g")
            .attr("class", "node")
            .attr("transform", 
                  function(d) { 
                    return "translate(" + d.x + "," + d.y + ")";
                  });
}


/*
 * brightens a circle
 */
function changeColor(elem, amt) {
  var cColor = d3.select(elem).style("fill").split(",");
  var r = parseInt(cColor[0].substring(4, cColor[0].length));
  var g = parseInt(cColor[1]);
  var b = parseInt(cColor[2].substring(0, cColor[2].length-1));
  
  var newR = r + amt;
  var newG = g + amt;
  var newB = b + amt;

  var newColor = "rgb("+newR.toString()+","+newG.toString()+","
                 +newB.toString()+")"; 

  d3.select(elem).style("fill", newColor);
}

/*
 * returns substring that only contains full words
 */
function getTitleSubstring(d) {
  var allTokens = d.name.split(" ");
  var prelimLength = d.r/3;
  var title = "";

  // add words 
  for (var i = 0; i < allTokens.length; i++) {
    var next = allTokens[i];
    if (title.length + next.length > prelimLength) break;

    title += (next + " ");
  }

  return title;
}

/*
 * handler for data that is retrieved from the Eventbrite API.
 * parses, then creates bubble chart SVG.
 */
function visualize(data, query) {
  // remove old visualization
  var eventsForVis = parseData(data),
      format = d3.format(",d"),
      color = d3.scale.category20b(),
      w = window.innerWidth,
      h = window.innerHeight;

  var circle = initCircleChart(w, h);

  var svg = initSvg(w, h);

  var tip = initToolTip();

  svg.call(tip);

  var node = initChart(svg, circle, eventsForVis);

  node.append("circle")
      .attr("r", function(d) { return d.r; })
      .style("fill", function(d) { return color(d.name); })
      .on("mouseover", function(d) {
        tip.show(d).style("opacity", ".85");
        changeColor(this, -20); 
      })
      .on("mouseout", function(d) {
        tip.hide(d);
        changeColor(this, 20); 
      });

  node.append("text")
      .attr("dy", ".3em")
      .style("text-anchor", "middle")
      .style("color", "#fff")
      .text(function(d) { return getTitleSubstring(d); });

  // show visualization
  $(".overlay, .search, .loading-search").addClass("hidden");
  $(".title").text(capitalize(query));
}

/*
 * complete the request, iterating through all pages of the request
 */
function getAllDataAndVisualize(data, url, query) {
  // creates array containing all pages, the pages will contain up to 1000
  // events.
  var page_count = data.pagination.page_count;
  var max = page_count <= 20 ? page_count : 20;
  var totalData = [data];

  if (max == 1) visualize(totalData, query);

  // if max > 1, iterate through pages
  for (var i = 2; i <= max; i++) {
    $.get(url + "&page=" + i,
          function(newData) { 
            totalData.push(newData); 
            if (totalData.length == max) {
              visualize(totalData, query);
            }
          });
  }
}

/*
 * called on search - takes query, makes GET request to eventbrite, 
 * gets remaining pages, and creates visualization
 */
function handleSearch(query) {
  // remove old visualization
  var url = "https://www.eventbriteapi.com/v3/events/search/?token=IT52FIOMJTDH5OGRDSSD&q=" + query;
  $.get(url, function(data) {
    $(".bubble").remove();
    $(".loading-search").removeClass("hidden");
    getAllDataAndVisualize(data, url, query);
  });
}


$(document).ready( function() {
  // do an initial get request to start
  handleSearch("computer science");

  // bind elements for user queries
  $(".search-icon").click(function() {
    $(".overlay, .search").removeClass("hidden");
  });

  $(".overlay").click(function() {
    $(".overlay, .search").addClass("hidden");
  });

  // enter to submit search
  $(".search").on("keypress", function(e) {
    if (e.keyCode == 10 || e.keyCode == 13) {
      e.preventDefault();
      handleSearch($(".search").text());
    }
  })
});













