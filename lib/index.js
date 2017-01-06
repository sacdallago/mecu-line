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

    constructor(opts) {

        if (typeof(opts) === 'object' && opts.constructor !== Array) {
            this.options = opts || {};
        } else {
            this.options = {};
        }


        this.base = this.options.element || "#mecu";
        this.data = [];

        // CSS properties
        var element = document.getElementById(this.base.substr(1, this.base.length));
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

        // lineContainer
        this.lineSvg = this.svg.append("g");

        this.x = d3.scaleLinear();
        this.y = d3.scaleLinear();

        this.x.range([0, this.width]);
        this.y.range([this.height, 0]);

        // Scale the range of the data
        this.x.domain([this.options.minTemp || 30, this.options.maxTemp || 80]);
        this.y.domain([0, 1]);

        this.xAxis = d3.axisBottom(this.x).ticks(4);
        this.yAxis = d3.axisLeft(this.y).ticks(5);

        // Add the X Axis
        this.xAxisElement = this.svg.append("g");
        this.xAxisElement
            .attr("class", "xAxis")
            .attr("transform", "translate(" + this.margin.left + "," + (this.height - this.margin.top - this.margin.bottom) + ")")
            .attr("stroke-width", "0.1px")

            .style("opacity", "0")
            .style("transition", "opacity 1s ease")

            .call(this.xAxis);

        // Add the Y Axis
        this.yAxisElement = this.svg.append("g");
        this.yAxisElement
            .attr("class", "yAxis")
            .attr("transform", "translate(" + this.margin.left + ",0)")
            .attr("stroke-width", "0.1px")

            .style("opacity", "0")
            .style("transition", "opacity 1s ease")

            .call(this.yAxis);

        // Toggle axes if in constructor options
        if (this.options.axes === true) {
            this.options.axes = false;
            this.toggleAxes();
        } else {
            this.options.axes = false;
        }

        // Define the lines
        let self = this;
        this.valueline = d3.line()
            .x(function (dataItem) {
                return self.x(dataItem.t);
            })
            .y(function (dataItem) {
                return self.y(dataItem.r);
            })
            .curve(this.options.curveType || d3.curveBasis);

        return this.add(this.data);
    }

    add(data) {
        if (typeof(data) === 'undefined' || data === null || typeof(data) !== 'object') {
            return;
        }

        if (data.constructor !== Array) {
            data = [data];
        }

        this.data = this.data.concat(data);

        for (let i = 0; i < data.length; i++) {
            // Add the valueline path.
            this.lineSvg.append("path")
                .attr("class", "line MECU"+this.data[i].experiment)
                .attr("fill", "none")
                .attr("transform", "translate(" + this.margin.left + ",0)")
                .attr("stroke", this.options.strokeColor || util.sequentialColor(this.data.length, i) || "steelblue")
                .attr("stroke-width", this.options.strokeWidth || '1em')
                .attr("d", this.valueline(this.data[i].reads))
                //.data(data, function(d) { return d._id; })
                .style("stroke-linecap", "round");
        }
    }

    remove(data) {
        if (typeof(data) === 'undefined' || data === null) {
            return;
        }

        if (data.constructor !== Array && typeof(data) === 'object') {
            data = [data];
        } else {
            return;
        }

        // TODO: Data can be stored in array in binary fashion, so removal is speed up, but insertion is slower. --> Are there more inserts or removes?
        this.data = this.data.filter(function (listItem) {
            return data.find(function (match) {
                return match.experiment === listItem.experiment;
            })
        });

        return this.add(this.data);
    }

    toggleAxes() {
        if(this.options.axes){
            this.x.range([0, this.width]);
            this.y.range([this.height, 0]);
            this.yAxisElement.style("opacity", "0");
            this.xAxisElement.style("opacity", "0");
        } else {
            this.x.range([0, this.width - this.margin.left - this.margin.right]);
            this.y.range([this.height - this.margin.top - this.margin.bottom, 0]);
            this.yAxisElement.style("opacity", "1");
            this.xAxisElement.style("opacity", "1");
        }

        for (let i = 0; i < this.data.length; i++) {
            // Add the valueline path.
            this.lineSvg.select(".MECU"+this.data[i].experiment)
                .transition().duration(1500).ease(d3.easeSinInOut)
                .attr("d", this.valueline(this.data[i].reads));
        }

        this.options.axes = !this.options.axes;
    }

    rescale(min, max) {
        if(min === 0){
            min = min + "";
        }
        if(max === 0){
            max = max + "";
        }
        this.x.domain([min || 30, max || 80]);

        this.xAxisElement
            .transition().duration(1500).ease(d3.easeSinInOut)  // https://github.com/mbostock/d3/wiki/Transitions#wiki-d3_ease
            .call(this.xAxis);

        for (let i = 0; i < this.data.length; i++) {
            // Add the valueline path.
            this.lineSvg.select(".MECU"+this.data[i].experiment)
                .transition().duration(1500).ease(d3.easeSinInOut)
                .attr("d", this.valueline(this.data[i].reads));
        }
    }
}

module.exports = Mecu;