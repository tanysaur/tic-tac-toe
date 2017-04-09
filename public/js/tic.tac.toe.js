
/*-------------------------------------------------------------------------------------------------------
Global Variables
--------------------------------------------------------------------------------------------------------*/

var serverVariables = {
	gameId		: ''
};

var Game = {
	PlayerOne 		: null,
	PlayerTwo 		: null,
	CurrentPlayer 	: null,
	Board 			: [0, 0, 0, 0, 0, 0, 0, 0, 0],
	Chances 		: 0,
	Winner			: null,
	WinningCase 	: 0
};

var socket = io('ws://tictactoe-ynos1234.rhcloud.com:8000');

var Me = 0,
	MyId = 0,
	playerDisable = true,
	otherPlayersMove = false,
	createGameFlag = null;



/*-------------------------------------------------------------------------------------------------------
Socket Events
--------------------------------------------------------------------------------------------------------*/

//testing on connection
socket.on('news', function (data) {
			    socket.emit('my other event', { my: 'data' });
			    console.log(data['hello']);
			    // console.log("socketid:"+socket.io.engine.id);
			    MyId = socket.io.engine.id ;
			  });


//server acknowledgement of creation of a new game 
socket.on('CreateGameAcknowledge', function(data) {
				createGameSuccess(data);
				console.log('Game created : ' + data);
			});


//server acknowledgement for joining a game
socket.on('JoinGameAcknowledge', function(data){
				console.log(data[1]);
				if( data[0]) {
					startGame(data[2], 'You');
				}
				else {
					enableJoinGame(data[1]);
				}
			});


//server acknowledgement on new user connected to your game
socket.on('newUserJoined', function(data) {
				console.log('Start playing dude. User Joined.');
				startGame( 'You', data['secondPlayer']);
			});


//playing game 
socket.on('playGame', function(data) {
				console.log('Other players move recieved.');
				otherPlayersMove = true;
				play(data);
				console.log("Other players move implemented.");
				//implementOtherPlayersMove(data);
			});


//Notify if the other player left the game
socket.on('PlayerLeft', function(data) {
				console.log(data + " ::: Other player left dude.");
				loadPreloader();
			});

//Restarting the game
socket.on('RestartGame', function(data) {
				console.log(data+ " ::: The other guy restarted.");
				gameinit();
			});


/*-------------------------------------------------------------------------------------------------------
Genaral functions
--------------------------------------------------------------------------------------------------------*/

/*funtion to select an element by id or name 
if flag = 0 , select id, or select by name */
function getId( name , flag ) {

		return (flag ? document.getElementById(name) : document.getElementsByName(name)[0].value );
	}


function editClass(object, flag) {

	for (var id in object) {
		if( flag ) {
			document.getElementById(id).classList.add(object[id]);
		} else {
			document.getElementById(id).classList.remove(object[id]);
		}	
	}
}

function displayMsg(msg) {

	for (var id in msg) {
		document.getElementById(id).innerHTML = msg[id]; 	
	}	
}


function applyStyle( whichStyle, id, value) {

	switch(whichStyle) {
		case 1 : getId(id, 1).style.display = value;
				 break;
		case 2 : getId(id, 1).style.width = value;
				 break;	
		case 3 : getId(id, 1).style.marginLeft = value;
				 break;	
		case 4 : getId(id, 1).style.marginTop = value;
				 break;
		case 5 : getId(id, 1).removeAttribute(value);
				 break;
		case 6 : getId(id, 1).setAttribute(value[0], value[1]);
				 break;		 
	}	
}

function hideClass( list) {
	var obj = {};
	list.forEach( function(item) {
		obj[item] = "hide";
		applyStyle(5, item, "class");
	});
	editClass(obj, 1);
}

function showClass( obj) {
	var remClass = {};
	for( var item in obj){
		obj[item] =  obj[item] ? "showIB" : "showB" ;
		remClass[item] = "hide";
	}
	editClass(obj, 1);
	editClass(remClass, 0);
}


/*-------------------------------------------------------------------------------------------------------
Preloader form events and functions
--------------------------------------------------------------------------------------------------------*/

//preloader form listners
initialListners();

function initialListners() {

	//listner for username submit button
	var userNameButton = getId("name-submit", 1);
	userNameButton.addEventListener('click', getUserName, false);

	//listner for create game and join-game button
	getId("create-game", 1).addEventListener('click', createGame, false);
	getId("join-game", 1).addEventListener('click', joinGame, false);
	//getId("join-random-game", 1).addEventListener('click', joinRandomGame, false);

	//hiding some classes
	hideClass(["arena", "create-game", "join-game", "game-id-box", "loader", "loader-text"]);

}

function getUserName(evt) {

	//	alert("cool");
	//removing event listner
	evt.target.removeEventListener( 'click', getUserName, false);

	//hiding the name-submit button
	hideClass(["name-submit"]);

	//getting the username and disabling the input box
	Me = getId("name", 1).value;

	applyStyle(6, "name", ["disabled", "true"]);
	applyStyle(2, "name", "94%");
	applyStyle(4, "clear", "40px");
	console.log(Me);
	
	//unhiding create and join game buttons
	showClass({"create-game" : 1, "join-game" : 1});
}


function createGame( evt) {
    
    //removing listner for create game
	evt.target.removeEventListener('click', createGame, false);
	socket.emit('CreateGame', { 'clientName': Me});
	createGameFlag = true;
	console.log("createGame");
}

function createGameSuccess( data ) {
	
	serverVariables.gameId = data['gameId'];
	Game.PlayerOne = Me;

	helperOfcreateGameSuccess();

	//making him/her the first player
	playerDisable = false;

	console.log("createGameSuccess : " + data['gameId']);
}


function helperOfcreateGameSuccess() {
	//hiding the join game and create game
	hideClass(["create-game", "join-game"]);

	//displaying the game id to the user and showing please wait
	getId("game-id-box", 1).value = "Game ID : " + serverVariables.gameId;
	showClass({"game-id-box" : 1});
	applyStyle(6, "game-id-box", ["disabled", "true"]);
	applyStyle(2, "game-id-box", "94%");

	//displaying preloader img and text
	showClass({"loader" : 0, "loader-text" : 0});
	displayMsg( {"loader-text" : "Waiting for users to connect . ."});
	applyStyle(4, "init", "-200px");
}


function joinGame( evt) {
	var userInputGameId = getId("game-id-box", 1).value;
	if( userInputGameId.length == 5){
		//sent the game ID to server
		evt.target.removeEventListener('click', joinGame, false);
		console.log('Sending Game ID to to server');
		socket.emit('JoinGame' , { 'clientName' : Me, 'gameId' : userInputGameId});
		return 0;
	} else {
		if( getId("game-id-box", 1).style.display == "inline-block") {
			getId("game-id-box", 1).value = "";
			applyStyle(6, "game-id-box", ["placeholder", "Invalid Game ID"]);
		}
	}
	createGameFlag = false;

	//applying element styles
	hideClass(["create-game"]);
	showClass({"game-id-box" : 1});
	console.log("joinGame Show box");
}


function enableJoinGame( msg){
	//adding event listner to join game
	getId("join-game", 1).addEventListener('click', joinGame, false);

	showClass({"loader-text" : 0});
	applyStyle(4, "loader-text", "50px");
	applyStyle(3, "init", "-350px");
	displayMsg({"loader-text" : msg});
}


function startGame( player1, player2) {

	Game.PlayerOne = player1;
	Game.PlayerTwo = player2;
	Game.CurrentPlayer = 1;
	
	console.log("before inti");
	gameinit();

	console.log("after init");
	//hide the preloader things
	hideClass( ["init"] );
	showClass( {"arena" : 1} );
	editClass( {"arena" : "arena"} , 1);
}

function loadPreloader() {
	//hide the arena and unhide preloader
	hideClass(["arena", "game-id-box", "loader"]);
	editClass( {"init" : "init"} , 1);
	showClass({"init" : 0, "create-game" : 1, "join-game" : 1});

	//listner for create game and join-game button
	getId("create-game", 1).addEventListener('click', createGame, false);
	getId("join-game", 1).addEventListener('click', joinGame, false);


	//hide the rest of items below it
	getId("game-id-box", 1).value = "";
	applyStyle(5, "game-id-box", "disabled");
	applyStyle(2, "game-id-box", "auto");
	
	applyStyle(4, "loader-text", "50px");
	displayMsg( {"loader-text" : "The other player left the game."});


	console.log("Final : The pre loader function complete.");
}


/*-------------------------------------------------------------------------------------------------------
All functions related to game and game play
--------------------------------------------------------------------------------------------------------*/

function gameinit() {

	addGameListeners();

	//checking if no names are given
	Game.PlayerOne = Game.PlayerOne == null ? 'Nut' : Game.PlayerOne ;
	Game.PlayerTwo = Game.PlayerTwo == null ? 'Bolt' : Game.PlayerTwo ;

	//clear the BOARD
	for (var i = 0; i < 9; i++) {
		Game.Board[i] = 0;
	};

	//resetting current player and chances
	Game.CurrentPlayer = 1 ;
	Game.Chances = 0;

	playerDisable = createGameFlag ? false : true;
	otherPlayersMove = createGameFlag ? false : true;

	//display players names and welcome message in the stats area
	displayMsg ( { "user_1" : Game.PlayerOne, 
				   "user_2" : Game.PlayerTwo,
				   "msg" 	: "Welcome to new game of Tic-Tac-Toe. " + Game.PlayerOne + " can start the game. "});

	//focus on player one
	playerFocus(1);

	//clear the arena
	clearArena();

	//activating and deactivating all cells
	deactivateAllCells();
	if(createGameFlag)		{  activateCells(); }
}

function addGameListeners() {

	//Listener for restart button
	var restartButton = getId("restart", 1);
	restartButton.addEventListener('click', function() { 
		gameinit(1); 
		socket.emit("RestartGame", "Restart the game.");
		console.log("Restart Command send.");
	}, false);
}

function playerFocus( user )  {

	//remove the focus from both the players
	if( user == 3) {
		editClass( { "user_2" : "active-user-2" , "user_1" : "active-user-1"} , 1);
		editClass( { "user_2" : "active-user" , "user_1" : "active-user"}, 0); 
		return 0;
	}	

	//add focus to one player
	var user_rem = (user == 1 ? 2 : 1);

	//adding the neccessary classes
	var addClasses = {}; 
	addClasses["user_"+user] = "active-user";
	addClasses["user_"+user_rem] = "active-user-"+user_rem;
	editClass( addClasses , 1);

	//removing the neccesary classes
	var removeClasses = {}; 
	removeClasses["user_"+user_rem] = "active-user";
	removeClasses["user_"+user] = "active-user-"+user;
	editClass( removeClasses , 0);

}


function clearArena() {

	//clear all the cells 
	for (var i = 1; i < 10; i++) {
		var cellId = "c"+i;
		applyStyle(5, cellId, "class"); 
		getId(cellId, 1).innerHTML = "&nbsp;&nbsp;&nbsp;" ;
		var cell = {};
		cell[ "c" +i] = 'active';
		editClass( cell, 1);
	};
}



function play(evt) {

	if(playerDisable && !otherPlayersMove) {
		return 0;
	}
	
	if( otherPlayersMove) {
		var num = evt["cell"];
		// removing the listener of the fired element
		getId("c"+num, 1).removeEventListener('click', play, false);
	}
	else {
		// removing the listener of the fired element
		evt.target.removeEventListener('click', play, false);

		//getting the id of the fired element
		var id = event.target.id;
		//alert(id);
		var num = parseInt(id[1]);
	}
	

	//increment the chances
	++Game.Chances;

	//check if the cell is already clicked
	if( Game.Board[num-1] ) { return 0; }

	//change msg
	var user = Game.CurrentPlayer == 1 ? Game.PlayerTwo : Game.PlayerOne ;
	displayMsg( { "msg" : 'Fair play. <br/> Now it\'s ' + (user == 'You'? 'your' : user +'\'s') +' chance.' } );

	//change the board entry
	Game.Board[num-1] = Game.CurrentPlayer ;

	//if not game over, change the color and symbol of clicked cell
	var cls = {};
	var cell = "c"+num;
	
	cls[cell] = 'user-'+ Game.CurrentPlayer +'-cell' ;
	editClass( cls , 1);
	
	cls[cell] = 'active';
	editClass( cls , 0);

	var symbol   = Game.CurrentPlayer == 1 ? 'O' : 'X' ;
	cls[cell] = symbol;
	displayMsg(cls);

	//change the current player
	Game.CurrentPlayer = Game.CurrentPlayer == 1 ? 2 : 1 ;
	playerDisable = !playerDisable;

	if(playerDisable) { deactivateAllCells(); }

	//change the focus in username highlighting
	playerFocus(Game.CurrentPlayer);

	if( !otherPlayersMove) {
		//sending the data to other player
		socket.emit('PlayGame', { 
			cell   : num,
			gameId : serverVariables.gameId,
			board  : Game.Board 
		});

		console.log('Sending click to other player : ' + num);
	}
	
	//if the implemented move was played by other player then actiavte the cells for the current user
	if(otherPlayersMove) { activateCells() ; }
	otherPlayersMove = false;

	//checking whether the game is over
	if ( checkGameOver() ) {
		gameOverEvents();
		return 0;
	}

	//checking end of the game
	if( Game.Chances == 9 ) {
		playerFocus(3);
		displayMsg( { "msg" : "Game Over. <br/> Well played. It is a tie." });
	}
}

function checkGameOver() {
	// return 0;

	var flag = 0;
	var user_num = [1, 2];

	for (var i = 0; i < 2; i++) {

		for (var j = 0; j < 3; j++) {
			// var col = (j*3);
			//check row
			flag = ((Game.Board[j*3] == user_num[i]) && (Game.Board[(j*3)+1] == user_num[i]) && (Game.Board[(j*3)+2] == user_num[i])) ? i+1 : 0 ;
			if (flag) { 
				Game.WinningCase = j+1;
				break;
			};

			//checking column
			flag = ((Game.Board[j] == user_num[i]) && (Game.Board[j+3] == user_num[i]) && (Game.Board[j+6] == user_num[i])) ? i+1 : 0 ;
			if (flag) { 
				Game.WinningCase = j+4;
				break;
			};
		};

		if (flag) { break;};
		//check left diagonal
		flag = ((Game.Board[0] == user_num[i]) && (Game.Board[4] == user_num[i]) && (Game.Board[8] == user_num[i])) ? i+1 : 0 ;
		if (flag) { 
				Game.WinningCase = 7;
				break;
			};	
		//check right diagonal
		flag = ((Game.Board[2] == user_num[i]) && (Game.Board[4] == user_num[i]) && (Game.Board[6] == user_num[i])) ? i+1 : 0 ;
		if (flag) { 
				Game.WinningCase = 8;
				break;
			};

	};


	if (!flag) { return 0 ; };

	Game.Winner = flag;
	return 1;


}



function gameOverEvents() {

	//display the message
	displayMsg( { "msg" : "Game Over. <br/> " + (Game.Winner == 1 ? Game.PlayerOne : Game.PlayerTwo )+ ' won the game.' });

	//remove focus
	playerFocus(3);

	//changing background of the path
	changeBgWonCell();

	//deactivate all remaining cells
	deactivateAllCells();

	//alert( (Game.Winner == 1 ? Game.PlayerOne : Game.PlayerTwo ) +' Won the Game. Congragulations..!!');
}

function deactivateAllCells() {
	//deactivate all remaining cells
	var td = document.querySelectorAll("td");
	for( var i = 0; i < td.length ; ++i ){
		td[i].removeEventListener('click', play, false);
		td[i].classList.remove('active');
	}
}

function activateCells() {
	var td = document.querySelectorAll("td");
	for( var i = 0; i < 9 ; ++i) {
		if( !Game.Board[i]) {
			td[i].addEventListener('click', play, false);
			td[i].classList.add('active');
		}
	}
}

function winCaseToCellMapping() {

	var row = 0;
	if( Game.WinningCase < 4 ) {
		row = (Game.WinningCase - 1)*3;
		return [ row, row + 1, row + 2 ];
	}else if( Game.WinningCase < 7) {
		row = Game.WinningCase - 4 ;
		return [ row, row + 3, row + 6 ];
	}else if( Game.WinningCase == 7) {
		return [0, 4, 8];
	}else if( Game.WinningCase == 8 ) {
		return [2, 4, 6];
	}

}

function changeBgWonCell() {

	var cells = winCaseToCellMapping();
	//change backround of the winning players line of cells

	cells.forEach( function(item) {
		getId("c"+ ++item, 1).classList.remove('user-' + Game.Winner + '-cell');
		getId("c"+ item, 1).classList.add('won-cell');
	});

}

