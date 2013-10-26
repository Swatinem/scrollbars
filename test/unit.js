
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

	it('should make the container positioned', function () {
		var elem = qs('#test-position');
		gcs(elem).position.should.eql('static');
		scrollbars(elem);
		gcs(elem).position.should.eql('relative');
	});

	it('should not touch `position` of already positioned elements', function () {
		var elem = qs('#test-position-fixed');
		gcs(elem).position.should.eql('fixed');
		scrollbars(elem);
		gcs(elem).position.should.eql('fixed');
	});

	it('should restore overridden properties', function () {
		var elem = qs('#test-restore');
		var scr = scrollbars(elem);
		var st = gcs(elem);
		st.position.should.eql('relative');
		st.overflow.should.eql('hidden');
		scr.destroy();
		var st = gcs(elem);
		st.position.should.eql('static');
		st.overflow.should.eql('visible');
	});

	it('should propagate padding to the wrapper', function () {
		var elem = qs('#test-padding');
		var scr = scrollbars(elem);
		var st = gcs(elem.firstChild);
		st.paddingTop.should.eql('20px');
	});

	it('should not make the scroll handles visible when there is nothing to scroll', function () {
		var elem = qs('#test-nothing');
		var scr = scrollbars(elem);
		scr.refresh();
		qs('.scrollbars-handle.vertical', elem).className.should.not.include('show');
		qs('.scrollbars-handle.horizontal', elem).className.should.not.include('show');
	});

	it('should add a scrollbar when there is something to scroll', function () {
		var elem = qs('#test-something');
		var scr = scrollbars(elem);
		scr.refresh();
		qs('.scrollbars-handle.vertical', elem).className.should.include('show');
		qs('.scrollbars-handle.horizontal', elem).className.should.include('show');
		qs('.scrollbars-handle.vertical', elem).parentNode.style.bottom.should.eql('50px');
		scr.destroy();
	});

	it('should move the scrollbar according to scrollTop', function () {
		var elem = qs('#test-something');
		var scr = scrollbars(elem);
		elem.firstChild.scrollTop = 50;
		scr.refresh();
		qs('.scrollbars-handle.vertical', elem).className.should.include('show');
		qs('.scrollbars-handle.horizontal', elem).className.should.include('show');
		qs('.scrollbars-handle.vertical', elem).parentNode.style.bottom.should.eql('25px');
		scr.destroy();
	});

	it('should not mess with the childs dimensions', function () {
		var elem = qs('#test-dimensions');
		var child = elem.firstChild;
		var dim = child.getBoundingClientRect();
		dim = [dim.top, dim.right, dim.bottom, dim.left, dim.width, dim.height];
		var scr = scrollbars(elem);
		scr.refresh();
		var dim2 = child.getBoundingClientRect();
		dim2 = [dim2.top, dim2.right, dim2.bottom, dim2.left, dim2.width, dim2.height];
		dim2.should.eql(dim);
	});
});

