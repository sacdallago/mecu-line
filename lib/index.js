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

        this.options = opts || {};

        this.data = data || {};

        // CSS properties
        var element = document.getElementById(this.base.substr(1,this.base.length));
        var positionInfo = element.getBoundingClientRect();
        this.margin = {top: 10, right: 10, bottom: 20, left: 25};
        this.width = positionInfo.width;
        this.height = positionInfo.height - 10;

        // Adds the svg canvas
        this.svg = d3.select(this.base)
            .append("svg")
            .attr("width", this.width)
            .attr("height", this.height)
            .append("g");
        
        this.svg
            .attr("width", this.width)
            .attr("height", this.height)
            .attr("transform", "translate(0,10)");
    }
    
    render(data){
        data = data || this.data;
        this.data = data;
        
        let self = this;
        
        // lineContainer
        this.lineSvg = this.svg.append("g"); 

        this.x = d3.scaleLinear().range([0, this.width - this.margin.left - this.margin.right]);
        this.y = d3.scaleLinear().range([this.height - this.margin.top - this.margin.bottom, 0]);

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
            .attr("transform", "translate(" + this.margin.left + "," + (this.height - this.margin.top - this.margin.bottom) + ")")
            .attr("stroke-width", "0.1px")
            .call(xAxis);

        // Add the Y Axis
        this.yAxis = this.svg.append("g");
        this.yAxis
            .attr("class", "y axis")
            .attr("transform", "translate(" + this.margin.left + ",0)")
            .attr("stroke-width", "0.1px")
            .call(yAxis);

        // Define the lines
        let valueline = d3.line()
            .x(function(d) { return self.x(d.temp); })
            .y(function(d) { return self.y(d.soluble); })
            .curve(this.options.curveType || d3.curveBasis);

        for(let i=0; i<data.length; i++){
            // Add the valueline path.
            this.lineSvg.append("path")
                .attr("class", "line")
                .attr("fill", "none")
                .attr("transform", "translate(" + this.margin.left + ",0)")
                .attr("stroke", util.sequentialColor(this.data.length, i) || "steelblue")
                .attr("stroke-width", this.options.stroke_color || this.options.stroke_width || '1em')
                .style("stroke-linecap", "round")
                .attr("d", valueline(this.data[i].reads));
        }

        return;

    }

    renderWithoutAxes(data) {
        data = data || this.data;
        this.data = data;
        
        let self = this;
        
        // lineContainer
        this.lineSvg = this.svg.append("g"); 

        this.x = d3.scaleLinear().range([0, this.width]);
        this.y = d3.scaleLinear().range([this.height, 0]);

        // Scale the range of the data
        this.x.domain([30, 80]);
        this.y.domain([0, 100]);
        
        // Define the lines
        let valueline = d3.line()
            .x(function(d) { return self.x(d.temp); })
            .y(function(d) { return self.y(d.soluble); })
            .curve(this.options.curveType || d3.curveBasis);

        for(let i=0; i<data.length; i++){
            // Add the valueline path.
            this.lineSvg.append("path")
                .attr("class", "line")
                .attr("fill", "none")
                .attr("stroke", this.options.stroke_color || util.sequentialColor(this.data.length, i) || "steelblue")
                .attr("stroke-width", this.options.stroke_width || "1em")
                .style("stroke-linecap", "round")
                .attr("d", valueline(this.data[i].reads));
        }
    }
}

module.exports = Mecu;