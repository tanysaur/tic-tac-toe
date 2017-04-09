
//external required modules
var http = require("http");
var url = require("url");

//server config
var port = process.env.OPENSHIFT_NODEJS_PORT || 8000;
var serverUrl = process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1';

console.log(" serverUrl : " + serverUrl + " Port : " + port);


//socket io required variables
var io = '';
var connectedUsers = 0;
var ongoingGames = 0;
var globalSocket = 0;


function start(route, handle) {
    function onRequest(request, response) {
        var postData = "";
        var pathname = url.parse(request.url).pathname;
        var getData = url.parse(request.url).query;  
        console.log("Request for " + pathname + " received.");
        request.setEncoding("utf8");
        
        request.addListener("data", function(postDataChunk) { 
              postData += postDataChunk;
              console.log("Received POST data chunk '"+ postDataChunk + "'.");
        });

        request.addListener("end", function() { route(handle, pathname, response, postData, getData);}); 
    }
    ioConnection = http.createServer(onRequest).listen(port, serverUrl);
    io = require('socket.io')(ioConnection);
    console.log("Starting web server at " + serverUrl + ":" + port);

    //Socket IO operations
    io.on('connection', function (socket) {
        ++connectedUsers;
        console.log("User connected : " + socket.id + ", Connected Users : " + connectedUsers);
        
        socket.emit('news', { hello: 'world' });
        
        //while creating a game
        socket.on('CreateGame', function (data) {
          console.log('Create Game Request from : '+ data['clientName'] + " : " + socket.id);
          createGame(socket, data);
        });

        //while joining a created game
        socket.on('JoinGame', function (data) {
            console.log('Join Game request.' + data['clientName'] + " : " + socket.id);
            joinGame(socket, data);
        });

        //playing a game
        socket.on('PlayGame', function (data){
            console.log('Playing game');
            playGame( socket, data);
        });

        //playing a game
        socket.on('RestartGame', function (data){
            console.log('Game restarted by '+socket.nickName);
            restartGame( socket, data);
        });


        //on disconnect
        socket.on('disconnect', function() {
            --connectedUsers;
            playerLeft(socket);
            console.log( "User disconnected : " + socket.id + ", Connected Users : " + connectedUsers);
        });


    });

}

function createGame(socket, data) {
    var gameId = Math.random().toString(36).substr(2, 5);
    socket.join(gameId);
    socket.gameId = gameId;
    socket.emit('CreateGameAcknowledge', {'gameId' : gameId});
    socket.nickName = data['clientName'];

    console.log('Successfully created game with gameID : '+ gameId);
}

function joinGame(socket, data) {

    socket.nickName = data['clientName'];

    var msg = '', playerOne = null, playerOneId = null;

    var clients = io.sockets.adapter.rooms[data['gameId']];
    var numClients = (typeof clients !== 'undefined') ? Object.keys(clients).length : 0;

    //getting the details of players in the same gameID room
    for (var clientId in clients ) {
        var clientSocket = io.sockets.connected[clientId];
        playerOneId = clientId;
        playerOne = clientSocket.nickName;
        console.log("Socket nick name : " + clientSocket.nickName);
    }

    //validating the incoming connection
    if( numClients == 1 ) {        
        socket.join( data['gameId']);
        socket.gameId = data['gameId'];
        io.sockets.connected[playerOneId].emit('newUserJoined', { secondPlayer: socket.nickName});
        msg = [true, 'Successfully Joined the game.', playerOne];
    } 
    else if(numClients == 2) {
        msg = [false, 'Two players are already connected and playing using using this Game ID.'];
    } 
    else {
        msg = [false, 'This Game ID does not exist in the server. May be the one who have created this ID might have left.'];
    }

    socket.emit('JoinGameAcknowledge', msg);
}

function playGame( socket, data) {

   //checking whether other player left 
   var clients = io.sockets.adapter.rooms[socket.gameId];   
   var numClients = (typeof clients !== 'undefined') ? Object.keys(clients).length : 0;

   if( numClients == 2 ){

        for (var clientId in clients ) {
            if(clientId != socket.id){
                var clientSocket = io.sockets.connected[clientId];
                clientSocket.emit('playGame', data);
                console.log("socket : "+socket.id + " client :"+clientId + " numClients :" + numClients);
            }    
        }
   }
   else {
        socket.emit('PlayerLeft', "Other player left.gameId : " + socket.gameId +" From server." + numClients);
        console.log("playGame fn : player Left msg.");
   }
    
}


function playerLeft(socket) {
   var clients = io.sockets.adapter.rooms[socket.gameId];   
   var numClients = (typeof clients !== 'undefined') ? Object.keys(clients).length : 0;

   for (var clientId in clients ) {
        if(clientId != socket.id){
            var clientSocket = io.sockets.connected[clientId];
            clientSocket.emit('PlayerLeft', "The other player left.");
        }    
    } 
}

function restartGame( socket, data) {
    //checking whether other player left 
   var clients = io.sockets.adapter.rooms[socket.gameId];   
   var numClients = (typeof clients !== 'undefined') ? Object.keys(clients).length : 0;

   if( numClients == 2 ){

        for (var clientId in clients ) {
            if(clientId != socket.id){
                var clientSocket = io.sockets.connected[clientId];
                clientSocket.emit('RestartGame', data);
            }    
        }
   }
   else {
        socket.emit('PlayerLeft', "Other player left.gameId : " + socket.gameId +" From server." + numClients);
        console.log("playGame fn : player Left msg.");
   }

}


exports.start = start;