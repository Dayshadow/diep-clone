var utils = require("./serverutils.js");
module.exports = {
    QuadTree: class {
        constructor(x, y, w, h, maxPoints, isInitial) {
            this.x = x;
            this.y = y;
            this.w = w;
            this.h = w;
            this.isInitial = isInitial;
            this.maxPoints = maxPoints;
            this.points = [];
            this.children = [];
            this.strokeStyle = "#000000";
        }
        insert(p) {
            p.x += 0.00000001;
            p.y += 0.00000001;

            if (utils.pointCollidingRect(p, this.x, this.y, this.w, this.h)) {
                if (this.children.length > 0) {
                    for (let child of this.children) {
                        child.insert(p);
                    }
                } else if (this.points.length >= this.maxPoints) {
                    // Split the quadtree into 4 and transfer the points to the children
                    this.split();
                    for (let child of this.children) {
                        for (let oldPoint of this.points) {
                            child.insert(oldPoint);
                        }
                        child.insert(p);
                    }
                    this.points = [];
                } else {
                    this.points.push(p);
                }
            }
        }
        split() {
            this.children.push(new module.exports.QuadTree(this.x, this.y, this.w / 2, this.h / 2, this.maxPoints));
            this.children.push(new module.exports.QuadTree(this.x, this.y + this.h / 2, this.w / 2, this.h / 2, this.maxPoints));
            this.children.push(new module.exports.QuadTree(this.x + this.w / 2, this.y, this.w / 2, this.h / 2, this.maxPoints));
            this.children.push(new module.exports.QuadTree(this.x + this.w / 2, this.y + this.h / 2, this.w / 2, this.h / 2, this.maxPoints))
        }
        draw() {
            if (this.children.length == 0) {
                ctx.strokeStyle = this.strokeStyle;
                ctx.strokeRect(this.x, this.y, this.w, this.h);
                for (let p of this.points) {
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
                    ctx.fill();
                }
            } else {
                for (let child of this.children) {
                    child.draw();
                }
            }
        }
        fetchBox(x, y, w, h) {
            let foundPoints = [];
            for (let child of this.children) {
                if (utils.rectCollidingRect(child.x, child.y, child.w, child.h, x, y, w, h)) {
                    if (child.children.length > 0) {
                        foundPoints = foundPoints.concat(child.fetchBox(x, y, w, h));
                    } else {
                        foundPoints = foundPoints.concat(child.points);
                    }
                }
            }
            if (this.isInitial && this.children.length == 0) {
                foundPoints = foundPoints.concat(this.points);
            }
            return foundPoints;
        }

        fetchShard(p) {
            for (let child of this.children) {
                if (utils.pointCollidingRect(p, child.x, child.y, child.w, child.h)) {
                    if (child.children.length > 0) {
                        return child.fetchShard(p);
                    } else {
                        return child.points;
                    }
                }
            }
        }
    }
}