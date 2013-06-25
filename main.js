"use strict";

var global = {
    lineWidth: 3,
    precision: 0.00001
};

Array.prototype.swap = function (x,y) {
    var b = this[x];
    this[x] = this[y];
    this[y] = b;
    return this;
};

Array.prototype.find = function(a, eq) {
    for (var i = 0; i < this.length; i++) {
        if (eq(this[i], a)) return true;
    }
    return false;
}

Circle.prototype.neighbors = function() {
    var size = global.size;

    var r = size/6;
    var dx = r * Math.cos(Math.PI/6);
    var dy = r * Math.sin(Math.PI/6);
    return [
            new Circle(new Point(this.c.x + dx, this.c.y + dy), this.r),
            new Circle(new Point(this.c.x - dx, this.c.y + dy), this.r),
            new Circle(new Point(this.c.x + dx, this.c.y - dy), this.r),
            new Circle(new Point(this.c.x - dx, this.c.y - dy), this.r),
    ];     
}

function floatEq(a, b) {
    return Math.abs(a - b) <= global.precision;
}

function sqr(x) { return x*x; };

function stdEq(a, b) { return a.eq(b, global.precision); }

function init() {
    var canvas = document.getElementById("screen");
    var ctx = global.ctx = canvas.getContext("2d");

    global.size = canvas.width = canvas.height; // make sure we have a square
    global.circles = drawBoard();
}

// makes sure drawing an arc with starting angle a[0] and ending angle a[1] spans 60 degrees
function reorderAngles(a) {
    if (floatEq(a[1] + Math.PI/3, a[0]) || floatEq(a[1] + Math.PI/3 - 2*Math.PI, a[0])) {
        a.swap(0, 1);
    }
}

// returns the angle to a point on a circle from its center, the point (cx + r, cy) is defined to be 0 degrees
// ofcourse the radius of the circle in this function is irrelevant or defined as the distance between the points
// c: center point, p: other point
function getAngle(c, p) {
    var dy = p.y - c.y;
    var dx = p.x - c.x;

    if (floatEq(dy, 0.0))
        return dx > 0 ? 0 : Math.PI;
    if (floatEq(dx, 0.0))
        return dy > 0 ? Math.PI/2 : 3 * Math.PI/2;

    if (dy > 0 && dx > 0)
        return Math.atan(dy/dx);
    if (dy > 0 && dx < 0)
        return Math.PI - Math.atan(-dy/dx);
    if (dy < 0 && dx > 0)
        return 2*Math.PI - Math.atan(-dy/dx);
    if (dy < 0 && dx < 0)
        return Math.PI + Math.atan(dy/dx);
}

function drawCircle(c, color) {
    var ctx = global.ctx;
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.lineWidth = global.lineWidth;
    ctx.arc(c.c.x, c.c.y, c.r, 0, 2*Math.PI, false);
    ctx.stroke();
}

function dist(a, b) {
    return Math.sqrt(sqr(a.x - b.x) + sqr(a.y - b.y));
}

function drawBoard() {
    var ctx = global.ctx;
    var size = global.size;

    var r = size/6;
    var dx = r * Math.cos(Math.PI/6);
    var dy = r * Math.sin(Math.PI/6);

    var c0 = new Circle(new Point(size/2, size/2), r);
    var circles = [];

    var q = [c0];
   
    while(circles.length < 111) {
        var c = q.shift();
        drawCircle(c, "#000");
        circles.push(c);

        c.neighbors().forEach(function(x) {
            if (circles.find(x, stdEq) || q.find(x, stdEq)) return;
            q.push(x);
        });
    }

    drawCircle(new Circle(new Point(size/2, size/2), size/2), "#888");

    return circles;
}

function fillOval(enclosingCircles) {
    var canvas = document.getElementById("screen");
    var ctx = canvas.getContext("2d");

    var xs = []; // set of circles whose intersection forms the oval we want to fill
    var ys = []; // the other two circles
    enclosingCircles.forEach(function(c) {
        // get the number of enclosing circles whose centres lie on this enclosing circle
        var intersections = enclosingCircles.reduce(function(prev, cur) {
            if (cur.on(c.c, global.precision))
                return prev + 1;
            return prev;    
        }, 0);
        
        if (intersections == 2)
            xs.push(c);
        else
            ys.push(c);
    });

    ctx.beginPath();
    ctx.fillStyle = "#ff0000";
    xs.forEach(function(x) {
        var angles = ys.map(function(y) {
            return getAngle(x.c, y.c);
        });
        reorderAngles(angles);
        ctx.arc(x.c.x, x.c.y, x.r, angles[0], angles[1], false);
    });
    ctx.closePath();
    ctx.fill();
}

function drawArc(c, arcPoints) {
    var ctx = global.ctx;
    
    var angles = arcPoints.map(function(y) {
        return getAngle(c.c, y);
    });
    reorderAngles(angles);
    ctx.arc(c.c.x, c.c.y, c.r, angles[0], angles[1], false);
}

function fillTriangle(enclosingCircles) {
    var ctx = global.ctx;

    var boundingCircles = [];
    var allNeighbors = [];
    enclosingCircles.forEach(function(c) {
        c.neighbors().forEach(function(n) {
            if (enclosingCircles.find(n, stdEq) || allNeighbors.find(n, stdEq)) return;
            allNeighbors.push(n);
        });
    });

    allNeighbors.forEach(function(c) {
        // get the number of enclosing circles that pass through the center of this neighbor
        var intersections = enclosingCircles.reduce(function(prev, cur) {
            if (cur.on(c.c, global.precision))
                return prev + 1;
            return prev;
        }, 0);
        if (intersections == 2)
            boundingCircles.push(c);
    });

    ctx.beginPath();
    ctx.fillStyle = "#ff0000";
    boundingCircles.forEach(function(c) {
        var arcPoints = enclosingCircles.filter(function(ec) { return c.on(ec.c, global.precision); });
        arcPoints = arcPoints.map(function(x) { return x.c; });
        drawArc(c, arcPoints);
    });
    ctx.closePath();
    ctx.fill();
}

function boardClick(evt) {
    var p = new Point(evt.offsetX, evt.offsetY);
    var circles = global.circles;

    var enclosingCircles = []; // list of circles that enclose the clicked point
    for (var i = 0; i < circles.length; i++) {
        var c = circles[i];
        if (c.contains(p)) {
            enclosingCircles.push(c);
        }
    }

    if (enclosingCircles.length == 4) { // point clicked is inside an oval
        fillOval(enclosingCircles);
    } else if (enclosingCircles.length == 3) { // point clicked is inside a triangle
        fillTriangle(enclosingCircles);
    }
}
