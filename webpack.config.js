module.exports = {
    entry: __dirname + '/lib/index.js',
    output: {
         path: __dirname + '/build',
         filename: 'mecu-line.js',
         libraryTarget: 'var',
         library: 'MecuLine'
    }
 };