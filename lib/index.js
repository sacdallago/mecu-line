/*
 * mecu-viz
 * https://github.com/sacdallago/mecu-viz
 *
 * Copyright (c) 2016 Christian Dallago
 * Licensed under the Apache-2.0 license.
 */

const d3 = require("d3");

/**
@class Mecu
 */

class Mecu {

    constructor(data, opts){

        if(typeof(opts) === 'object'){
            this.base = opts.element || "#mecu";
        } else {
            this.base = "#mecu";
        }

        this.data = data || {};
        
        
        // CSS properties
        this.margin = {top: 10, right: 10, bottom: 20, left: 25};
        this.width = 200 - this.margin.left - this.margin.right;
        this.height = 200 - this.margin.top - this.margin.bottom;

        // Adds the svg canvas
        this.svg = d3.select(this.base)
            .append("svg")
            .attr("width", this.width + this.margin.left + this.margin.right)
            .attr("height", this.height + this.margin.top + this.margin.bottom)
            .append("g")
            .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");

        // Tooltip
        this.lineSvg = this.svg.append("g"); 
        this.focus = this.svg.append("g") 
        .style("display", "none");
    }

    render(data) {

        data = data || this.data;
        this.data = data;

        var x = d3.scaleLinear().range([0, this.width]);
        var y = d3.scaleLinear().range([this.height, 0]);

        // Scale the range of the data
        x.domain([30, 80]);
        y.domain([0, 100]);

        // Define the axes
        var xAxis = d3.axisBottom(x).ticks(4);
        var yAxis = d3.axisLeft(y).ticks(5);

        // Define the line
        var valueline = d3.line()
            .x(function(d) { return x(d.temp); })
            .y(function(d) { return y(d.soluble); })
            .curve(d3.curveLinear);

        // Define selector function
        var bisectTemp = d3.bisector(function(d) { return d.temp; }).left;

        // Add the valueline path.
        this.lineSvg.append("path")
            .attr("class", "line")
            .attr("fill", "none")
            .attr("stroke", this.color || "steelblue")
            .attr("stroke-width", this.stroke_width || "1px")
            .attr("d", valueline(this.data.reads));

        // Add the X Axis
        this.svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + this.height + ")")
            .attr("stroke-width", "0.1px")
            .call(xAxis);

        // Add the Y Axis
        this.svg.append("g")
            .attr("class", "y axis")
            .attr("stroke-width", "0.1px")
            .call(yAxis)
        .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 6)
            .attr("dy", "0.71em")
            .attr("fill", "#000")
            .text("Temperature, C");

        /*// append the y tooltip
        focus.append("line")
            .attr("class", "y-tip")
            .attr("y1", 0)
            .attr("y2", height);

        // append the x tooltip
        focus.append("line")
            .attr("class", "x-tip")
            .attr("x1", width)
            .attr("x2", width);

        // append the circle at the intersection
        focus.append("circle")
            .attr("class", "y")
            .style("fill", "none")
            .style("stroke", "blue")
            .attr("r", 1);

        // place the value at the intersection
        focus.append("text")
            .attr("class", "y1")
            .style("stroke", "white")
            .style("stroke-width", "3.5px")
            .style("opacity", 0.8)
            .attr("dx", 8)
            .attr("dy", "-.3em");
        focus.append("text")
            .attr("class", "y2")
            .attr("dx", 8)
            .attr("dy", "-.3em");

        // place the aggregations at the intersection
        focus.append("text")
            .attr("class", "y3")
            .style("stroke", "white")
            .style("stroke-width", "3.5px")
            .style("opacity", 0.8)
            .attr("dx", 8)
            .attr("dy", "1em");
        focus.append("text")
            .attr("class", "y4")
            .attr("dx", 8)
            .attr("dy", "1em");

        // append the rectangle to capture mouse
        this.svg.append("rect")
            .attr("width", width)
            .attr("height", height)
            .style("fill", "none")
            .style("pointer-events", "all")
            .on("mouseover", function() { focus.style("display", null); })
            .on("mouseout", function() { focus.style("display", "none"); })
            .on("mousemove", mousemove);*/

        function mousemove() {
            var x0 = x.invert(d3.mouse(this)[0]),
                i = bisectTemp(data.reads, x0, 1),
                d0 = data.reads[i - 1],
                d1 = data.reads[i],
                d = x0 - d0.temp > d1.temp - x0 ? d1 : d0;

            focus.select("circle.y")
                .attr("transform",
                      "translate(" + x(d.temp) + "," +
                      y(d.soluble) + ")");

            focus.select("text.y1")
                .attr("transform",
                      "translate(" + x(d.temp) + "," +
                      y(d.soluble) + ")")
                .text(d.temp);

            focus.select("text.y2")
                .attr("transform",
                      "translate(" + x(d.temp) + "," +
                      y(d.soluble) + ")")
                .text(d.temp);

            focus.select("text.y3")
                .attr("transform",
                      "translate(" + x(d.temp) + "," +
                      y(d.soluble) + ")")
                .text(d.temp);

            focus.select("text.y4")
                .attr("transform",
                      "translate(" + x(d.temp) + "," +
                      y(d.soluble) + ")")
                .text(d.temp);

            focus.select(".y-tip")
                .attr("transform",
                      "translate(" + x(d.temp) + "," +
                      y(d.soluble) + ")")
                .attr("y2", height - y(d.soluble));

            focus.select(".x-tip")
                .attr("transform",
                      "translate(" + width * -1 + "," +
                      y(d.soluble) + ")")
                .attr("x2", width + width);
        }

        return;
    }
}

module.exports = Mecu;