
var scrollbarSize = require('scrollbar-size');
var debounce = require('debounce');

module.exports = Scrollbars;

function Scrollbars(element) {
	if (!(this instanceof Scrollbars))
		return new Scrollbars(element);

	var self = this;

	this.outer = element;
	this.inner = [].slice.call(this.outer.childNodes);

	// empty the container
	empty(this.outer);

	// save the current style, so we can restore if necessary
	var style = getComputedStyle(this.outer);
	this.outerstyle = {
		overflow: style.overflow,
		position: style.position,
		// and a workaround for https://bugzilla.mozilla.org/show_bug.cgi?id=889091
		padding: ['Top', 'Right', 'Bottom', 'Left'].map(function (prop) {
			return style['padding' + prop];
		}).join(' '),
	};
	style = this.outer.style;
	style.overflow = 'hidden';
	style.position = 'relative';
	style.padding = 'none';

	// inject the wrapper
	this.wrapper = document.createElement('div');
	style = this.wrapper.style;
	style.overflow = 'scroll';
	style.position = 'absolute';
	style.padding = this.outerstyle.padding;
	setPosition(this.wrapper, [0, -scrollbarSize, -scrollbarSize, 0]);
	this.outer.appendChild(this.wrapper);

	// and create scrollbar handles
	this.handleV = handle('vertical', [0, 0, 0, undefined]);
	this.outer.appendChild(this.handleV);
	this.handleH = handle('horizontal', [undefined, 0, 0, 0]);
	this.outer.appendChild(this.handleH);

	// and add the inner element to it
	this.inner.forEach(function (el) {
		self.wrapper.appendChild(el);
	});

	this.dragging = null;

	// hide after some inactivity
	this.hide = debounce(function () {
		if (!self.dragging || self.dragging.elem != self.handleV)
			self.handleV.firstChild.className = 'scrollbars-handle vertical';
		if (!self.dragging || self.dragging.elem != self.handleH)
			self.handleH.firstChild.className = 'scrollbars-handle horizontal';
	}, 1000);

	// hook them up to scroll events
	this.wrapper.addEventListener('scroll', function () {
		self.refresh();
	}, false);
	// and mouseenter
	this.wrapper.addEventListener('mouseenter', function (ev) {
		self.refresh();
	}, false);

	[this.handleV, this.handleH].forEach(function (handle) {
		// don’t hide handle when hovering
		handle.firstChild.addEventListener('mouseenter', function (ev) {
			if (!self.dragging)
				self.dragging = {elem: handle};
		}, false);
		handle.firstChild.addEventListener('mouseleave', function (ev) {
			if (self.dragging && !self.dragging.handler)
				self.dragging = null;
		}, false);

		// and do the dragging
		handle.firstChild.addEventListener('mousedown', function (ev) {
			self._startDrag(handle, ev);
			ev.preventDefault();
		}, false);
	});

	this._endDrag = function () {
		document.removeEventListener('mousemove', self.dragging.handler);
		document.removeEventListener('mouseup', self._endDrag);
		self.dragging = null;
	};
}

Scrollbars.prototype._startDrag = function Scrollbars__startDrag(handle, ev) {
	var vertical = handle == this.handleV;
	var self = this;
	var handler = function (ev) {
		self._mouseMove(ev);
	};
	document.addEventListener('mousemove', handler, false);
	document.addEventListener('mouseup', this._endDrag, false);
	var rect = handle.getBoundingClientRect();
	this.dragging = {
		elem: handle,
		handler: handler,
		offset: vertical ? ev.pageY - rect.top : ev.pageX - rect.left
	};
	//console.log(ev, rect, this.dragging);
};

Scrollbars.prototype._mouseMove = function Scrollbars__mouseMove(ev) {
	//console.log(this.dragging, ev);
	var vertical = this.dragging.elem == this.handleV;
	var rect = this.wrapper.getBoundingClientRect();
	if (vertical) {
		var percentage = this.wrapper.clientHeight / this.wrapper.scrollHeight;
		var offset = ev.pageY - rect.top - this.dragging.offset;
		this.wrapper.scrollTop = offset / percentage;
	} else {
		percentage = this.wrapper.clientWidth / this.wrapper.scrollWidth;
		offset = ev.pageX - rect.left - this.dragging.offset;
		this.wrapper.scrollLeft = offset / percentage;
	}
	this.refresh();
};

Scrollbars.prototype.refresh = function Scrollbars_refresh() {
	// vertical
	var percentage = this.wrapper.clientHeight / this.wrapper.scrollHeight;
	if (this.wrapper.scrollTopMax || percentage < 1) {
		var scrolledPercentage = this.wrapper.scrollTop / this.wrapper.scrollHeight;
		setPosition(this.handleV, [
			scrolledPercentage * this.wrapper.clientHeight,
			0,
			(1 - scrolledPercentage - percentage) * this.wrapper.clientHeight,
			undefined
		]);
		this.handleV.firstChild.className = 'scrollbars-handle vertical show';
	}

	// horizontal
	percentage = this.wrapper.clientWidth / this.wrapper.scrollWidth;
	if (this.wrapper.scrollLeftMax || percentage < 1) {
		scrolledPercentage = this.wrapper.scrollLeft / this.wrapper.scrollWidth;
		setPosition(this.handleH, [
			undefined,
			(1 - scrolledPercentage - percentage) * this.wrapper.clientWidth,
			0,
			scrolledPercentage * this.wrapper.clientWidth,
		]);
		this.handleH.firstChild.className = 'scrollbars-handle horizontal show';
	}

	this.hide();
};

Scrollbars.prototype.destroy = function Scrollbars_destroy() {
	var self = this;
	if (this.dragging && this.dragging.handler)
		this._endDrag(); // clear global events
	empty(this.outer);
	this.inner.forEach(function (el) {
		self.outer.appendChild(el);
	});
	var style = this.outer.style;
	style.overflow = this.outerstyle.overflow;
	style.position = this.outerstyle.position;
	style.padding = this.outerstyle.padding;
};

// create a handle
function handle(klass, pos) {
	// a container that has the handles position
	var container = document.createElement('div');
	var style = container.style;
	style.position = 'absolute';
	setPosition(container, pos);

	// the handle itself
	var handle = document.createElement('div');
	handle.className = 'scrollbars-handle ' + klass;
	container.appendChild(handle);

	return container;
}

// set absolute positioning properties
var props = ['top', 'right', 'bottom', 'left'];
function setPosition(el, positions) {
	for (var i = 0; i < props.length; i++) {
		var prop = props[i];
		var pos = positions[i];
		if (typeof pos !== 'undefined')
			el.style[prop] = Math.round(pos) + 'px';
	}
}

function empty(el) {
	while (el.firstChild)
		el.removeChild(el.firstChild);
}
