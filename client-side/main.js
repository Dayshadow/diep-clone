let w;
let h;
let ctx;
let ID;
let tanks = [];
let objs = [];
let f = 0;
let cameraPos = {
    x: undefined,
    y: undefined
}
let looping = false;
let sentTankData = false;
function startGame() {
    initializeInputHandling();
    let ws = new WebSocket("ws://50.96.154.105:3000");
    let c = document.getElementById("game");
    let ninput = document.getElementById("nicknameinput");
    let finput = document.getElementById("ftbinput");
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
            if (!looping) {
                gameLoop();
                looping = true;
            }
        } else if (msg.type === 'id') {
            ID = msg.ID;
            if (!looping && !sentTankData) {
                ws.send(JSON.stringify({ data: finput.value, nickname: ninput.value, screenWidth: w, screenHeight: h, type: "playertank", ID }));
                sentTankData = true;
            }
        } else if (msg.type === "ping") {
            ping = new Date().getTime() - msg.timestamp;
        } else if (msg.type === "objdata") {
            objs = msg.objs;
        }
    }

    function gameLoop() {
        ctx.fillStyle = "#cdcdcd"
        ctx.fillRect(0, 0, w, h);
        f++;
        let found = false;
        for (let tank of tanks) {
            if (tank.ID == ID) {
                found = true;
            }
        }
        if (!found) {
            document.location.reload();
        }
        drawBackground();
        ctx.fillStyle = "#111111"
        ctx.fillText(`Current ping: ${ping} ms`, w - 90, 20);

        ws.send(JSON.stringify({ keys: keys, mouse: { x: mouse.x + cameraPos.x - w / 2, y: mouse.y + cameraPos.y - h / 2, left: leftMouseClicked, right: rightMouseClicked }, ID, type: "playerinputs" }));
        for (let obj of objs) {
            if (obj.type == "bullet") {
                if (obj.ownerID == ID) {
                    diepCircle(obj.x - cameraPos.x + w / 2, obj.y - cameraPos.y + h / 2, obj.r, "#00b2e1");
                } else {
                    diepCircle(obj.x - cameraPos.x + w / 2, obj.y - cameraPos.y + h / 2, obj.r, "#f14e54");
                }
            }
        }
        for (let tank of tanks) {
            if (tank.ID === ID) {
                cameraPos.x = tank.x;
                cameraPos.y = tank.y;
            }
            drawTank(tank);
        }

        requestAnimationFrame(gameLoop);
    }
}
