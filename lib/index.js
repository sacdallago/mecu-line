/*
 * mecu-line
 * https://github.com/sacdallago/mecu-line
 *
 * Copyright (c) 2016 Christian Dallago
 * Licensed under the Apache-2.0 license.
 */

const d3 = require("d3");


// Extend string prototypes to allow color hashing
String.prototype.getHashCode = function() {
    var hash = 0;
    if (this.length == 0) return hash;
    for (var i = 0; i < this.length; i++) {
        hash = this.charCodeAt(i) + ((hash << 5) - hash);
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
};
Number.prototype.intToHSL = function() {
    var shortened = this % 360;
    return "hsl(" + shortened + ",100%,40%)";
};


/**
 @class MecuLine
 */

class MecuLine {

    constructor(opts) {

        if (typeof(opts) === 'object' && opts.constructor !== Array) {
            this.options = opts || {};
        } else {
            this.options = {};
        }


        this.base = this.options.element || "#mecu";
        this.data = {};

        // CSS properties
        var element = document.getElementById(this.base.substr(1, this.base.length));
        var positionInfo = element.getBoundingClientRect();
        this.margin = {top: 10, right: 10, bottom: 20, left: 25};
        this.width = this.options.width || positionInfo.width;
        this.height = (this.options.height || positionInfo.height) - 10;

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
        this.x.domain([this.options.minTemp || 40, this.options.maxTemp || 70]);
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

        return;
    }

    add(proteins) {
        if (typeof(proteins) === 'undefined' || proteins === null || typeof(proteins) !== 'object') {
            throw "Invalid parameter passed";
        }
        if (proteins.constructor !== Array) {
            proteins = [proteins];
        }

        let self = this;

        proteins.forEach(function(protein) {
            if(typeof(protein.reads) === 'undefined' || protein.reads === null || typeof(protein.reads) !== 'object'){
                throw "Protein " + protein.uniprotId + " has bad formatted reads.";
            }
            if (protein.reads.constructor !== Array) {
                protein.reads = [protein.reads];
            }

            protein.reads.forEach(function(read) {
                let currentCurveId = protein.uniprotId+"-E"+read.experiment;

                if(self.data[currentCurveId] === undefined){
                    let current = (function(p) {
                        let t = {};
                        for(let k in p){
                            if(k != "reads"){
                                t[k] = p.k;
                            }
                        }
                        t.reads = [read];
                        return t;
                    })(protein);

                    self.data[currentCurveId] = current;

                    // Add the valueline path.
                    self.lineSvg.append("path")
                        .attr("class", "line MECU"+currentCurveId)
                        .attr("fill", "none")
                        .attr("transform", "translate(" + self.margin.left + ",0)")
                        .attr("stroke", self.options.strokeColor || (currentCurveId).getHashCode().intToHSL() || "steelblue")
                        .attr("stroke-width", self.options.strokeWidth || '1em')
                        .attr("d", self.valueline(self.data[currentCurveId].reads[0].reads))
                        //.data(data, function(d) { return d._id; })
                        .style("stroke-linecap", "round");

                }
            });
        });
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

        for (let k in this.data) {
            // Add the valueline path.
            this.lineSvg.select(".MECU"+k)
                .transition().duration(1500).ease(d3.easeSinInOut)
                .attr("d", this.valueline(this.data[k].reads[0].reads));
        }
    }
}

module.exports = MecuLine;