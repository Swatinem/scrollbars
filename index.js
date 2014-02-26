/* vim: set shiftwidth=2 tabstop=2 noexpandtab textwidth=80 wrap : */
"use strict";

var debounce = require('debounce');
var classes = require('classes');
var events = require('events');

module.exports = Scrollbars;

Scrollbars.SIZE = require('scrollbar-size');
Scrollbars.MIN_SIZE = 25;
Scrollbars.CORNER = 6;
Scrollbars.TIMEOUT = 1000;

var positioned = ['relative', 'absolute', 'fixed'];

function Scrollbars(element) {
	if (!(this instanceof Scrollbars))
		return new Scrollbars(element);

	var self = this;

	this.elem = element;

	// inject the wrapper
	this.wrapper = document.createElement('div');
	// inherit the classes for styling
	// TODO: also make this work with styling based on id
	this.wrapper.className = this.elem.className;
	this.elem.parentNode.replaceChild(this.wrapper, this.elem);
	this.wrapper.appendChild(this.elem);

	// save the current style, so we can restore if necessary
	var style = getComputedStyle(this.elem);
	this.elemstyle = {
		position: style.position,
		top: style.top,
		right: style.right,
		bottom: style.bottom,
		left: style.left,
	};

	classes(this.elem).add('scrollbars-override');
	setPosition(this.elem, [0, -Scrollbars.SIZE, -Scrollbars.SIZE, 0]);

	style = this.wrapper.style;
	// set the wrapper to be positioned
	// but don’t mess with already positioned elements
	if (!~positioned.indexOf(this.elemstyle.position))
		style.position = 'relative';
	style.overflow = 'hidden';

	this.events = events(this.elem, this);

	// OSX has native overlay scrollbars which have a width of 0
	// in that case just don’t create any custom ones
	if (!Scrollbars.SIZE)
		return this;

	// and create scrollbar handles
	this.handleV = handle('vertical', [0, 0, 0, undefined]);
	this.wrapper.appendChild(this.handleV);
	this.handleH = handle('horizontal', [undefined, 0, 0, 0]);
	this.wrapper.appendChild(this.handleH);

	this.dragging = null;

	// hide after some inactivity
	this.hide = debounce(function () {
		if (!self.dragging || self.dragging.elem !== self.handleV)
			self.handleV.firstChild.className = 'scrollbars-handle vertical';
		if (!self.dragging || self.dragging.elem !== self.handleH)
			self.handleH.firstChild.className = 'scrollbars-handle horizontal';
	}, Scrollbars.TIMEOUT);

	// hook them up to scroll events
	this.events.bind('scroll', 'refresh');
	this.events.bind('mouseenter', 'refresh');

	[this.handleV, this.handleH].forEach(function (handle) {
		// don’t hide handle when hovering
		handle.firstChild.addEventListener('mouseenter', function () {
			if (!self.dragging)
				self.dragging = {elem: handle};
		}, false);
		handle.firstChild.addEventListener('mouseleave', function () {
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
	var vertical = handle === this.handleV;
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
		offset: vertical ? ev.clientY - rect.top : ev.clientX - rect.left
	};
};

Scrollbars.prototype._mouseMove = function Scrollbars__mouseMove(ev) {
	var vertical = this.dragging.elem === this.handleV;
	var rect = this.elem.getBoundingClientRect();
	var size = handleSize(this.elem);
	var offset;
	if (vertical) {
		offset = ev.clientY - rect.top - this.dragging.offset;
		this.elem.scrollTop = offset / size.sizeH * size.sTM;
	} else {
		offset = ev.clientX - rect.left - this.dragging.offset;
		this.elem.scrollLeft = offset / size.sizeW * size.sLM;
	}
};

function handleSize(elem) {
	var cH = elem.clientHeight;
	var sH = elem.scrollHeight;
	var sTM = elem.scrollTopMax || Math.max(sH - cH, 0);
	var cW = elem.clientWidth;
	var sW = elem.scrollWidth;
	var sLM = elem.scrollLeftMax || Math.max(sW - cW, 0);

	var pH = cH / sH;
	var pW = cW / sW;

	var corner = sTM && sLM ? Scrollbars.CORNER : 0;

	var sizeH = cH - Math.max(Scrollbars.MIN_SIZE, pH * (cH - corner)) - corner;
	var sizeW = cW - Math.max(Scrollbars.MIN_SIZE, pW * (cW - corner)) - corner;

	return {
		corner: corner,
		sTM: sTM,
		sLM: sLM,
		sizeH: sizeH,
		sizeW: sizeW,
		pH: pH,
		pW: pW,
	};
}

/*
 * Refreshes (and shows) the scrollbars
 */
Scrollbars.prototype.refresh = function Scrollbars_refresh() {
	if (!Scrollbars.SIZE)
		return;
	var size = handleSize(this.elem);
	var scrolledPercentage;
	// vertical
	if (size.sTM) {
		scrolledPercentage = this.elem.scrollTop / size.sTM;
		setPosition(this.handleV, [
			scrolledPercentage * size.sizeH,
			0,
			(1 - scrolledPercentage) * size.sizeH + size.corner,
			undefined
		]);
		this.handleV.firstChild.className = 'scrollbars-handle vertical show';
	}

	// horizontal
	if (size.sLM) {
		scrolledPercentage = this.elem.scrollLeft / size.sLM;
		setPosition(this.handleH, [
			undefined,
			(1 - scrolledPercentage) * size.sizeW + size.corner,
			0,
			scrolledPercentage * size.sizeW,
		]);
		this.handleH.firstChild.className = 'scrollbars-handle horizontal show';
	}

	this.hide();
};

Scrollbars.prototype.destroy = function Scrollbars_destroy() {
	if (this.dragging && this.dragging.handler)
		this._endDrag(); // clear global events
	this.wrapper.removeChild(this.elem);
	this.wrapper.parentNode.replaceChild(this.elem, this.wrapper);
	classes(this.elem).remove('scrollbars-override');
	this.events.unbind();

	var style = this.elem.style;
	style.top = this.elemstyle.top;
	style.right = this.elemstyle.right;
	style.left = this.elemstyle.left;
	style.bottom = this.elemstyle.bottom;

	// clear all the props, so the GC can clear them up
	this.wrapper = this.handleV = this.handleH = this.elemstyle = this.elem =
		this._endDrag = this.dragging = this.hide = this.events = null;
};

// create a handle
function handle(klass, pos) {
	// a container that has the handles position
	var container = document.createElement('div');
	var style = container.style;
	style.position = 'absolute';
	setPosition(container, pos);

	// the handle itself
	var handleEl = document.createElement('div');
	handleEl.className = 'scrollbars-handle ' + klass;
	container.appendChild(handleEl);

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
