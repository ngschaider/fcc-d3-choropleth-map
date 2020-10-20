const EDUCATION_URL = "https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/for_user_education.json";

const COUNTY_URL = "https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/counties.json";


const width = 1000;
const height = 700;

var root = d3.select("#root");

var tooltip = d3.select("#tooltip");

var svg = root.append("svg")
  .attr("width", width)
  .attr("height", height);

var path = d3.geoPath();

var pathContainer = svg.append("g");

Promise.all([
  d3.json(COUNTY_URL),
  d3.json(EDUCATION_URL),
]).then((values) => {
  const countyData = values[0];
  const educationData = values[1];
  
  var geojson = topojson.feature(countyData, countyData.objects.counties);

  var min = d3.min(educationData, d => d.bachelorsOrHigher);
  var max = d3.max(educationData, d => d.bachelorsOrHigher);
  
  var xScale = d3.scaleLinear()
    .domain([min, max])
    .rangeRound([0, width]);
  
  var legendScale = d3.scaleLinear()
    .domain([min, max])
    .rangeRound([600, 800]);
  
  var colorScale = d3.scaleThreshold()
    .domain(d3.range(min, max, (max - min)/8))
    .range(d3.schemeGreens[9]);
  
  var legendAxis = d3.axisBottom(legendScale)
    .tickSize(15)
    .tickFormat(d => Math.round(d) + "%")
    .tickValues(colorScale.domain());
  
  var legend = svg.append("g")
    .attr("id", "legend")
    .attr("transform", "translate(0,20)");
  
  legend.selectAll("rect").data(colorScale.range().map(function(d) {
      d = colorScale.invertExtent(d);
      if (d[0] == null) d[0] = xScale.domain()[0];
      if (d[1] == null) d[1] = xScale.domain()[1];
      return d;
    }))
  .enter().append("rect")
    .attr("height", 10)
    .attr("x", function(d) { return legendScale(d[0]); })
    .attr("width", function(d) { return legendScale(d[1]) - legendScale(d[0]); })
    .attr("fill", function(d) { return colorScale(d[0]); });
  
  legend.call(legendAxis);
  
  pathContainer.selectAll("path")
    .data(geojson.features)
    .enter()
    .append("path")
    .attr("d", path)
    .attr("data-fips", d => d.id)
    .attr("data-education", d => {
      const edu = educationData.filter(e => e.fips == d.id);
      return edu[0].bachelorsOrHigher;
    })
    .attr("fill", d => {
      const edu = educationData.filter(e => e.fips == d.id);
      return colorScale(edu[0].bachelorsOrHigher);
    })
    .attr("class", "county")
    .on("mouseover", mouseOverCurry(educationData))
    .on("mouseout", mouseOutCurry(educationData));
})


function mouseOverCurry(educationData) {
  return function(e) {
    var county = d3.select(this);
    var edu = educationData.filter(e => e.fips == county.attr("data-fips"))[0];
    var text = edu.area_name + ", " + edu.state + ": " + edu.bachelorsOrHigher + "%";
    
    tooltip
      .text(text)
      .attr("data-education", edu.bachelorsOrHigher)
      .style("left", (e.clientX + 50) + "px")
      .style("top", e.clientY + "px")
      .transition()
      .duration(200)
      .style("opacity", 0.9);
  }
}

function mouseOutCurry(educationData) {
  return function(e) {
    tooltip.style("opacity", 0);
  }
}