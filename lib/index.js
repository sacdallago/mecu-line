"use strict";
/*
 * mecu-line
 * https://github.com/sacdallago/mecu-line
 *
 * Copyright (c) 2016 Christian Dallago
 * Licensed under the Apache-2.0 license.
 */

import {scaleLinear, select, axisBottom, axisLeft, line, curveBasis, easeSinInOut} from 'd3';

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

    /**
     * Constructor for a Mecu Line element. This will initialize the element in the DOM, but not add any data to it.
     *
     *
     * @param opts - an object containing customization parameters. See README for more information
     */
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
        this.svg = select(this.base)
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

        this.x = scaleLinear();
        this.y = scaleLinear();

        this.x.range([0, this.width-this.margin.left]);
        this.y.range([this.height - this.margin.top - this.margin.bottom, 0]);

        // Scale the range of the data
        this.x.domain([this.options.minTemp || 37, this.options.maxTemp || 65]);
        this.y.domain([(this.options.minRatio !== undefined ? this.options.minRatio : -0.1), this.options.maxRatio || 1.1]);

        this.xAxis = axisBottom(this.x).ticks(this.options.xTicks || 15);
        this.yAxis = axisLeft(this.y).ticks(this.options.yTicks || 2);

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
        this.valueline = line()
            .x(function (dataItem) {
                return self.x(dataItem.t);
            })
            .y(function (dataItem) {
                return self.y(dataItem.r);
            })
            .curve(this.options.curveType || curveBasis);

        // Used to count how many lines are currently stored / Like this.data.length, but this.data is object and obj.keys is not supported in safari
        self.count = 0;

        return;
    }

    /**
     * Method to add curves to the initialized graph.
     *
     *
     * @param proteins - and object or array of objects representing a protein melting read. The object must comply with the format {uniprotId:..., reads: [ { experiment:..., reads: [ { t:.., r:... }]}]}
     */
    add(proteins) {
        if (typeof(proteins) === 'undefined' || proteins === null || typeof(proteins) !== 'object') {
            throw "Invalid parameter passed";
        }
        if (proteins.constructor !== Array) {
            proteins = [proteins];
        }

        let self = this;

        proteins.forEach(function(protein) {
            if(typeof(protein.experiments) === 'undefined' || protein.experiments === null || typeof(protein.experiments) !== 'object'){
                throw "Protein " + protein.uniprotId + " has bad formatted reads.";
            }
            if (protein.experiments.constructor !== Array) {
                protein.experiments = [protein.experiments];
            }

            protein.experiments.forEach(function(experiment) {
                if(self.count+1 > self.options.limit){
                    return;
                }

                let currentCurveId = protein.uniprotId+"-E"+experiment.experiment;

                if(self.data[currentCurveId] === undefined){
                    let current = {
                        p: protein.uniprotId,
                        e: experiment.experiment,
                        r: experiment.reads
                    };

                    self.data[currentCurveId] = current;
                    self.count++;

                    let strokeColor = "steelblue";
                    if (experiment.strokeColorId) {
                        strokeColor = experiment.strokeColorId.getHashCode().intToHSL();
                    } else if (self.options.strokeColor) {
                        strokeColor = self.options.strokeColor;
                    } else if (protein.uniprotId && experiment.experiment) {
                        strokeColor = (currentCurveId).getHashCode().intToHSL();
                    }

                    // Add the valueline path.
                    self.lineSvg.append("path")
                        .attr("class", "line MECU "+currentCurveId)
                        .attr("fill", "none")
                        .attr("transform", "translate(" + self.margin.left + ",0)")
                        .attr("stroke", strokeColor)
                        .attr("stroke-width", self.options.strokeWidth || '1em')
                        .attr("d", self.valueline(self.data[currentCurveId].r))
                        .style("stroke-linecap", "round");
                }
            });
        });
    }

    toggleAverage(averageCurve) {
        let curve;

        if (typeof(averageCurve) === 'undefined' || averageCurve === null || typeof(averageCurve) !== 'object') {
            let y = {};
            Object.values(this.data)
                .forEach(curve => {
                    curve.r.forEach(read => {
                        if(y[read.t] === undefined){
                            y[read.t] = [read.r]
                        } else {
                            y[read.t].push(read.r);
                        }
                    })
                });

            let values = [];

            for(let temp in y){
                let reads = y[temp];
                values.push({
                    t: temp,
                    r: reads.reduce((s,v) => s+v) / reads.length
                });
            }

            curve = {
                p: "average",
                e: "average",
                r: values
            }
        } else {
            curve = averageCurve;
        }

        let values = curve.r;

        this.lineSvg
            .selectAll(".line.MECU")
            .transition().duration(1500).style('opacity')
            .attr("stroke", "gray")
            .attr("opacity", ".5");
        this.acerageCurve = this.lineSvg
            .append("path");
        this.acerageCurve
            .attr("class", "average MECU")
            .attr("fill", "none")
            .attr("opacity", "0")
            .attr("transform", "translate(" + this.margin.left + ",0)")
            .attr("stroke", "red")
            .attr("stroke-width", this.options.strokeWidth || '1em')
            .attr("d", this.valueline(values))
            .style("stroke-linecap", "round");
        this.acerageCurve
            .transition().duration(1500).style('opacity')
            .attr("opacity", "1");
    }

    /**
     * Calling this on the object will toggle the X and Y axes
     */
    toggleAxes() {
        if(this.options.axes){
            this.yAxisElement.style("opacity", "0");
            this.xAxisElement.style("opacity", "0");
        } else {
            this.yAxisElement.style("opacity", "1");
            this.xAxisElement.style("opacity", "1");
        }

        this.options.axes = !this.options.axes;
    }

    /**
     * Function to scale the X axis of the graph to different max and min temperatures
     *
     * @param min - The minimum temperature to be represented in the graph (In C)
     * @param max- The maximum temperature to be represented in the graph (In C)
     */
    rescale(min, max) {
        if(min === 0){
            min = min + "";
        }
        if(max === 0){
            max = max + "";
        }
        this.x.domain([min || 30, max || 80]);

        this.xAxisElement
            .transition().duration(1500).ease(easeSinInOut)  // https://github.com/mbostock/d3/wiki/Transitions#wiki-d3_ease
            .call(this.xAxis);

        for (let k in this.data) {
            // Add the valueline path.
            this.lineSvg.select(".MECU"+k)
                .transition().duration(1500).ease(easeSinInOut)
                .attr("d", this.valueline(this.data[k].r));
        }
    }
}

module.exports = MecuLine;
