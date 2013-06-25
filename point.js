function Point(x, y) {
	this.x = x;
	this.y = y;
}

Point.prototype.eq = function(b, precision) {
	precision = precision || 0.0;
	var fltEq = function(a, b) {
		return Math.abs(a - b) <= precision;
	};
	return fltEq(this.x, b.x) && fltEq(this.y, b.y);
};