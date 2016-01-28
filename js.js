/*
	$js - asynchronous module definition framework
			or just simple lightweight javascript dependencies manager
	
	@version 2.8
	@link http://github.com/redcatphp/js/
	@author Jo Surikat <jo@surikat.pro>
	@website http://redcatphp.com
*/
(function(w,d){
	String.prototype.toCamelCase = function(str){
		return str
			.replace(/\s(.)/g, function($1){ return $1.toUpperCase(); })
			.replace(/\s/g, '')
			.replace(/^(.)/, function($1){ return $1.toLowerCase(); });
	};
	if(!Array.prototype.indexOf){
		Array.prototype.indexOf = function(a,obj, start){
			var j = a.length;
			for (var i = (start?start:0), j; i < j; i++)
				if(a[i]===obj)
					return i;
			return -1;
		};
	}
	var isEmptyObject = function(obj){
		var name;
		for(name in obj){
			return false;
		}
		return true;
	};
	var ts = (new Date().getTime()).toString();
	var cacheFix = function(fileName,dev,min,ext,cdn){
		if(dev||min){
			var relative = fileName.indexOf('//')<0||(cdn&&fileName.indexOf(cdn)===0);
			if(min){
				if(relative&&fileName.indexOf('.min.'+ext)<0&&fileName.indexOf('.'+ext)){
					var p = fileName.lastIndexOf('.'+ext);
					if(p>-1)
						fileName = fileName.substr(0,p)+'.min'+fileName.substr(p);
				}
			}
			else{
				if(relative&&fileName.indexOf('_t=')<0)
					fileName += (fileName.indexOf('?')<0?'?':'&')+'_t='+ts;
			}
		}
		return fileName;
	};
	var scripts = [{},{}];
	var required = [];
	var handled = [];
	var requiring = {};
	var intercepting;
	
	var wait = function(u){
		if(handled.indexOf(u)>-1)
			handle(u);
		else
			setTimeout(function(){
				wait(u);
			},100);
	};
	var handle = function(u){
		if(requiring[u])
			while(requiring[u].length)
				(requiring[u].shift())(u);
	};
	var getSrc = function(u){
		if(typeof(u)=='undefined'||!u)
			return;
		var relative = u.indexOf('//')<0&&u.substr(0,2)!='./';
		return ($js.cdn&&relative?$js.cdn:'')+(u.indexOf('/')!==0?($js.path&&relative&&(!$js.pathDetection||u.indexOf($js.path)!=0)?($js.path+u):u)+($js.pathSuffix&&relative&&(!$js.pathDetection||u.substr(u.length-$js.pathSuffix.length)!=$js.pathSuffix)?$js.pathSuffix:''):u);
	};
	var createScript = function(u){
		var s = d.createElement('script');
		d.type = 'text/javascript';
		d.body.appendChild(s);
		var realcallback = function(){
			var shift = $js.modulesStack.shift();
			if(shift)
				$js.modules[u] = shift;
			required.push(u);
			handle(u);
			handled.push(u);
		};
		var callback = function(){
			if(intercepting){
				intercepting.src = u;
				intercepting.callback = realcallback;
				intercepting = false;
			}
			else{
				realcallback();
			}
		};
		s.onload = callback;
		s.onreadystatechange = function(){if(callback&&this.readyState==='loaded'){callback();}}; //old browsers
		s.setAttribute('async','async');
		s.src = cacheFix(u,$js.dev,$js.min,'js',$js.cdn);
	};
	var x = function(u,c){
		if(!u){
			if(typeof(c)=='function')
				c();
			return;
		}
		u = getSrc(u);
		if(!requiring[u]){
			requiring[u] = [];
			createScript(u);
		}
		if(typeof(c)=='function')
			requiring[u].push(c);
		if(handled.indexOf(u)>-1)
			handle(u);
		else if(required.indexOf(u)>-1)
			wait(u);
	};
	var resolveAsyncArr = function(u){
		var arr = [];
		for(var k in u){
			if(!u.hasOwnProperty(k)) continue;
			if((/^-?[0-9]+$/).test(k)){
				if(typeof(u[k])=='string'){
					arr.push(u[k]);
				}
				else{
					for(var ks in u[k]){
						if(!u[k].hasOwnProperty(ks)) continue;
						arr.push(u[k][ks]);
					}
				}
			}
			else{
				arr.push(k);
			}
			if(typeof(u[k])=='object'){
				for(var ks in u[k]){
					if(!u[k].hasOwnProperty(ks)) continue;
					if(typeof(u[k][ks])=='string'&&arr.indexOf(u[k][ks])===-1){
						arr.push(u[k][ks]);
					}
				}
			}
		}
		return arr;
	};
	var resolveDeps = function(u,arr){
		var deps = {};
		for(var k in u){
			if(!u.hasOwnProperty(k)) continue;
			var key = k;
			if((/^-?[0-9]+$/).test(k))
				key = u[k];
			if(typeof($js.dependenciesMap[key])=='object'){
				if(typeof(deps[key])=='undefined'){
					deps[key] = [];
				}
				for(var ks in $js.dependenciesMap[key]){
					if(!$js.dependenciesMap[key].hasOwnProperty(ks)) continue;
					if(deps[key].indexOf($js.dependenciesMap[key][ks])===-1){
						deps[key].push($js.dependenciesMap[key][ks]);
					}
					if(typeof(arr)!='undefined'&&arr.indexOf($js.dependenciesMap[key][ks])===-1){
						arr.push($js.dependenciesMap[key][ks]);
					}
				}
			}
			if(typeof(u[k])=='object'){
				if(typeof(deps[k])=='undefined'){
					deps[k] = [];
				}
				if(typeof($js.dependenciesMap[key])=='undefined'){
					$js.dependenciesMap[key] = [];
				}
				for(var ks in u[k]){
					if(!u[k].hasOwnProperty(ks)) continue;
					if(typeof(u[k][ks])=='string'){
						if(deps[key].indexOf(u[k][ks])===-1){
							deps[key].push(u[k][ks]);
						}
						if($js.dependenciesMap[key].indexOf(u[k][ks])===-1){
							$js.dependenciesMap[key].push(u[k][ks]);
						}
					}
				}
			}
		}		
		return deps;
	};
	var resolveDepCalls = function(u){
		var deps = {};
		for(var k in u){
			if(!u.hasOwnProperty(k)) continue;
			if(typeof(u[k])=='object'){
				for(var ks in u[k]){
					if(!u[k].hasOwnProperty(ks)) continue;
					if(typeof(u[k][ks])=='function'){
						if(typeof(deps[k])=='undefined'){
							deps[k] = [];
						}
						deps[k].push(u[k][ks]);
					}
				}
			}
		}
		return deps;
	};
	var depsLibPush = function(deps,lib,container){
		if(typeof(deps[lib])!='undefined'){
			for(var k in deps[lib]){
				if(!deps[lib].hasOwnProperty(k)) continue;
				depsLibPush(deps,deps[lib][k],container);
				if(container.indexOf(deps[lib][k])===-1)
					container.push(deps[lib][k]);
			}
		}
	};
	var resolveDepMap = function(deps){
		var depMap = {};
		for(var k in deps){
			if(!deps.hasOwnProperty(k)) continue;
			if(typeof(depMap[k])=='undefined'){
				depMap[k] = [];
			}
			depsLibPush(deps,k,depMap[k]);
		}
		return depMap;
	};
	var resolveDepTree = function(depMap){
		var depTree = {};
		for(var k in depMap){
			if(!depMap.hasOwnProperty(k)) continue;
			for(var k2 in depMap[k]){
				if(!depMap[k].hasOwnProperty(k2)) continue;
				if(typeof(depTree[depMap[k][k2]])=='undefined'){
					depTree[depMap[k][k2]] = [];
				}
				depTree[depMap[k][k2]].push(k);
			}
		}
		return depTree;
	};
	var depsToTops = function(deps){
		var tops = [];
		var topAll = [];
		var splices = [];
		while(!isEmptyObject(deps)){
			var top = [];
			for(var i = 0; i < splices.length; i++){
				deps[splices[i][0]].splice(deps[splices[i][0]].indexOf(splices[i][1]),1);
				if(deps[splices[i][0]].length===0){
					if(topAll.indexOf(splices[i][0])===-1){
						top.push(splices[i][0]);
						topAll.push(splices[i][0]);
					}
					delete(deps[splices[i][0]]);
				}
			}
			splices = [];
			for(var k in deps){
				if(!deps.hasOwnProperty(k)) continue;
				for(var ks in deps[k]){
					if(!deps[k].hasOwnProperty(ks)) continue;
					var dep = deps[k][ks];
					if(typeof(deps[dep])=='undefined'){
						if(topAll.indexOf(dep)===-1){
							top.push(dep);
							topAll.push(dep);
						}
						splices.push([k,dep]);
					}
				}
			}
			tops.push(top);
		}
		return tops;
	};
	var r = function(g,depTree,depMap,rio,arrSrc,c){ //recLoad
		var src = getSrc(g);
		if(typeof(arrSrc)!='undefined'){
			if(requiredGroups[rio].indexOf(src)===-1)
				requiredGroups[rio].push(src);
			if(requiredGroups[rio].sort().toString()==arrSrc){
				c();
			}
		}
		for(var z in depTree[g]){
			if(!depTree[g].hasOwnProperty(z)) continue;
			var dp = depTree[g][z];
			if(depMap[dp]){
				var ok = true;
				for(var z2 in depMap[dp]){
					if(!depMap[dp].hasOwnProperty(z2)) continue;
					if(required.indexOf(getSrc(depMap[dp][z2]))===-1){
						ok = false;
						break;
					}
				}
				if(ok){
					$js(dp,(function(){
						var dpz = dp.toString();
						return function(){
							r(dpz,depTree,depMap,rio,arrSrc,c);
						}
					})(),false);
				}
			}
		}
	};
	var resolveAlias = function(u){
		if(typeof(u)=='string'){
			if(typeof($js.aliasMap[u])!='undefined'){
				u = $js.aliasMap[u];
				u = resolveAlias(u);
			}
		}
		else if(typeof(u)=='object'){
			if(u instanceof Array){
				var un = [];
				for(var i = 0; i < u.length; i++){
					if(typeof(u[i])=='string'&&typeof($js.aliasMap[u[i]])!='undefined'){
						var alias = $js.aliasMap[u[i]];
						if(typeof(alias)=='object'){
							for(var ii in alias){
								if(!alias.hasOwnProperty(ii)) continue;
								if((/^-?[0-9]+$/).test(ii)){
									var aliasii = alias[ii];
								}
								else{
									var aliasii = ii;
								}
								aliasii = resolveAlias(aliasii);
								if(un.indexOf(aliasii)===-1)
									un.push(aliasii);
							}
						}
						else{
							alias = resolveAlias(alias);
							if(un.indexOf(alias)===-1)
								un.push(alias);
						}
					}
					else{
						u[i] = resolveAlias(u[i]);
						if(un.indexOf(u[i])===-1)
							un.push(u[i]);
					}
				}
				u = un;
			}
			else{
				for(var k in u){
					if(!u.hasOwnProperty(k)) continue;
					u[k] = resolveAlias(u[k]);
				}
			}
		}
		return u;
	};
	var requiredGroups = [];
	var asyncArrayCall = function(uo,s,c,i,deps){
		var u = [];
		for(var k in uo){
			if(!uo.hasOwnProperty(k)) continue;
			u.push(getSrc(uo[k]));
		}
		u = u.sort().toString();
		$js(s,function(){
			requiredGroups[i].push(getSrc(s));
			if(requiredGroups[i].sort().toString()==u){
				if(typeof(c)=='function')
					c();
			}
		},false,deps);
	};
	var asyncJsObject = function(u,c){
		requiredGroups.push([]);
		var arr = resolveAsyncArr(u);
		var deps = resolveDeps(u,arr);
		var m = resolveDepCalls(u);
		for(var k in u){
			if(!u.hasOwnProperty(k)) continue;
			if(typeof(u[k])!='object'){
				if((/^-?[0-9]+$/).test(k)){
					k = u[k];
				}
				if(typeof(deps[k])=='undefined'){
					asyncArrayCall(arr,k,c,requiredGroups.length-1);
				}
			}
		}
		var o = resolveDepMap(deps);
		var t = resolveDepTree(o);
		var tops = depsToTops(deps);
		var rio = requiredGroups.length-1;
		var h = [];
		for(var k in arr){
			if(!arr.hasOwnProperty(k)) continue;
			h.push(getSrc(arr[k]));
		}
		h = h.sort().toString();
		var depTreeKeys = [];
		for(var k in t){
			if(!t.hasOwnProperty(k)) continue;
			if(depTreeKeys.indexOf(k)===-1)
				depTreeKeys.push(k);
		}
		var b = function(){
			if(c){
				c();
				c = null;
			}
		};
		var ev = '';
		for(var _g in depTreeKeys.reverse()){
			if(!depTreeKeys.hasOwnProperty(_g)) continue;
			var g = depTreeKeys[_g];
			if(typeof(m[g])!='undefined'){
				for(var i in m[g].reverse()){
					if(!m[g].hasOwnProperty(i)) continue;
					ev = 'm["'+g+'"]['+i+']();'+ev;
				}
			}
			if(typeof(u[g])=='function')
				ev = 'u["'+g+'"]();'+ev;
			ev = '$js("'+g+'",function(){r("'+g+'",t,o,'+rio+',h,b);'+ev+'},false);';
		}
		eval(ev);
	};
	var syncJsObject = function(u,c){
		var tops = depsToTops(resolveDeps(u));
		if(typeof(tops[0])=='undefined')
			tops[0] = [];
		var m = resolveDepCalls(u);
		for(var k in u){
			if(!u.hasOwnProperty(k)) continue;
			if(typeof(u[k])!='object'){
				var p;
				if((/^-?[0-9]+$/).test(k))
					p = u[k];
				else
					p = k;
				if(tops[0].indexOf(p)===-1)
					tops[0].push(p);
			}
		}
		var ev = c?'if(c)c();':'';
		for(var k in tops.reverse()){
			if(!tops.hasOwnProperty(k)) continue;
			for(var ks in tops[k].reverse()){
				if(!tops[k].hasOwnProperty(ks)) continue;
				var d = tops[k][ks];
				if(typeof(m[d])!='undefined'){
					for(var i in m[d].reverse()){
						if(!m[d].hasOwnProperty(i)) continue;
						ev = 'm["'+d+'"]['+i+']();'+ev;
					}
				}
				if(typeof(u[d])=='function')
					ev = 'u["'+d+'"]();'+ev;
				ev = '$js("'+d+'",function(){'+ev+'});';
			}
		}
		eval(ev);
	};
	var apt = function(u,c,m){
		m = m?0:1;
		//u = getSrc(u);
		if(!scripts[m][u])
			scripts[m][u] = [];
		if(typeof(c)=='function')
			scripts[m][u].push(c);
	};
	var paramsReflection = function(f){
		var args = f.toString().match(/^\s*function\s+(?:\w*\s*)?\((.*?)\)\s*{/);
		var r = {};
		if(args&&args[1]){
			args = args[1];
			args = args.replace(/((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg,'');
			args = args.trim().split(/\s*,\s*/);
			for(var i=0;i<args.length;i++){
				var arg = args[i];
				var idf = arg.indexOf('=');
				if(idf===-1){
					r[arg] = undefined;
				}
				else{
					r[arg.substr(0,idf)] = eval(arg.substr(idf+1).trim());
				}
			}
		}
		return r;
	};
	var moduleDomElement = function(module,el,attrNs){
		var o = {};
		var attributes = el.attributes;
		var prefixNs = attrNs+'-';
		var prefixNsL = prefixNs.length;
		for(var k in attributes){
			if(attributes.hasOwnProperty(k)){
				var attribute = attributes[k];
				if(attribute.name&&attribute.name.substr(0,prefixNsL)==prefixNs){
					o[attribute.name.substr(prefixNsL)] = attribute.value;
				}
			}
		}
		$js(module,function(){
			var func = $js.module(module);			
			var params = paramsReflection(func);
			var apply = [];
			for(var k in params){
				if(params.hasOwnProperty(k)){
					if(k=='$di'){
						apply.push(o);
					}
					else if(typeof(o[k])!='undefined'){
						apply.push(o[k]);
					}
					else{
						apply.push(params[k]);
					}
				}
			}
			func.apply(el,apply);
		});
	};
	$js = (function(){
		
		//invoker
		var js = function(){
			//mixed args
			var u,c,sync,deps = true;
			for(var i = 0; i < arguments.length; i++){
				switch(typeof(arguments[i])){
					case 'boolean':
						if(typeof(sync)=='undefined')
							sync = arguments[i];
						else
							deps = arguments[i];
					break;
					case 'function':
						c = arguments[i];
					break;
					case 'string':
					case 'object':
						u = arguments[i];
					break;
				}
			}
			if(typeof(sync)=='undefined')
				sync = !$js.async;
				
			
			//alias
			u = resolveAlias(u);
			
			//handle
			if(typeof(u)=='object'){
				if(sync)
					syncJsObject(u,c);
				else
					asyncJsObject(u,c);
			}
			else{
				if(typeof(u)=='function'){
					c = u;
					u = 0;
				}
				if(deps&&typeof($js.dependenciesMap[u])!='undefined'){
					asyncJsObject($js.dependenciesMap[u],function(){
						$js(u,c,sync,false);
					});
				}
				else{
					apt(u,c,!sync);
				}
			}
			
			//chainable
			return function(){
				var a = arguments;
				return $js(u,function(){
					$js.apply(null,a);
				});
			};
		};
		
		//vars init
		js.dependenciesMap = {};
		js.aliasMap = {};
		js.modules = {};
		js.modulesStack = [];
		
		//config init
		js.dev = false;
		js.async = true;
		js.path = 'js/';
		js.pathDetection = true;
		js.pathSuffix = '.js';
		js.min = false;
		js.cdn = false;
		
		//methods
		js.alias = function(alias,concrete){
			if(typeof(alias)=='object'){
				for(var k in alias){
					if(alias.hasOwnProperty(k)){
						js.alias(k,alias[k]);
					}
				}
			}
			else{
				js.aliasMap[alias] = concrete;
			}
		};
		js.module = function(){
			//mixed args
			var id,mod,obj,sync=!$js.async;
			for(var i = 0; i < arguments.length; i++){
				switch(typeof(arguments[i])){
					case 'string':
						id = arguments[i];
					break;
					case 'function':
						mod = arguments[i];
					break;
					case 'object':
						if(obj&&!mod)
							mod = arguments[i];
						else
							obj = arguments[i];
					break;
					case 'boolean':
						sync = arguments[i];
					break;
				}
			}			
			if(!mod&&typeof(obj)!='undefined'){
				mod = obj;
				obj = null;
			}
			if(!mod){
				return js.modules[getSrc(id)];
			}
			else{
				if(obj){
					var interceptor = {};
					intercepting = interceptor;
					$js(obj,sync,function(){
						if(id){
							js.modules[getSrc(id)] = mod;
						}
						else{
							js.modulesStack.push(mod);
						}
						if(!interceptor.callback){
							intercepting = false;
						}
						else{
							interceptor.callback();
						}
					});
				}
				else{
					if(id){
						js.modules[getSrc(id)] = mod;
					}
					else{
						js.modulesStack.push(mod);
					}
				}
			}
		};
		js.dependencies = function(deps){
			for(var k in deps){
				if(!deps.hasOwnProperty(k)) continue;
				if(typeof(js.dependenciesMap[k])=='undefined'){
					js.dependenciesMap[k] = [];
				}
				if(typeof(deps[k])=='string'){
					if(typeof($js.aliasMap[deps[k]])!='undefined'){
						js.dependenciesMap[k].push($js.aliasMap[deps[k]]);
					}
					else{
						js.dependenciesMap[k].push(deps[k]);
					}
				}
				else{
					deps[k] = resolveAlias(deps[k]);
					for(var ks in deps[k]){
						if(!deps[k].hasOwnProperty(ks)) continue;
						js.dependenciesMap[k].push(deps[k][ks]);
					}
				}
			}
		};
		js.invokeArray = function(mod,args){
			return $js(mod,function(){
				$js.module(mod).apply(null,args);
			});
		};
		js.invoke = function(){
			var args = Array.prototype.slice.call(arguments);
			var mod = args.shift();
			return $js.invokeArray(mod,args);
		};
		js.paramsReflection = paramsReflection;
		js.moduleDom = function(prefixPath,attrNs){
			if(!prefixPath)
				prefixPath = 'js.module.dom/';
			if(!attrNs)
				attrNs = 'js';
			var all = document.getElementsByTagName('*');
			for(var i=0;i<all.length;i++){
				var js = all[i].getAttribute(attrNs);
				if(js){
					moduleDomElement(prefixPath+js,all[i],attrNs);
				}
			}
		};
		return js;
	})();
	var y = {};
	var loader = function(m,k){
		var s = scripts[m][k];
		if(!m){
			if(k){
				x(k,function(){
					for(var i = 0; i < s.length; i++){
						if(s[i])
							s[i]();
					}
				});
			}
			else{
				for(var i = 0; i < s.length; i++){
					if(s[i])
						s[i]();
				}
			}
		}
		else{
			if(!y[k])
				y[k] = [];
			y[k] = s;
		}
	};
	var keysOf = function(o){
		var a = [];
		for(var k in o){
			if(!o.hasOwnProperty(k)) continue;
			a.push(k);
		}
		return a;
	};


	var getHref = function(u){
		if(typeof(u)=='undefined'||!u)
			return;
		var relative = u.indexOf('//')<0&&u.substr(0,2)!='./';
		return ($css.cdn&&relative?$css.cdn:'')+($css.path&&relative&&u.indexOf('/')!==0&&(!$css.pathDetection||u.indexOf($css.path)!=0)?($css.path+u):u)+($css.pathSuffix&&relative&&(!$css.pathDetection||u.substr(u.length-$css.pathSuffix.length)!=$css.pathSuffix)?$css.pathSuffix:'');
	};
	var loadedCSS = [];
	$css = (function(){
		var css = function(fileName, media){
			var test = fileName;
			fileName = getHref(fileName);
			if(loadedCSS.indexOf(fileName)<0){
				loadedCSS.push(fileName);
				var links = d.getElementsByTagName('link'), i = links.length, style;
				var exist = false;
				while(i--){ // check if not already loaded fixed in head
					if (links[i].href.indexOf(fileName) > -1)
						exist = true;
				}
				if(!exist){
					style = d.createElement('link');
					style.type = 'text/css';
					style.rel = 'stylesheet';
					if(media)
						style.media =	media;
					style.href = cacheFix(fileName,$css.dev,$css.min,'css',$css.cdn);
					d.getElementsByTagName('head')[0].appendChild(style);
				}
			}
		};
		css.dev = false;
		css.path = 'css/';
		css.pathDetection = true;
		css.pathSuffix = '.css';
		css.min = false;
		css.cdn = false;
		return css;
	})();
	
	var base = d.getElementsByTagName('base');
	if(base.length){
		var dcdn = base[0].getAttribute('data-cdn');
		if(typeof(dcdn)!='undefined'){
			$js.cdn = dcdn;
			$css.cdn = dcdn;
		}
	}
	
	var load = function(){			
		apt = x;
		for(var k in scripts[0]){
			if(!scripts[0].hasOwnProperty(k)) continue;
			loader(0,k);
		}
		for(var k in scripts[1]){
			if(!scripts[0].hasOwnProperty(k)) continue;
			loader(1,k);
		}
		
		var ev = '';
		var keys = keysOf(y).reverse();
		for(var u=0; u < keys.length; u++){
			u = keys[u];
			var keys2 = keysOf(y[u]).reverse();
			var ev2 = '';
			for(var i = 0; i < keys2.length; i++){
				if(y[u]&&y[u][i])
					ev2 += 'y["'+u+'"]["'+i+'"]();';
			}
			ev = 'x("'+u+'"'+(ev? ',function(){'+ev2+ev+'}' :'')+');';
		}
		if(ev)
			eval(ev);
	};
	
	if(w.addEventListener)
		w.addEventListener('load',load,false);
	else if(w.attachEvent)
		w.attachEvent('onload',load);
	else
		w.onload=load;
})(window,document);