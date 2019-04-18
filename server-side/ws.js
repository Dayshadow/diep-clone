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
            let tankInfo = tankInfoFromFTBJSON(msg.data);
            tanks.push(
                new diep.Tank(
                    ww / 2 + (Math.random() * 500 - 250), // X pos
                    wh / 2 + (Math.random() * 500 - 250), // Y pos
                    0, // X velocity
                    0, // Y velocity
                    tankInfo.bodyRadius, // Body radius
                    msg.screenWidth, // Screen height
                    msg.screenHeight, // Screen width
                    tankInfo.barrels, // Barrel array
                    msg.nickname, // Tank name
                    tankInfo.bodyColor, // Body color
                    tankInfo.barrelColor, // Barrel color
                    msg.ID // ID
                )
            );
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

    if (f % 200 == 0) {
        for (let connection of activeConnections) {
            connection.ws.send(JSON.stringify({ timestamp: new Date().getTime(), type: "ping" }));
        }
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
function tankInfoFromFTBJSON(jsonString) {
    var ret = [];
    let tankInfo = jsonString.match(/[^\[]*/)[0].split('*');
    let bodyRadius = tankInfo[0] * 0.625;
    let bodyColor = tankInfo[2];
    let barrelInfo = jsonString.slice(jsonString.match(/[^\[]*/)[0].length);
    var barrelArray = JSON.parse(barrelInfo);
    for (let barrel of barrelArray) {
        ret.push(
            new diep.Barrel(
                barrel.xoffset * 0.625,
                barrel.yoffset * 0.625,
                barrel.width * 0.625,
                barrel.length * 0.625,
                barrel.angle,
                barrel.basereload,
                barrel.basedelay,
                barrel.damage,
                barrel.spread
            )
        );
    }
    return { barrels: ret, bodyRadius, bodyColor};
}

// Used for taking a connection ID and returning the tank with the same ID
function findTankByID(id) {
    for (tank of tanks) {
        if (tank.ID === id) {
            return tank;
        }
    }
}
