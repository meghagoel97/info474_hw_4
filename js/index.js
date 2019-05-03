'use strict';


(function() {

  let data = "no data";
  let allYearsData = "no data";
  let svgContainer = ""; 
  let currentYear = '2000';

  window.onload = function() {
    svgContainer = d3.select('body')
      .append('svg')
      .attr('width', 500)
      .attr('height', 500);
    d3.csv("./data/dataEveryYear.csv")
      .then((csvData) => {
        data = csvData
        allYearsData = csvData;
        makeScatterPlot(allYearsData);
      });
        
  }

  function makeScatterPlot(csvData) {
    data = csvData 

    let fertility_rate_data = data.map((row) => parseFloat(row["fertility_rate"]));
    let life_expectancy_data = data.map((row) => parseFloat(row["life_expectancy"]));

    let axesLimits = findMinMax(fertility_rate_data, life_expectancy_data);

    let mapFunctions = drawAxes(axesLimits, "fertility_rate", "life_expectancy");

    let distinctYearsOptions = filterTime(data);
    console.log(distinctYearsOptions);

    let select = d3.select('body')
      .append('select')
      .attr('class', 'select')
      .on('change', onchange);
    
    let options = select
      .selectAll('option')
      .data(distinctYearsOptions).enter()
      .append('option')
      .attr('value', function(d) { return d})
      .text(function(d) { return d;});

      function onchange() {
        let selectValue = d3.select(this).property('value');
        currentYear = selectValue;
        console.log(selectValue);
        plotData(mapFunctions, selectValue);
      }


    // plot data as points and add tooltip functionality
    plotData(mapFunctions, currentYear);

    // // draw title and axes labels
    makeLabels();

  }

  function filterTime(csvData) {
    let time_data = csvData.map((row) => parseInt(row['time']));
    console.log(time_data);

    let select = d3.select('body').append('select');
     let distinct = (value, index, self) => {
      return self.indexOf(value) === index;
    }
    let distinctYears = time_data.filter(distinct);
    console.log(distinctYears);

    return distinctYears;
  }

  // make title and axes labels
  function makeLabels() {
    svgContainer.append('text')
      .attr('x', 100)
      .attr('y', 40)
      .style('font-size', '14pt')
      .text("Countries by Life Expectancy and Fertility Rate");

    svgContainer.append('text')
      .attr('x', 130)
      .attr('y', 490)
      .style('font-size', '10pt')
      .text('Fertility Rates (Avg Children per Woman)');

    svgContainer.append('text')
      .attr('transform', 'translate(15, 300)rotate(-90)')
      .style('font-size', '10pt')
      .text('Life Expectancy (years)');
  }

  // plot all the data points on the SVG
  // and add tooltip functionality
  function plotData(map, year) {
    console.log(year);

    // get population data as array
    let pop_data = data.map((row) => +row["pop_mlns"]);
    let pop_limits = d3.extent(pop_data);
    // make size scaling function for population
    let pop_map_func = d3.scaleLinear()
      .domain([pop_limits[0], pop_limits[1]])
      .range([3, 20]);

    // mapping functions
    let xMap = map.x;
    let yMap = map.y;

    // make tooltip
    let div = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

    let filterdata = data.filter(d => {
      if(d.time == currentYear) {
        return d;
      }
    })
    console.log(filterdata);

 
    let dots = svgContainer.selectAll('dots').data(filterdata);

    // append data to SVG and plot as points
    dots
      .data(filterdata)
      .enter()
      .append('circle')
        .attr('cx', xMap)
        .attr('cy', yMap)
        .attr('r', (d) => pop_map_func(d["pop_mlns"]))
        .attr('fill', "#4286f4")
        // add tooltip functionality to points
        .on("mouseover", (d) => {
          div.transition()
            .duration(200)
            .style("opacity", .9);
          div.html(d.location + "<br/>" + d.time + "<br/>" + 'Population: ' + numberWithCommas(d["pop_mlns"]*1000000)  + "<br/>" + 'Fertility Rate: ' + d.fertility_rate  + "<br/>" + 'Life Expectancy: ' + d.life_expectancy)
            .style("left", (d3.event.pageX) + "px")
            .style("top", (d3.event.pageY - 28) + "px");
        })
        .on("mouseout", (d) => {
          div.transition()
            .duration(500)
            .style("opacity", 0);
        });

      dots.remove();

      
  }

  // draw the axes and ticks
  function drawAxes(limits, x, y) {
    // return x value from a row of data
    let xValue = function(d) { return +d[x]; }

    // function to scale x value
    let xScale = d3.scaleLinear()
      .domain([limits.xMin - 0.5, limits.xMax + 0.5]) // give domain buffer room
      .range([50, 450]);

    // xMap returns a scaled x value from a row of data
    let xMap = function(d) { return xScale(xValue(d)); };

    // plot x-axis at bottom of SVG
    let xAxis = d3.axisBottom().scale(xScale);
    svgContainer.append("g")
      .attr('transform', 'translate(0, 450)')
      .call(xAxis);

    // return y value from a row of data
    let yValue = function(d) { return +d[y]}

    // function to scale y
    let yScale = d3.scaleLinear()
      .domain([limits.yMax + 5, limits.yMin - 5]) // give domain buffer
      .range([50, 450]);

    // yMap returns a scaled y value from a row of data
    let yMap = function (d) { return yScale(yValue(d)); };

    // plot y-axis at the left of SVG
    let yAxis = d3.axisLeft().scale(yScale);
    svgContainer.append('g')
      .attr('transform', 'translate(50, 0)')
      .call(yAxis);

    // return mapping and scaling functions
    return {
      x: xMap,
      y: yMap,
      xScale: xScale,
      yScale: yScale
    };
  }

  // find min and max for arrays of x and y
  function findMinMax(x, y) {

    // get min/max x values
    let xMin = d3.min(x);
    let xMax = d3.max(x);

    // get min/max y values
    let yMin = d3.min(y);
    let yMax = d3.max(y);

    // return formatted min/max data as an object
    return {
      xMin : xMin,
      xMax : xMax,
      yMin : yMin,
      yMax : yMax
    }
  }

  // format numbers
  function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

})();
