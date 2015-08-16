# $js

	lighweight javascript dependencies manager
	asynchronous module definition framework

	$js.async = true;
	$js.path = 'js/';
	$js.pathSuffix = '.js';
	$js.pathDetection = true;
	$js.dev = false;

	$js('js/script.js');
	$js('js/script');
	$js('script.js');
	$js('script');

	$js(['dependency1','dependency2'],function(){
		//put here callbacks functions
	});
	$js({
		dependency1:function(){
			//when dependency1 loaded
		},
		dependency2:function(){
			//when dependency2 loaded (after dependency loaded)
		},
	},function(){
		//when all finished
	});

	$js('dependency1')('dependency2')(function(){
		//put here callbacks functions
	});