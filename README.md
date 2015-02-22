# js
Javascript Dependency Manager - Async/Sync - Non-Obstrusive - Lazy Loading

$js().config({
		async:true,
		path:'js/',
		pathSuffix:'.js',
		pathDetection:true,
		dev:false
	});

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
