var qt = require("./QuadTree.js");
var diep = require("./Diep.js");

var WebSockerServer = require("ws").Server;
var wss = new WebSockerServer({ port: 3000 })
var tanks = [];
var activeConnections = [];
var IDcounter = 0;
// World width, world height
var ww = 10000;
var wh = 10000;
started = false;
var q = new qt.QuadTree(0, 0, ww, wh, 2);

wss.on("connection", (ws) => {

    ws.send(JSON.stringify({ ID: IDcounter, type: "id" }));
    activeConnections.push({ ws, ID: IDcounter++ });

    ws.on("message", (message) => {
        msg = JSON.parse(message);

        if (msg.type === "playertank") {
            // Recieve data about the client's tank and add it to the world
            tanks.push(new diep.Tank(ww / 2 + (Math.random() * 500 - 250), wh / 2 + (Math.random() * 500 - 250), 0, 0, 32, msg.screenWidth, msg.screenHeight, barrelsFromFTBJSON(msg.data), msg.nickname, "#00b2e1", msg.ID));
        } else if (msg.type === "playerinputs") {
            let tank = findTankByID(msg.ID);
            // Handle player inputs and update tank
            tank.handleInputs(msg);
        }

    });

    // Prevents the loop from running if nobody has connected
    if (!started) {
        serverLoop();
        started = true;
    }
});

var f = 0;
function serverLoop() {
    f++;
    // Make a quadtree and insert all tanks
    q = new qt.QuadTree(0, 0, ww, wh, 2, true);
    for (let tank of tanks) {
        q.insert(tank);
    }
    for (let tank of tanks) {
        tank.update();
        tank.collisionDetect(q);
    }

    // Main loop that provides data to all of the connections
    for (let i = activeConnections.length - 1; i >= 0; i--) {
        let playerTank = findTankByID(activeConnections[i].ID);
        if (playerTank) {
            if (activeConnections[i].ws.readyState === activeConnections[i].ws.OPEN) {
                // Ensure the client can't change their id by constantly sending it
                activeConnections[i].ws.send(JSON.stringify({ ID: activeConnections[i].ID, type: "id" }));
                // Send the client data about all the tanks around them
                activeConnections[i].ws.send(JSON.stringify({ tanks: q.fetchBox(playerTank.x - playerTank.screenWidth / 2, playerTank.y - playerTank.screenHeight / 2, playerTank.screenWidth, playerTank.screenHeight), type: "tankdata" }));
            } else {
                // If the connection is not open, remove the connection from the activeConnections array and the associated tank
                for (let j = tanks.length - 1; j >= 0; j--) {
                    if (tanks[j].ID == activeConnections[i].ID) {
                        tanks.splice(j, 1);
                    }
                }
                activeConnections.splice(i, 1);
            }
        }
    }

    setTimeout(serverLoop, 10);
}

// Takes FTB json and translates it into an array of diep-clone barrels
function barrelsFromFTBJSON(jsonString) {
    var ret = [];
    var jsonArray = JSON.parse(jsonString);
    for (let json of jsonArray) {
        ret.push(new diep.Barrel(json.xoffset, json.yoffset, json.width, json.length, json.angle, json.basereload, json.basedelay, json.damage, json.spread, json.type));
    }
    return ret;
}

// Used for taking a connection ID and returning the tank with the same ID
function findTankByID(id) {
    for (tank of tanks) {
        if (tank.ID === id) {
            return tank;
        }
    }
}
