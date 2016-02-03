var http = require('http');
var url = require('url');
var fs = require('fs');

// sends file back to client
function sendFile(res, url) {
  if (url === '/') {
    fs.readFile('index.html', function(err, data) {
      res.end(data);
    });
  } else {
    fs.readFile(url.substr(1), function(err, data) {
      res.end(data);
    });
  }
}

var server = http.createServer(function (req, res) {
  var url_parts = url.parse(req.url);

  console.log(url_parts);

  sendFile(res, url_parts.pathname);
  
});

server.listen(process.env.PORT || 8080, function(err) {
  if (process.env.PORT) 
    console.log("Server listening on port".concat(process.env.PORT.toString()));
  else
    console.log("Server listening on port 8080");
})