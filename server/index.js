const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: "*" } });

const roomProfiles = {}; 

io.on('connection', (socket) => {
  socket.on('join_room', (data) => {
    socket.join(data.room);
    socket.room = data.room;
    socket.profile = data.profile;

    if (!roomProfiles[data.room]) roomProfiles[data.room] = {};
    roomProfiles[data.room][socket.id] = data.profile;

    io.to(data.room).emit('update_user_list', Object.values(roomProfiles[data.room]));
    
    io.to(data.room).emit('receive_message', {
      message: `${data.profile.username} приєднався`,
      isSystem: true,
      time: new Date().toLocaleTimeString()
    });
  });

  socket.on('chat_message', (data) => {
    io.to(data.room).emit('receive_message', {
      message: data.message,
      time: data.time,
      senderProfile: data.profile 
    });
  });

  socket.on('disconnect', () => {
    if (socket.room && roomProfiles[socket.room] && socket.profile) {
      delete roomProfiles[socket.room][socket.id];
      io.to(socket.room).emit('update_user_list', Object.values(roomProfiles[socket.room]));
      io.to(socket.room).emit('receive_message', {
        message: `${socket.profile.username} вийшов`,
        isSystem: true
      });
    }
  });
});

httpServer.listen(3001, () => console.log("Сервер запущено!"));