var server_port = process.env.OPENSHIFT_NODEJS_PORT || 8181
var server_ip_address = process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1'

var static = require('node-static');
 
var http = require('http');
// Create a node-static server instance
var file = new (static.Server)();

 

var app = http.createServer(function (req, res) {
    file.serve(req, res);
}).listen(server_port,server_ip_address);
// Use socket.io JavaScript library for real-time web applications
var io = require('socket.io').listen(app);
// Let's start managing connections...
io.sockets.on('connection', function (socket) {
    // Handle 'message' messages
    socket.on('message', function (message) {

        log('S --> got message: ', message);
        // channel-only broadcast...
        socket.broadcast.to("test").emit('message', message);
        console.log('hello world');
    });
    // Handle 'create or join' messages
    socket.on('create or join', function (room) {
        var namespace = "/";
        var nC = io.nsps[namespace].adapter.rooms[room];
        var numClients = 0
        if (!nC) {
        } else {
            numClients = nC.length;
        }

        log('S --> Room ' + room + ' has ' + numClients + ' client(s)');
        log('S --> Request to create or join room', room);
        // First client joining...
        if (numClients == 0) {
            socket.join(room);
            socket.emit('created', room);
        } else if (numClients >= 1) {
            // Second client joining...
            io.sockets.in(room).emit('join', room);
            socket.join(room);
            socket.emit('joined', {room: room, sckid: socket.id});
        } else { // max two clients
            socket.emit('full', room);
        }
    });
    socket.on('broadcast : clist', function (list) {
        console.log(list.room + "hello");

        socket.broadcast.to(list.room).emit('broadcast : clist', list.clients);
    });
    socket.on('bye', function (event) {
        socket.broadcast.to(event.room).emit('bye', event.id);
    });
    socket.on('dgroup : data-message', function (event) {
        socket.broadcast.to(event.room).emit('dgroup : data-message', event);
    });


    // Remote Control Events
    socket.on('remote : request', function (event) {
        io.sockets.in(event.room).emit('remote : request', event);
    });
    socket.on('remote : response', function (event) {
        socket.broadcast.to(event.room).emit('remote : response', event);
    });
    socket.on('remote : broadcast response', function (event) {
        socket.broadcast.to(event.room).emit('remote : broadcast response', event);
    });
    socket.on('remote : send', function (event) {
        io.sockets.in(event.room).emit('remote : recieve', event);
    });
    socket.on('remote : disconnect', function (event) {
        socket.broadcast.to(event.room).emit('remote : disconnect', event);
    });
    

    function log() {
        var array = [">>> "];
        for (var i = 0; i < arguments.length; i++) {
            array.push(arguments[i]);
        }
        socket.emit('log', array);
    }
});