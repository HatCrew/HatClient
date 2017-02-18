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
	document.getElementById("chatformcont").className = "container";
	document.getElementById("main").className = "main inlinetest";
	document.getElementById("messages").className = "messages";
	
	join(chatRoom, chatUsername, chatPass, chatServer);

    $("#chatform").onkeydown = function(event) {
        if(event.keyCode == 13 && !event.shiftKey) {
           var message = event.target.value;

           if(message.length <= 0) return;

           event.preventDefault();
           send({ cmd: 'chat', text: message});

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
	} else {
		alert("An error occurred, check your server selection");
		window.location.reload();
	}

	var wasConnected = false

	ws.onopen = function() {
		if (myNick) {
			//localStorageSet('my-nick', myNick)
			send({cmd: 'join', channel: channel, nick: myNick})
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
		pushMessage({nick: '#', text: "HatClient connected to " + chatRoom});
		pushMessage({nick: '*', text: "Users online: " + nicks.join(", ")})
	},
	onlineAdd: function(args) {
		var nick = args.nick
		userAdd(nick)
		if ($('#joined-left').checked) {
			pushMessage({nick: '*', text: nick + " joined"})
		}
	},
	onlineRemove: function(args) {
		var nick = args.nick
		userRemove(nick)
		if ($('#joined-left').checked) {
			pushMessage({nick: '*', text: nick + " left"})
		}
	},
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

function usersClear() {
	var users = $('#users')
	while (users.firstChild) {
		users.removeChild(users.firstChild)
	}
	onlineUsers.length = 0
}

var onlineUsers = []
var ignoredUsers = []

function pushMessage(args) {
	console.log("DEBUG - msg: " + JSON.stringify(args));
	// Message container
	var messageEl = document.createElement('div')
	messageEl.classList.add('message')

	if (args.nick == myNick) {
		messageEl.classList.add('me')
	}
	else if (args.nick == '!') {
		messageEl.classList.add('warn')
	}
	else if (args.nick == '*') {
		messageEl.classList.add('info')
	}
	else if (args.admin) {
		messageEl.classList.add('admin')
	}
	else if (args.mod) {
		messageEl.classList.add('mod')
	}

	// Nickname
	var nickSpanEl = document.createElement('span')
	nickSpanEl.classList.add('nick')
	messageEl.appendChild(nickSpanEl)

	if (args.trip) {
		var tripEl = document.createElement('span')
		tripEl.textContent = args.trip + " "
		tripEl.classList.add('trip')
		nickSpanEl.appendChild(tripEl)
	}

	if (args.nick) {
		var nickLinkEl = document.createElement('a')
		nickLinkEl.textContent = args.nick + ":"
		nickLinkEl.onclick = function() {
			insertAtCursor("@" + args.nick + " ")
			$('#chatinput').focus()
		}
		var date = new Date(args.time || Date.now())
		nickLinkEl.title = date.toLocaleString()
		nickSpanEl.appendChild(nickLinkEl)
	}

	// Text
	var textEl = document.createElement('pre')
	textEl.classList.add('text')

	textEl.textContent = args.text || ''
	textEl.innerHTML = textEl.innerHTML.replace(/(\?|https?:\/\/)\S+?(?=[,.!?:)]?\s|$)/g, parseLinks)

	/*if ($('#parse-latex').checked) {
		// Temporary hotfix for \rule spamming, see https://github.com/Khan/KaTeX/issues/109
		textEl.innerHTML = textEl.innerHTML.replace(/\\rule|\\\\\s*\[.*?\]/g, '')
		try {
			renderMathInElement(textEl, {delimiters: [
				{left: "$$", right: "$$", display: true},
				{left: "$", right: "$", display: false},
			]})
		}
		catch (e) {
			console.warn(e)
		}
	}*/

	messageEl.appendChild(textEl)

	// Scroll to bottom
	var atBottom = isAtBottom()
	$('#messages').appendChild(messageEl)
	if (atBottom) {
		messages.scrollTo(0, document.body.scrollHeight)
	}
	
	unread += 1
}

function isAtBottom() {
            return (messages.innerHeight + messages.scrollY) >= (document.body.scrollHeight - 1)
}
