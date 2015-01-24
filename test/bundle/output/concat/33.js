(function () { 'use strict';

	var _Promise__Promise = function () {};

	_Promise__Promise.prototype = {
		keep () { this.state = 'kept'; },
		break () { this.state = 'broken'; }
	};

	var _Promise = _Promise__Promise;

	var _Math = {
		get add () { return add; },
		get multiply () { return multiply; }
	};

	function add ( a, b ) {
		return a + b;
	}

	function multiply ( a, b ) {
		return a * b;
	}

	var promise = new _Promise();
	promise.keep();

	console.log( _Math.add( 40, 2 ) );

})();