/*
 * mecu-viz
 * https://github.com/sacdallago/mecu-viz
 *
 * Copyright (c) 2016 Christian Dallago
 * Licensed under the Apache-2.0 license.
 */

const d3 = require("d3");

/**
@class mecuviz
 */

var  mecuviz;
module.exports = mecuviz = function(data, opts){
    this.data = data;
    this.el = opts.el;
    this.el.textContent = mecuviz.hello(opts.text);
};

/**
 * Private Methods
 */

/*
 * Public Methods
 */

/**
 * Method responsible to say Hello
 *
 * @example
 *
 *     mecuviz.hello('biojs');
 *
 * @method hello
 * @param {String} name Name of a person
 * @return {String} Returns hello name
 */


mecuviz.hello = function (name) {
    return 'hello ' + name;
};

