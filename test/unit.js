/* vim: set shiftwidth=2 tabstop=2 noexpandtab textwidth=80 wrap : */
"use strict";

var scrollbars = require('scrollbars');
var should = require('chaijs-chai').should();
var happen = require('happen');


describe('Scrollbars', function () {
	var testEl = document.createElement('div');

	function gcs(elem) {
		return getComputedStyle(elem);
	}

	function makeStyle(st) {
		var style = document.createElement('style');
		style.innerHTML = st;
		testEl.appendChild(style);
		return style;
	}

	function makeElem(klass) {
		var el = document.createElement('div');
		el.className = klass;
		testEl.appendChild(el);
		return el;
	}

	var constvars = ['SIZE', 'MIN_SIZE', 'CORNER', 'TIMEOUT'];
	var consts = {};

	before(function () {
		constvars.forEach(function (v) {
			consts[v] = scrollbars[v];
		});
		document.body.appendChild(testEl);
	});
	after(function () {
		testEl.parentNode.removeChild(testEl);
	});
	afterEach(function () {
		// remove fixture
		while (testEl.firstChild)
			testEl.removeChild(testEl.firstChild);
		// reset constant changes
		constvars.forEach(function (v) {
			scrollbars[v] = consts[v];
		});
	});

	it('should inherit `position` of already positioned elements', function () {
		makeStyle('.test-position-fixed { position: fixed; }');
		var elem = makeElem('test-position-fixed');
		gcs(elem).position.should.eql('fixed');
		var scr = scrollbars(elem);
		gcs(scr.wrapper).position.should.eql('fixed');
	});

	it('should restore overridden properties', function () {
		makeStyle('.test-restore { overflow: visible; }');
		var elem = makeElem('test-restore');
		var scr = scrollbars(elem);
		var st = gcs(elem);
		st.position.should.eql('absolute');
		st.overflow.should.eql('scroll');
		scr.destroy();
		st = gcs(elem);
		st.position.should.eql('static');
		st.overflow.should.eql('visible');
	});

	it('should not make the scroll handles visible when there is nothing to scroll', function () {
		makeStyle('.test-nothing { height: 100px; width: 100px; }' +
		          '.test-nothing .content { height: 50px; width: 50px; }');
		var elem = makeElem('test-nothing');
		elem.innerHTML = '<div class="content"></div>';
		var scr = scrollbars(elem);
		scr.refresh();
		scr.handleV.firstChild.className.should.not.include('show');
		scr.handleH.firstChild.className.should.not.include('show');
	});

	function something() {
		makeStyle('.test-something { height: 100px; width: 100px; }' +
		          '.test-something .content { height: 200px; width: 200px; }');
		var elem = makeElem('test-something');
		elem.innerHTML = '<div class="content"></div>';
		return elem;
	}

	it('should actually use the outer element as scroll area', function (done) {
		var elem = something();
		var scr = scrollbars(elem);
		scr.refresh();
		elem.addEventListener('scroll', function () {
			done();
		}, false);
		elem.scrollTop = 50;
	});

	it('should add a scrollbar when there is something to scroll', function () {
		var elem = something();
		var scr = scrollbars(elem);
		scrollbars.CORNER = 0;
		scr.refresh();
		scr.handleV.firstChild.className.should.include('show');
		scr.handleH.firstChild.className.should.include('show');
		scr.handleV.style.bottom.should.eql('50px');
	});

	it('should move the scrollbar according to scrollTop', function () {
		var elem = something();
		var scr = scrollbars(elem);
		elem.scrollTop = 50;
		scrollbars.CORNER = 0;
		scr.refresh();
		scr.handleV.firstChild.className.should.include('show');
		scr.handleH.firstChild.className.should.include('show');
		scr.handleV.style.bottom.should.eql('25px');
	});

	it('should not mess with the childs dimensions', function () {
		makeStyle('.test-dimensions { width: 50px; height: 200px; overflow: hidden; padding: 10px; }');
		var elem = makeElem('test-dimensions');
		elem.innerHTML = '<span>' + (new Array(4)).join('    And there is a text node…\n') + '</span>';
		var child = elem.firstChild;
		var dim = child.getBoundingClientRect();
		dim = [dim.top, dim.right, dim.bottom, dim.left, dim.width, dim.height];
		var scr = scrollbars(elem);
		scr.refresh();
		var dim2 = child.getBoundingClientRect();
		dim2 = [dim2.top, dim2.right, dim2.bottom, dim2.left, dim2.width, dim2.height];
		dim2.should.eql(dim);
	});

	it('should make the scrollbar a minimum size', function () {
		makeStyle('.test-minsize { height: 50px; width: 50px; }' +
		          '.test-minsize .content { height: 2000px; }');
		var elem = makeElem('test-minsize');
		elem.innerHTML = '<div class="content"></div>';
		var scr = scrollbars(elem);
		elem.scrollTop = 2000;
		scrollbars.MIN_SIZE = 25;
		scr.refresh();
		scr.handleV.style.top.should.eql('25px');
		scr.handleV.style.bottom.should.eql('0px');
	});

	it('should give a little corner if both handles are visible', function () {
		var elem = something();
		var scr = scrollbars(elem);
		elem.scrollTop = 500;
		elem.scrollLeft = 500;
		scrollbars.CORNER = 10;
		scr.refresh();
		scr.handleV.firstChild.className.should.include('show');
		scr.handleH.firstChild.className.should.include('show');
		scr.handleV.style.bottom.should.eql('10px');
		scr.handleH.style.right.should.eql('10px');
	});

	it('should hide the scrollbars after a timeout', function (done) {
		var elem = something();
		scrollbars.TIMEOUT = 5;
		var scr = scrollbars(elem);
		scr.refresh();
		scr.handleV.firstChild.className.should.include('show');
		scr.handleH.firstChild.className.should.include('show');
		setTimeout(function () {
			scr.handleV.firstChild.className.should.not.include('show');
			scr.handleH.firstChild.className.should.not.include('show');
			done();
		}, 10);
	});

	it('should not hide the scrollbar you are hovering over', function (done) {
		var elem = something();
		scrollbars.TIMEOUT = 5;
		var scr = scrollbars(elem);
		scr.refresh();
		happen.once(scr.handleV.firstChild, {type: 'mouseenter'});
		scr.handleV.firstChild.className.should.include('show');
		scr.handleH.firstChild.className.should.include('show');
		setTimeout(function () {
			scr.handleV.firstChild.className.should.include('show');
			scr.handleH.firstChild.className.should.not.include('show');
			happen.once(scr.handleV.firstChild, {type: 'mouseleave'});
			scr.refresh();
			happen.once(scr.handleH.firstChild, {type: 'mouseenter'});
			setTimeout(function () {
				scr.handleV.firstChild.className.should.not.include('show');
				scr.handleH.firstChild.className.should.include('show');
				done();
			}, 10);
		}, 10);
	});

	it('should support scrolling by dragging the handle', function () {
		var elem = something();
		var scr = scrollbars(elem);
		scr.refresh();
		elem.scrollTop.should.eql(0);
		happen.mousedown(scr.handleV.firstChild, {clientY: 50, clientX: 50});
		happen.mousemove(elem, {clientY: 200, clientX: 200});
		happen.mouseup(elem);
		elem.scrollTop.should.eql(100);
		elem.scrollLeft.should.eql(0);
		happen.mousedown(scr.handleH.firstChild, {clientY: 50, clientX: 50});
		happen.mousemove(elem, {clientY: 200, clientX: 200});
		// just for the sake of test coverage:
		happen.once(scr.handleV.firstChild, {type: 'mouseenter'});
		happen.once(scr.handleV.firstChild, {type: 'mouseleave'});
		happen.mouseup(elem);
		elem.scrollLeft.should.eql(100);
	});

	it('should correctly destroy when dragging', function () {
		var elem = something();
		var scr = scrollbars(elem);
		scr.refresh();
		happen.mousedown(scr.handleV.firstChild, {clientY: 50, clientX: 50});
		scr.destroy();
		happen.mousemove(elem, {clientY: 200, clientX: 200});
		elem.scrollTop.should.eql(0);
	});

	it('should not create handles when scrollbar size is 0', function () {
		scrollbars.SIZE = 0;
		var elem = something();
		var scr = scrollbars(elem);
		scr.refresh();
		should.not.exist(scr.handleV);
		should.not.exist(scr.handleH);
		// but it should still create a wrapper
		scr.wrapper.should.eql(elem.parentNode);
	});

	it.skip('should inherit styles based on an id as well', function () {
		
	});
	it.skip('should react to any changes in the original elements classlist', function () {
		
	});
});

