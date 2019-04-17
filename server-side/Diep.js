
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
            this.moveSpeed = 0.5;
            this.ID = ID;
        }
        update() {
            this.x += this.dx;
            this.y += this.dy;
            this.dx *= 0.93;
            this.dy *= 0.93;
        }
        handleInputs(inputs) {
            this.angle = Math.atan2(inputs.mouse.y - this.y, inputs.mouse.x - this.x);
            if (inputs.keys.includes("w")) {
                this.dy -= this.moveSpeed;
            }
            if (inputs.keys.includes("a")) {
                this.dx -= this.moveSpeed;
            }
            if (inputs.keys.includes("s")) {
                this.dy += this.moveSpeed;
            }
            if (inputs.keys.includes("d")) {
                this.dx += this.moveSpeed;
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