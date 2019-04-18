var utils = require("./serverutils.js");
Number.prototype.clamp = function (min, max) {
    return Math.min(Math.max(this, min), max);
};
module.exports = {
    Tank: class {
        constructor(x, y, dx, dy, r, screenWidth, screenHeight, barrels, nickname, color, ID) {
            this.x = x;
            this.y = y;
            this.dx = dx;
            this.dy = dy;
            this.r = r;
            this.screenWidth = screenWidth;
            this.screenHeight = screenHeight;
            this.barrels = barrels;
            this.color = color;
            this.nickname = nickname;
            this.angle = 0;
            this.moveSpeed = 0.143;
            this.topSpeed = 7.8;
            this.ID = ID;
        }
        update() {
            this.x += this.dx;
            this.y += this.dy;
            this.dx = this.dx.clamp(-this.topSpeed, this.topSpeed);
            this.dy = this.dy.clamp(-this.topSpeed, this.topSpeed);            
            this.dx *= 0.98;
            this.dy *= 0.98;
        }
        collisionDetect(q) {
            let canidates = q.fetchBox(this.x - this.r * 2, this.y - this.r * 2, this.r * 4, this.r * 4);
            for (let tank of canidates) {
                if (utils.dist(this.x, this.y, tank.x, tank.y) < this.r * 2) {
                    let angle = Math.atan2(this.y - tank.y, this.x - tank.x);
                    this.dx += Math.cos(angle) / 8;
                    this.dy += Math.sin(angle) / 8;
                    tank.dx += Math.cos(angle + Math.PI) / 8;
                    tank.dy += Math.sin(angle + Math.PI) / 8;

                }
            }
        }
        handleInputs(inputs) {
            this.angle = Math.atan2(inputs.mouse.y - this.y, inputs.mouse.x - this.x);
            let tmpVector = { x: 0, y: 0 };
            let movKeyPressed = false;
            if (inputs.keys.includes("w")) {
                tmpVector.y -= 1;
                movKeyPressed = true;
            }
            if (inputs.keys.includes("a")) {
                tmpVector.x -= 1;
                movKeyPressed = true;
            }
            if (inputs.keys.includes("s")) {
                tmpVector.y += 1;
                movKeyPressed = true;
            }
            if (inputs.keys.includes("d")) {
                tmpVector.x += 1;
                movKeyPressed = true;
            }
            if (movKeyPressed) {
                let movAngle = Math.atan2(tmpVector.y, tmpVector.x);
                this.dx += Math.cos(movAngle) * this.moveSpeed;
                this.dy += Math.sin(movAngle) * this.moveSpeed;
            }
        }
    },

    Barrel: class {
        constructor(xOffset, yOffset, width, length, angle, reload, delay, damage, spread, type) {
            this.xOffset = xOffset;
            this.yOffset = yOffset;
            this.width = width;
            this.length = length;
            this.initialLength = length;
            this.angle = angle;
            this.initialReload = reload;
            this.reloadCounter = 0;
            this.initialDelay = delay;
            this.delayCounter = 0;
            this.damage = damage;
            this.spread = spread;
            this.type = type || 0;
        }
    },
    Bullet: class {
        constructor(x, y, speed, angle, damage, ownerID) {
            this.x = x;
            this.y = y;
            this.dx = Math.cos(angle) * speed;
            this.dy = Math.sin(angle) * speed;
            this.damage = damage;
            this.ownerID = ownerID;
        }
    }
}