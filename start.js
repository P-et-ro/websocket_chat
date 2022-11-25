const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

var bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: false }));

var cookieParser = require('cookie-parser');
app.use(cookieParser());

var cookie = require('cookie');

const { 
    v4: uuidv4,
  } = require('uuid');


app.use(express.static("public"));

const sessions = {};

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
    const cookieObject = cookie.parse(socket.handshake.headers.cookie);
    const chatid = cookieObject.chatid;

    if(!sessions[chatid]) {
        io.emit('chat message', {
            msg: "Errore, rifai l'accesso",
            isError: true
        });
        return;
    }

    io.emit('chat message', {
        msg: sessions[chatid].username + ' partecipa alla chat'
    });

    io.emit('users', Object.values(sessions).filter(item => item).map(item => item.username));

    socket.on('disconnect', () => {
        io.emit('chat message', {
            msg: sessions[chatid].username + ' ha lasciato la chat'
        });
        sessions[chatid] = undefined;
        const userssessions = Object.values(sessions);
        io.emit('users', Object.values(sessions).filter(item => item).map(item => item.username));
      });

    socket.on('chat message', (msgobj) => {
        io.emit('chat message', {
            msg: sessions[msgobj.chatid].username +': ' + msgobj.msg
        });
      });
  });

app.post('/chat', (req, res) => {
    const chatid = uuidv4();
    sessions[chatid] = {
        username: req.body.username
    }

      res.cookie('chatid', chatid).sendFile(__dirname + '/chat.html');
  });

server.listen(3000, () => {
  console.log('listening on *:3000');
});