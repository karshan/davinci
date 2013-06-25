"use strict";

var circles = null;

Array.prototype.swap = function (x,y) {
    var b = this[x];
    this[x] = this[y];
    this[y] = b;
    return this;
};

function init() {
    var canvas = document.getElementById("screen");
    var ctx = canvas.getContext("2d");

    canvas.width = canvas.height; // make sure we have a square
    circles = drawBoard(ctx, canvas.width);
}

function floatEq(a, b) {
    return Math.abs(a - b) < 0.000001;
}

// makes sure drawing an arc with starting angle a[0] and ending angle a[1] spans 60 degrees
function reorderAngles(a) {
    if (floatEq(a[1] + Math.PI/3, a[0]) || floatEq(a[1] + Math.PI/3 - 2*Math.PI, a[0])) {
        a.swap(0, 1);
    }
}

// returns the angle to a point on a circle from its center, the point (cx + r, cy) is defined to be 0 degrees
// ofcourse the radius of the circle in this function is irrelevant or defined as the distance between the points
function getAngle(cx, cy, x, y) {
    var dy = y - cy;
    var dx = x - cx;

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

function circle(ctx, cx, cy, r) {
    ctx.beginPath();
    ctx.lineWidth = 3;
    ctx.arc(cx, cy, r, 0, 2*Math.PI, false);
    ctx.stroke();
}

function isOnCircle(c, x, y) {
    var sqr = function (x) { return x*x; };
    return floatEq(sqr(c.cx - x) + sqr(c.cy - y), sqr(c.r));
}

function dist(cx, cy, x, y) {
    var sqr = function (x) { return x*x; };
    return Math.sqrt(sqr(cx - x) + sqr(cy - y));
}

function drawBoard(ctx, size) {
    var r = size/6;
    var dx = r * Math.cos(Math.PI/6);
    var dy = r * Math.sin(Math.PI/6);

    var cache = [];
    var cacheLookup = function(cx, cy) {
        return cache.reduce(function(prev, cur) {
            if (prev !== null) return prev;
            if (floatEq(cur.cx, cx) && floatEq(cur.cy, cy)) return cur; 
            return null;
        }, null);
        /*for (var i = 0; i < cache.length; i++) {
            var o = cache[i];
            if (floatEq(o.cx, cx) && floatEq(o.cy, cy)) return o;
        }
        return null;*/
    };

    var helper = function(cx, cy, r, dx, dy, depth) {
        if (depth == 0) return null;
        if (cacheLookup(cx, cy) !== null) return cacheLookup(cx, cy);
        var c = { cx: cx, cy: cy, r: r, neighbors: [] };
        cache.push(c);

        ctx.strokeStyle = "#000000";
        circle(ctx, cx, cy, r);

        c.neighbors.push(helper(cx + dx, cy + dy, r, dx, dy, depth - 1));
        c.neighbors.push(helper(cx + dx, cy - dy, r, dx, dy, depth - 1));
        c.neighbors.push(helper(cx - dx, cy + dy, r, dx, dy, depth - 1));
        c.neighbors.push(helper(cx - dx, cy - dy, r, dx, dy, depth - 1));
        return c;
    };

    circle(ctx, size/2, size/2, size/2);
    helper(size/2, size/2, r, dx, dy, 11);

    return cache;
}

function fillOval(enclosingCircles) {
    var canvas = document.getElementById("screen");
    var ctx = canvas.getContext("2d");

    var xs = []; // set of circles whose intersection forms the oval we want to fill
    var ys = []; // the other two circles
    enclosingCircles.forEach(function(c) {
        // get the number of enclosing circles whose centres lie on this circle
        var intersections = enclosingCircles.reduce(function(prev, cur) {
            if (isOnCircle(cur, c.cx, c.cy))
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
            return getAngle(x.cx, x.cy, y.cx, y.cy);
        });
        reorderAngles(angles);
        ctx.arc(x.cx, x.cy, x.r, angles[0], angles[1], false);
    });
    ctx.closePath();
    ctx.fill();
}

function fillTriangle(enclosingCircles) {
    var canvas = document.getElementById("screen");
    var ctx = canvas.getContext("2d");

    var boundingCircles = [];
    enclosingCircles.forEach(function(c) {
        var alreadyAdded = function(c) {
            for (var i = 0; i < boundingCircles.length; i++) {
                var a = boundingCircles[i];
                if (c.cx == a.cx && c.cy == a.cy)
                    return true;
            }
            return false;
        };

        c.neighbors.forEach(function(n) {
            if (alreadyAdded(n)) return;
            if (floatEq(dist(n.cx, n.cy, c.cx, c.cy), 2 * n.r + 2 * n.r * Math.cos(Math.PI/6)))
                boundingCircles.push(n);
        });
    });

    boundingCircles.forEach(function(c) {
        ctx.strokeStyle = "#00ff00";
        circle(ctx, c.cx, c.cy, c.r);
    });
}

function boardClick(evt) {
    var x = evt.offsetX;
    var y = evt.offsetY;
    
    var sqr = function (x) { return x*x; };
    
    var enclosingCircles = []; // list of circles that enclose the clicked point
    for (var i = 0; i < circles.length; i++) {
        var c = circles[i];
        if ( sqr(c.cx - x) + sqr(c.cy - y) <= sqr(c.r) ) {
            enclosingCircles.push(c);
        }
    }

    if (enclosingCircles.length == 4) { // point clicked is inside an oval
        fillOval(enclosingCircles);
    } else if (enclosingCircles.length == 3) { // point clicked is inside a triangle
        fillTriangle(enclosingCircles);
    }
}
