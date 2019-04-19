var utils = require("./serverutils.js");
Number.prototype.clamp = function (min, max) {
    return Math.min(Math.max(this, min), max);
};
module.exports = {
    Tank: class {
        constructor(x, y, dx, dy, r, screenWidth, screenHeight, barrels, nickname, color, barrelColor, ID) {
            this.x = x;
            this.y = y;
            this.dx = dx;
            this.dy = dy;
            this.r = r;
            this.health = 1000;
            this.maxHealth = this.health;
            this.dead = false;
            this.screenWidth = screenWidth;
            this.screenHeight = screenHeight;
            this.barrels = barrels;
            for (let barrel of this.barrels) {
                barrel.parent = { x: this.x, y: this.y, angle: this.angle, ID: this.ID, dead: false };
            }
            this.color = color;
            this.barrelColor = barrelColor;
            this.nickname = nickname;
            this.angle = 0;
            this.moveSpeed = 0.1;
            this.topSpeed = 7.8;
            this.ID = ID;
        }
        update() {
            if (this.health < 0) {
                this.dead = true;
            }
            for (let barrel of this.barrels) {
                barrel.parent = { x: this.x, y: this.y, angle: this.angle, ID: this.ID, dead: this.dead };
            }
            this.x += this.dx;
            this.y += this.dy;
            this.dx = this.dx.clamp(-this.topSpeed, this.topSpeed);
            this.dy = this.dy.clamp(-this.topSpeed, this.topSpeed);
            this.dx *= 0.98;
            this.dy *= 0.98;
        }
        collisionDetect(q, q2) {
            let canidates = q.fetchBox(this.x - this.r * 2, this.y - this.r * 2, this.r * 4, this.r * 4);
            for (let tank of canidates) {
                if (utils.dist(this.x, this.y, tank.x, tank.y) < this.r + tank.r) {
                    let angle = Math.atan2(this.y - tank.y, this.x - tank.x);
                    this.dx += Math.cos(angle) / 8;
                    this.dy += Math.sin(angle) / 8;
                    tank.dx += Math.cos(angle + Math.PI) / 8;
                    tank.dy += Math.sin(angle + Math.PI) / 8;
                }
            }
            canidates = q2.fetchBox(this.x - this.r * 2, this.y - this.r * 2, this.r * 4, this.r * 4);
            for (let object of canidates) {
                if (utils.dist(this.x, this.y, object.x, object.y) < this.r + object.r) {
                    if (object.type === 'bullet') {
                        if (object.ownerID != this.ID) {
                            let angle = Math.atan2(this.y - object.y, this.x - object.x);
                            this.dx += Math.cos(angle) / 4;
                            this.dy += Math.sin(angle) / 4;
                            object.dx += Math.cos(angle + Math.PI) / 4;
                            object.dy += Math.sin(angle + Math.PI) / 4;
                            this.health -= object.damage;
                            object.health -= 70;
                        }
                    }
                }
            }
        }
        handleInputs(inputs, objs) {
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
            if (inputs.mouse.left) {
                for (let barrel of this.barrels) {
                    barrel.update(objs);
                }
            } else {
                for (let barrel of this.barrels) {
                    barrel.reset();
                }
            }
        }
    },

    Barrel: class {
        constructor(xOffset, yOffset, width, length, angle, reload, delay, damage, spread, type) {
            this.xOffset = xOffset;
            this.yOffset = yOffset;
            this.parent;
            this.width = width;
            this.length = length;
            this.initialLength = length;
            this.angle = angle;
            this.reloadMax = reload;
            this.reloadTimer = reload;
            this.canShoot = true;
            this.delayMax = delay;
            this.delayCounter = 0;
            this.damage = damage;
            this.spread = spread;
            this.type = type || 0;
        }
        update(objs) {
            if (this.reloadTimer == 0) {
                this.canShoot = true;
            } else {
                this.canShoot = false;
            }
            if (this.reloadTimer > 0) {
                this.reloadTimer--;
            }
            this.delayCounter++;
            if (this.delayCounter > this.delayMax) {
                if (this.canShoot) {
                    this.reloadTimer = this.reloadMax;
                    this.shoot(objs);
                }
            }
        }
        reset() {
            this.delayCounter = 0;
            if (this.reloadTimer > 0) {
                this.reloadTimer--;
            }
        }
        shoot(objs) {
            // Magical rotation code here
            let preX = -this.xOffset - this.length / 2;
            let preY = this.yOffset;
            let angle = this.parent.angle + (this.angle * Math.PI / 180) + Math.PI;
            objs.push(new module.exports.Bullet(
                this.parent.x + preX * Math.cos(angle) - preY * Math.sin(angle),
                this.parent.y + preY * Math.cos(angle) + preX * Math.sin(angle),
                this.width / 2, this.length / 10,
                this.parent.angle + this.angle * (Math.PI / 180) + (Math.random() * this.spread - this.spread / 2),
                this.damage, this.parent.ID
            )
            );
        }
    },
    Bullet: class {
        constructor(x, y, r, speed, angle, damage, ownerID) {
            this.x = x;
            this.y = y;
            this.r = r;
            this.type = "bullet";
            this.dx = Math.cos(angle) * speed;
            this.dy = Math.sin(angle) * speed;
            this.damage = damage;
            this.health = 200;
            this.ownerID = ownerID;
            this.age = 0;
            this.dead = false;
            this.lifetime = 230;
        }
        update() {
            this.age++
            if (this.age > this.lifetime || this.health < 0) {
                this.dead = true;
            }
            this.x += this.dx;
            this.y += this.dy;
        }
        collisionDetect(q2) {
            let canidates = q2.fetchBox(this.x - this.r * 2, this.y - this.r * 2, this.r * 4, this.r * 4);
            for (let object of canidates) {
                if (utils.dist(this.x, this.y, object.x, object.y) < this.r + object.r) {
                    if (object.type === 'bullet' && object.ownerID != this.ownerID) {
                        let angle = Math.atan2(this.y - object.y, this.x - object.x);
                        this.dx += Math.cos(angle) / 4;
                        this.dy += Math.sin(angle) / 4;
                        object.dx += Math.cos(angle + Math.PI) / 4;
                        object.dy += Math.sin(angle + Math.PI) / 4;
                        this.health -= object.damage;
                        object.health -= this.damage;
                    }
                }
            }
        }
    }
}