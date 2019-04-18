var w;
var h;
var ctx;
var ID;
var tanks;
var f = 0;
var cameraPos = {
    x: undefined,
    y: undefined
}
var looping = false;
function startGame() {

    var ws = new WebSocket("ws://50.96.154.105:3000");
    var c = document.getElementById("game");
    var ninput = document.getElementById("nicknameinput");
    var finput = document.getElementById("ftbinput");
    document.getElementById("title").style = "visibility: hidden;";
    ninput.style = "visibility: hidden;";
    finput.style = "visibility: hidden;";
    c.style = "visibility: visible; position: absolute;";

    w = window.innerWidth;
    h = window.innerHeight;
    ctx = c.getContext('2d');
    c.width = w;
    c.height = h;
    let ping = 0;

    ws.onmessage = (message) => {
        msg = JSON.parse(message.data);
        if (msg.type === "tankdata") {
            tanks = msg.tanks;
        } else if (msg.type === 'id') {
            ID = msg.ID;
            if (!looping) {
                ws.send(JSON.stringify({ data: finput.value, nickname: ninput.value, screenWidth: w, screenHeight: h, type: "playertank", ID }));
                gameLoop();
                looping = true;
            }
        } else if (msg.type == "ping") {
            ping = new Date().getTime() - msg.timestamp;
        }
    }

    function gameLoop() {
        ctx.fillStyle = "#cdcdcd"
        ctx.fillRect(0, 0, w, h);
        f++;
        drawBackground();
        ctx.fillStyle = "#111111"
        ctx.fillText(`Current ping: ${ping} ms`, w - 90, 20);

        ws.send(JSON.stringify({ keys: keys, mouse: { x: mouse.x + cameraPos.x - w / 2, y: mouse.y + cameraPos.y - h / 2, left: leftMouseClicked, right: rightMouseClicked }, ID, type: "playerinputs" }));
        for (tank of tanks) {
            if (tank.ID === ID) {
                cameraPos.x = tank.x;
                cameraPos.y = tank.y;
            }
            drawTank(tank);
        }
        requestAnimationFrame(gameLoop);
    }
}
