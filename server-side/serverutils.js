module.exports = {
    pointCollidingRect: function (p, x, y, w, h) {
        return (p.x >= x) && (p.x <= x + w) && (p.y > y) && (p.y < y + h);
    },
    rectCollidingRect: function (x1, y1, w1, h1, x2, y2, w2, h2) {
        return !((x1 + w1 <= x2) || (y1 + h1 <= y2) || (x2 + w2 < x1) || (y2 + h2 < y1));
    },
    dist: function (x1, y1, x2, y2) {
        return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    }
}