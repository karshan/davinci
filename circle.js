function Circle(c, r) {
	this.c = c;
	this.r = r;
}

Circle.prototype.eq = function(b, precision) {
	precision = precision || 0.0;
	var fltEq = function(a, b) {
		return Math.abs(a - b) <= precision;
	};
	return this.c.eq(b.c, precision) && fltEq(this.r, b.r);
};

Circle.prototype.on = function(p, precision) {
    precision = precision || 0.0;
    var fltEq = function(a, b) {
		return Math.abs(a - b) < precision;
	};
    return fltEq(Math.pow(this.c.x - p.x, 2) + Math.pow(this.c.y - p.y, 2), Math.pow(this.r, 2));
}

Circle.prototype.contains = function(p) {
    return Math.pow(this.c.x - p.x, 2) + Math.pow(this.c.y - p.y, 2) <= Math.pow(this.r, 2);
}
