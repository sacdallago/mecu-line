/*
 * mecu-viz
 * https://github.com/sacdallago/mecu-viz
 *
 * Copyright (c) 2016 Christian Dallago
 * Licensed under the Apache-2.0 license.
 */

const d3 = require("d3");
const util = require(__dirname + "/util");

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
        var element = document.getElementById(this.base.substr(1,this.base.length));
        var positionInfo = element.getBoundingClientRect();
        this.margin = {top: 10, right: 10, bottom: 20, left: 25};
        this.width = positionInfo.width - this.margin.left - this.margin.right;
        this.height = positionInfo.height - this.margin.top - this.margin.bottom;

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

        this.x = d3.scaleLinear().range([0, this.width]);
        this.y = d3.scaleLinear().range([this.height, 0]);

        // Scale the range of the data
        this.x.domain([30, 80]);
        this.y.domain([0, 100]);

        // Define the axes
        var xAxis = d3.axisBottom(this.x).ticks(4);
        var yAxis = d3.axisLeft(this.y).ticks(5);

        // Add the X Axis
        this.xAxis = this.svg.append("g");
        this.xAxis
            .attr("class", "x axis")
            .attr("transform", "translate(0," + this.height + ")")
            .attr("stroke-width", "0.1px")
            .call(xAxis);

        // Add the Y Axis
        this.yAxis = this.svg.append("g");
        this.yAxis
            .attr("class", "y axis")
            .attr("stroke-width", "0.1px")
            .call(yAxis);
    }

    render(data) {
        data = data || this.data;
        this.data = data;
        
        let self = this;

        // Define the line
        let valueline = d3.line()
            .x(function(d) { return self.x(d.temp); })
            .y(function(d) { return self.y(d.soluble); })
            .curve(this.curveType || d3.curveBasis);

        for(let i=0; i<data.length; i++){
            // Add the valueline path.
            this.lineSvg.append("path")
                .attr("class", "line")
                .attr("fill", "none")
                .attr("stroke", util.sequentialColor(this.data.length, i) || "steelblue")
                .attr("stroke-width", this.stroke_width || "1px")
                .attr("d", valueline(this.data[i].reads));

        }

        return;
    }
}

module.exports = Mecu;