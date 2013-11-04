
var scrollbars = require('scrollbars');

function qs(selector, parent) {
	return (parent || document).querySelector(selector);
}
function gcs(elem) {
	return getComputedStyle(elem);
}

describe('Scrollbars', function () {
	after(function () {
		var testsElem = qs('#tests');
		testsElem.parentNode.removeChild(testsElem);
	});

	it('should inherit `position` of already positioned elements', function () {
		var elem = qs('.test-position-fixed');
		gcs(elem).position.should.eql('fixed');
		var scr = scrollbars(elem);
		gcs(scr.wrapper).position.should.eql('fixed');
	});

	it('should restore overridden properties', function () {
		var elem = qs('.test-restore');
		var scr = scrollbars(elem);
		var st = gcs(elem);
		st.position.should.eql('absolute');
		st.overflow.should.eql('scroll');
		scr.destroy();
		var st = gcs(elem);
		st.position.should.eql('static');
		st.overflow.should.eql('visible');
	});

	it('should not make the scroll handles visible when there is nothing to scroll', function () {
		var elem = qs('.test-nothing');
		var scr = scrollbars(elem);
		scr.refresh();
		scr.handleV.firstChild.className.should.not.include('show');
		scr.handleH.firstChild.className.should.not.include('show');
	});

	it('should actually use the outer element as scroll area', function (done) {
		var elem = qs('.test-something');
		var scr = scrollbars(elem);
		scr.refresh();
		elem.addEventListener('scroll', function () {
			scr.destroy();
			done();
		}, false);
		elem.scrollTop = 50;
	});

	it('should add a scrollbar when there is something to scroll', function () {
		var elem = qs('.test-something');
		var scr = scrollbars(elem);
		scrollbars.CORNER = 0;
		scr.refresh();
		scr.handleV.firstChild.className.should.include('show');
		scr.handleH.firstChild.className.should.include('show');
		scr.handleV.style.bottom.should.eql('50px');
		scr.destroy();
	});

	it('should move the scrollbar according to scrollTop', function () {
		var elem = qs('.test-something');
		var scr = scrollbars(elem);
		elem.scrollTop = 50;
		scrollbars.CORNER = 0;
		scr.refresh();
		scr.handleV.firstChild.className.should.include('show');
		scr.handleH.firstChild.className.should.include('show');
		scr.handleV.style.bottom.should.eql('25px');
		scr.destroy();
	});

	it('should not mess with the childs dimensions', function () {
		var elem = qs('.test-dimensions');
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
		var elem = qs('.test-minsize');
		var scr = scrollbars(elem);
		elem.scrollTop = 2000;
		scrollbars.MIN_SIZE = 25;
		scr.refresh();
		scr.handleV.style.top.should.eql('25px');
		scr.handleV.style.bottom.should.eql('0px');
		scr.destroy();
	});

	it('should give a little corner if both handles are visible', function () {
		var elem = qs('.test-something');
		var scr = scrollbars(elem);
		elem.scrollTop = 500;
		elem.scrollLeft = 500;
		scrollbars.CORNER = 10;
		scr.refresh();
		scr.handleV.firstChild.className.should.include('show');
		scr.handleH.firstChild.className.should.include('show');
		scr.handleV.style.bottom.should.eql('10px');
		scr.handleH.style.right.should.eql('10px');
		scr.destroy();
	});

	it.skip('should inherit styles based on an id as well', function () {
		
	});
	it.skip('should react to any changes in the original elements classlist', function () {
		
	});
});

