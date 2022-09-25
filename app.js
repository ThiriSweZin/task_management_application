/**
 * Main Application
 */
// var app = require('./dist/app');
// module.exports = app.default;
let port = process.env.PORT;
if (port == null || port == "") {
  port = 8000;
}
app.listen(port);