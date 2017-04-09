

function route(handle, pathname, response, postData, getQuery) { 
	
	console.log("About to route a request for " + pathname); 
	
	if (typeof handle[pathname] === 'function') {
		if( pathname == "/" ) {
			handle[pathname](response, pathname);
		} else {
			handle[pathname](response, postData, getQuery); 
		}	
	} 
	else {

		//checking whether the request is for a static file
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
		
		if( validExtensions["." + pathname.split('.').pop()] ) {
			handle["static"](response, pathname);	
			// requestHandlers.handleStaticFiles(pathname, response);
		}
		else {	
	    	console.log("No request handler found for " + pathname);
	    	response.writeHead(404, {"Content-Type": "text/plain"});
	    	response.write("404 Not found");
	    	response.end();
	    }	
	} 
}



exports.route = route;
