(function($){
	var defaults = {
		debug: false
		, allowedKeys: 'azertyui'
		, gameTime: 20 // The gametime (in seconds)
		, speed: 5000 // Speed of the dropping element
		, maxMiss: 0 // number of miss before gameover (0 mean no gameover)
		, amountMiss: 5 // Amount of missed orbs before it slows back
		
		, container: '#hero-fall'
		, elem: 'hero-elem'
		
		, newElemTime: 1300 // Time when a new element gets created
		
		, correctMinTop: 490
		, correctMaxTop: 520
		, missedMinTop: 400
		, missedMaxTop: 560
		
		// callback
		, newgame: function(){}
		, gameover: function(){}
		, score: function(){}
		, timer: function(){}
		, createElement: function(){}
	}, s = {};
	
	var methods = {
		init: function(options){
			s = $.extend({}, defaults, options);
			s.isPlaying = false;
			
			$('.newgame').bind('click.hero', function(e){
				e.preventDefault();
				methods.startNewGame.call(this);
			});
			
			$('.stopgame').bind('click.hero', function(e){
				e.preventDefault();
				methods.stopGame.call(this);
			});
			
			$(window).bind('resize.hero', function(){
				s.w = $(s.container).width() / s.allowedKeys.length;
				
				$('#hero-keys span').add(s.container + ' .' + s.elem).css({width: s.w});
			}).trigger('resize');
			
			return this;
		}, // init
		
		startNewGame: function(){
			if(s.isPlaying)	return;
			
			s.newgame.call(this, s);
			
			s.secondsLeft = s.gameTime
			, s.creationTime = s.newElemTime
			, s.dropped = 0
			, s.missed = 0
			, s.hit = 0
			, s.total = 0
			, s.isPlaying = true;
			
			if(s.debug){
				$('<div style="background:red;position:absolute;top:' + s.missedMinTop + 'px;height:' + (s.missedMaxTop - s.missedMinTop) + 'px;width:100%;"></div><div style="background:green;position:absolute;top:' + s.correctMinTop + 'px;height:' + (s.correctMaxTop - s.correctMinTop) + 'px;width:100%;"></div>').appendTo(s.container).css({opacity: 0.4});
			}
			
			helpers.startTimer.call(this);
			helpers.createNewElement.call(this);
			
			// Bind events
			$(document).bind({
				'keypress.hero': function(e){
					var key = e.keyCode || e.wich || e.charCode, k = String.fromCharCode(key), o = $(s.container).find('.' + s.elem + '.' + k).first(), reg = new RegExp('[' + s.allowedKeys + ']', "i");
					
					if(k.match(reg)){
						e.preventDefault();
						e.stopPropagation();
					}
					
					if(o.data('charcode') == key){
						var top = parseInt(o.css('top')) + o.height();
						
						if(top > s.missedMinTop && top < s.missedMaxTop){
							if(top > s.correctMinTop && top < s.correctMaxTop)
								helpers.correctElement.call(this, o);
							else
								helpers.missedElement.call(this, o, true);
						}
					}
				}
				, 'keyup.hero': function(e){
					var key = String.fromCharCode(e.keyCode || e.wich || e.charCode).toLowerCase(), reg = new RegExp('[' + s.allowedKeys + ']', "i");
					
					if(key.match(reg)){
						e.preventDefault();
						e.stopPropagation();
					}
					
					$('.key.' + key).animate({opacity: 0.6}, 100, function(){
						$(this).animate({opacity: 1}, 100);
					});
				}
			});
			
			$(window).trigger('resize');
		}, // startNewGame
		
		stopGame: function(){
			if(!s.isPlaying)	return;
			
			window.clearTimeout(s.newElementTimer);
			
			s.isPlaying = false
			, s.secondsLeft = 0;
			
			$('.' + s.elem).stop()
			.fadeOut(function(){$(this).remove();});
			
			$(s.container).addClass('gameover');
			
			$(document).unbind('.hero');
			
			s.gameover.call(this, s);
		} // stopGame
	}; // methods
	
	var helpers = {
		startTimer: function(){
			var timer = setTimeout(function(){helpers.startTimer.call(this);}, 1000);
			
			s.timer.call(this, s);
			
			if(s.secondsLeft-- <= 0){
				window.clearTimeout(timer);
				methods.stopGame.call(this);
			}
		}, // startTimer
		
		createNewElement: function(){
			if(!s.isPlaying)	return;
			
			s.newElementTimer = setTimeout(function(){helpers.createNewElement.call(this);}, s.creationTime);
			
			var n = document.createElement('i'), char = helpers.getRandomChar.call(this, 1, s.allowedKeys);
			n.className = s.elem + ' ' + char;
			n.innerHTML = char;
			
			$(n).data('charcode', char.charCodeAt(0))
			.css({
				display: 'none'
				, left: s.w * s.allowedKeys.indexOf(char)
				, width: s.w
			});
			
			if(s.isPlaying)	$(n).appendTo(s.container);
			
			s.total++;
			// BONUS ??
			
			s.createElement.call(this, $(n), s);
			
			helpers.dropElement.call(this, $(n));
		}, // createNewElement
		
		dropElement: function(o){
			
			// BONUS ??
			
			o.fadeIn()
			.animate({
				top: (o.parent().height() - o.height()/2)
			}, {
				duration: s.speed
				, easing: 'linear'
				, complete: function(){
					helpers.missedElement.call(this, o, false);
				}
			});
			
			s.score.call(this, s);
		}, // dropElement
		
		missedElement: function(o, falling){
			s.dropped++;
			s.missed++;
			
			if(s.dropped > s.amountMiss){
				if(s.creationTime > s.newElemTime - 100)	s.creationTime += 75;
				else if(s.creationTime > s.newElemTime - 250)	s.creationTime += 50;
				else if(s.creationTime > s.newElemTime - 500)	s.creationTime += 25;
				else if(s.creationTime > s.newElemTime - 700)	s.creationTime += 10;
				else if(s.creationTime > s.newElemTime - 800)	s.creationTime += 5;
			}
			
			if(s.missed >= s.maxMiss && s.maxMiss != 0)	methods.stopGame.call(this);
			
			if(falling)	o.stop();
			
			o.addClass('missed')
			.fadeOut(function(){$(this).remove();});
			
			s.score.call(this, s);
		}, // missedElement
		
		correctElement: function(o){
			s.dropped = 0;
			
			if(s.creationTime > s.newElemTime - 100)	s.creationTime -= 75;
			else if(s.creationTime > s.newElemTime - 250)	s.creationTime -= 50;
			else if(s.creationTime > s.newElemTime - 500)	s.creationTime -= 25;
			else if(s.creationTime > s.newElemTime - 700)	s.creationTime -= 10;
			
			// BONUS ?
			s.hit++;
			
			o.stop().addClass('correct')
			.fadeOut(function(){$(this).remove();});
			
			s.score.call(this, s);
		}, // correctElement
		
		getRandomChar: function(n, allowed){
			return allowed.charAt((Math.floor(Math.random() * (allowed.length - 0)) + 0));
		}, // getRandomChar
	}; // helpers
	
	Array.prototype.indexOf = function(search){
		var t = Object(this), len = t.length, n = 0;
		if(len === 0) return -1;
		if(arguments.length > 0){
			n = Number(arguments[1]);
			if(n != n) n = 0;
			else if(n != 0 && n != Infinity && n != -Infinity) n = (n > 0 || -1) * Math.floor(Math.abs(n));
		}
		if(n >= len) return -1;
		var k = n >= 0 ? n : Math.max(len - Math.abs(n), 0);
		for(; k < len; k++){
			if(k in t && t[k] === search) return k;
		}
		return -1;
	}; // Arr.indexOf(search);
	
	$.fn.hero = function(method){
		return methods.init.apply(this, arguments);
	};
})(jQuery); // jQuery.hero() by Stéphan Zych (monkeymonk.be)