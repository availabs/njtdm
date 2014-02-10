$(function(){
	var popup = {
		init : function() {
			$("#legend h2 a").on("click", function() {
				$(this).toggleClass("closed");
				$("#legend-detail").slideToggle(300);
				return false;
			});
			windowW = $(window).width();
			$("#map").on("mousemove", function(e) {
				
				var x = e.pageX + 20;
				var y = e.pageY;
				var windowH = $(window).height();
				if (y > (windowH - 100)) {
					var y = e.pageY - 100;
				} else {
					var y = e.pageY - 20;
				}
				$("#info").css({
					"left": x,
					"top": y
				});
			});

		}

	};
	popup.init();
	
});

