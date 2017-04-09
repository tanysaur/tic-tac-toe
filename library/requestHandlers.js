
//required libraries
var http = require("http");
var path = require("path"); 
var fs = require("fs");     
var url = require("url");


function handleStaticFiles(response, pathname) {

	var now = new Date();
	var __dirname = "./public";

	pathname = (pathname == "/") ? "/index.html" : pathname ;

	var filename = pathname || "index.html";
	var ext = path.extname(filename);
	var localPath = __dirname;
	var validExtensions = {
		".html" : "text/html",			
		".js": "application/javascript", 
		".css": "text/css",
		".txt": "text/plain",
		".jpg": "image/jpeg",
		".gif": "image/gif",
		".png": "image/png",
		".ico": "image/icon"
	};
	var isValidExt = validExtensions[ext];
 
	if (isValidExt) {
		
		localPath += filename;
		fs.exists(localPath, function(exists) {
			if(exists) {
				console.log("Serving file: " + localPath);
				getFile(localPath, response, isValidExt);
			} else {
				console.log("File not found: " + localPath);
				response.writeHead(404, {"Content-Type": "text/plain"});
	    		response.write("404 File Not found.");
				response.end();
			}
		});
 
	} else {
		console.log("Invalid file extension detected: " + pathname + "cool" + filename);
		response.writeHead(404, {"Content-Type": "text/plain"});
	    response.write("404 File Not found.");
		response.end();
	}

	function getFile(localPath, res, mimeType) {

		  fs.readFile(localPath, 
		  		function(err, contents) {
				    if(!err) {
				      res.setHeader("Content-Length", contents.length);
				      res.setHeader("Content-Type", mimeType);
				      res.statusCode = 200;
				      res.end(contents);
				    } else {
				      res.writeHead(500);
				      res.end();
				    }
				}
		  );
	}
}

exports.handleStaticFiles = handleStaticFiles;