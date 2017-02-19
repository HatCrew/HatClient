	var chatUsername = document.getElementById("username").value;
	var chatPass = document.getElementById("password").value;
	var chatServer = document.getElementById("serverchoice").value;
	var chatRoom = document.getElementById("room").value;


function $(query) {return document.querySelector(query)}

function initialize() {
	alert("Please note that this an early demo, and that some features may not work properly. Also, I suck at making things responsive :P");
	var chatUsername = document.getElementById("username").value;
	var chatPass = document.getElementById("password").value;
	var chatServer = document.getElementById("serverchoice").value;
	var chatRoom = document.getElementById("room").value;
	
	document.getElementById("welcomepage").className = "welcomepage hidden";
	document.getElementById("main").className = "";
	
	join(chatRoom, chatUsername, chatPass, chatServer);

    $("#chatform").onkeydown = function(event) {
        if(event.keyCode == 13 && !event.shiftKey) {
           var message = event.target.value;

           if(message.length <= 0) return;

           event.preventDefault();
		   if (message == ".help") {
			pushMessage({nick: '## HatClient ##', text: 'Commands: .ban [user], .online'})
		   } else if (message.substring(0, 5) == ".ban ") {
			   var userToBan = message.substring(6, message.length);
			   send({cmd: 'ban', nick: userToBan});
		   } else if (message == ".online") {
			    var onlineList = onlineUsers.join(', ') + '.';
				pushMessage({nick: '## HatClient ##', text: 'Users online: ' + onlineList});
		   } else {
           send({cmd: 'chat', text: message});
		   }
           event.target.value = '';
            
        }
    };
}


var ws;
var myNick = chatUsername + "#" + chatPass;

//Retain ws connection
window.setInterval(function() {
send({cmd: 'ping'})
}, 50000)
	
function join(channel, cUsername, cPassword, cServer) {
	var myNick = cUsername + "#" + cPassword;
	var room = channel;
	if (cServer == "hackchat") {
		ws = new WebSocket('wss://hack.chat/chat-ws');
	} else if (cServer == "32chat") {
		ws = new WebSocket('ws://chat.32ch.org:6060');
	} else if (cServer == "toastychat") {
		ws = new WebSocket('wss://chat.toastystoemp.com/chatws');
	} else if (cServer == "sleepychat") {
		ws = new WebSocket('ws://sleepykev.tk:6060');
	} else {
		alert("An error occurred, check your server selection");
		window.location.reload();
	}

	var wasConnected = false

	ws.onopen = function() {
		if (myNick) {
			//localStorageSet('my-nick', myNick)
			if (cServer == "toastychat") {
				send({cmd: 'join', channel: channel, nick: cUsername, pass: cPassword})
			} else {
			send({cmd: 'join', channel: channel, nick: myNick})
			}
		}
		wasConnected = true

		ws.onclose = function() {
			if (wasConnected) {
				pushMessage({nick: '!', text: "Server disconnected. Attempting to reconnect..."})
			}
			window.setTimeout(function() {
				join(channel)
			}, 2000)
		}

		ws.onmessage = function(message) {
			var args = JSON.parse(message.data)
			var cmd = args.cmd
			var command = COMMANDS[cmd]
			command.call(null, args)
		}
	}
}
var COMMANDS = {
	chat: function(args) {
		if (ignoredUsers.indexOf(args.nick) >= 0) {
			return
		}
		pushMessage(args)
	},
	info: function(args) {
		args.nick = '*'
		pushMessage(args)
	},
	warn: function(args) {
		args.nick = '!'
		pushMessage(args)
	},
	onlineSet: function(args) {
		var nicks = args.nicks
		usersClear()
		nicks.forEach(function(nick) {
			userAdd(nick)
		})
		pushMessage({nick: '*', text: "Users online: " + nicks.join(", ")})
	},
	onlineAdd: function(args) {
		var nick = args.nick
		userAdd(nick)
		pushMessage({nick: '*', text: nick + " joined"})
	},
	onlineRemove: function(args) {
		var nick = args.nick
		userRemove(nick)
		pushMessage({nick: '*', text: nick + " left"})
	},
}
function userAdd(nick) {
	onlineUsers.push(nick);
}
function userRemove(nick) {
	var index = onlineUsers.indexOf(nick)
	if (index >= 0) {
		onlineUsers.splice(index, 1)
	}
}
function send(data) {
	if (ws && ws.readyState == ws.OPEN) {
		ws.send(JSON.stringify(data))
	}
}

function parseLinks(g0) {
	var a = document.createElement('a')
	a.innerHTML = g0
	var url = a.textContent
	a.href = url
	a.target = '_blank'
	return a.outerHTML
}

function inviteUser() {
	var userToInvite = document.getElementById("userToInvite").value;
	send({cmd: 'invite', nick: userToInvite});
}
function ignoreUser() {
	var userToIgnore = document.getElementById("userToIgnore").value;
	ignoredUsers.push(userToIgnore);
	pushMessage({nick: '## HatClient ##', text: 'You are now ignoring messages from ' + userToIgnore});
}

function usersClear() {
	onlineUsers.length = 0
}

var onlineUsers = []
var ignoredUsers = []

function pushMessage(args) {
	// Message container
	var messageEl = document.createElement('li')
	messageEl.classList.add('collection-item')
	messageEl.classList.add('avatar')

	if (args.nick == chatUsername) {
		messageEl.classList.add('me')
	}
	else if (args.nick == '!') {
		messageEl.classList.add('warn')
		messageEl.innerHTML = messageEl.innerHTML + '<i id="userimage" class="material-icons circle orange">error_outline</i>'
	}
	else if (args.nick == '*') {
		messageEl.innerHTML = messageEl.innerHTML + '<i id="userimage" class="material-icons circle black">star</i>'
	}
	else if (args.admin) {
		messageEl.innerHTML = messageEl.innerHTML + '<i id="userimage" class="material-icons circle red">verified_user</i>'
	}
	else if (args.mod) {
		messageEl.innerHTML = messageEl.innerHTML + '<i id="userimage" class="material-icons circle green">verified_user</i>'
	} else {
		messageEl.innerHTML = messageEl.innerHTML + '<i id="userimage" class="material-icons circle">chat</i>'
	}

	// Nickname
	var nickSpanEl = document.createElement('span')
	nickSpanEl.classList.add('title')
	messageEl.appendChild(nickSpanEl)

	if (args.nick) {
		var nickSpanEl2 = document.createElement('span')
		nickSpanEl2.innerHTML = nickSpanEl2.innerHTML + args.nick + '</span>'
		nickSpanEl.appendChild(nickSpanEl2)
	}
	
	if (args.trip) {
		var tripEl = document.createElement('p')
		tripEl.innerHTML = tripEl.innerHTML + "<span style='color: grey'>" + args.trip + "</span>"
		//tripEl.classList.add('trip')
		nickSpanEl.appendChild(tripEl)
	} else {
		var tripEl = document.createElement('p')
		tripEl.innerHTML = tripEl.innerHTML + "<span style='color: grey'>No Trip</span>"
		//tripEl.classList.add('trip')
		nickSpanEl.appendChild(tripEl)
	}

	// Text
	var textEl = document.createElement('pre')
	textEl.classList.add('text')

	textEl.innerHTML = textEl.innerHTML + args.text || ''
	textEl.innerHTML = textEl.innerHTML.replace(/</g, "&lt;").replace(/>/g, "&gt;")
	textEl.innerHTML = textEl.innerHTML.replace(/(\?|https?:\/\/)\S+?(?=[,.!?:)]?\s|$)/g, parseLinks)
	var comingsoon = "Feature coming soon";
	textEl.innerHTML = textEl.innerHTML + '</p>'

	// Scroll to bottom
	var atBottom = isAtBottom();

	messageEl.appendChild(textEl);
	$('#messages').appendChild(messageEl);

	if (atBottom) {
		window.scrollTo(0, Math.max( document.body.scrollHeight,
															document.body.offsetHeight,
	                       			document.documentElement.clientHeight,
															document.documentElement.scrollHeight,
															document.documentElement.offsetHeight ));
	} else {
		//unread += 1
	}
}

function isAtBottom() {
	var docHeight = Math.max( document.body.scrollHeight,
														document.body.offsetHeight,
                       			document.documentElement.clientHeight,
														document.documentElement.scrollHeight,
														document.documentElement.offsetHeight );

	return (docHeight == (window.pageYOffset + window.innerHeight));
}
