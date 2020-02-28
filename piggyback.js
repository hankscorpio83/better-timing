(function() {
	var XHR = XMLHttpRequest.prototype;
	var send = XHR.send;
	var open = XHR.open;
	XHR.open = function(method, url) {
		this.url = url; // the request url
		return open.apply(this, arguments);
	}
	XHR.send = function() {
		this.addEventListener('load', function() {
			if (
				this.url.includes('data.json') || 
				this.url.includes('1__data.json') || 
				this.url.includes('2__data.json') || 
				this.url.includes('3__data.json') || 
				this.url.includes('4__data.json') || 
				this.url.includes('RaceData.json') || 
				this.url.includes('RaceData-2.json') || 
				this.url.includes('https://cors-anywhere.herokuapp.com/https://storage.googleapis.com/fiawec-prod/assets/live/WEC/__data.json') ||
				this.url.includes('https://storage.googleapis.com/fiawec-prod/assets/live/WEC/__data.json') ||
				this.url.includes('https://cors-anywhere.herokuapp.com/https://scoring.imsa.com/scoring_data/RaceResults_JSONP.json?callback=jsonpRaceResults') ||
				this.url.includes('https://scoring.imsa.com/scoring_data/RaceResults_JSONP.json?callback=jsonpRaceResults') //||
				//this.url.includes('https://cors-anywhere.herokuapp.com/https://scoring.imsa.com/scoring_data/SessionInfo_JSONP.json?callback=jsonpSessionInfo') ||
				//this.url.includes('https://scoring.imsa.com/scoring_data/SessionInfo_JSONP.json?callback=jsonpSessionInfo')
			) {
				var responseContainingEle = document.getElementById('__interceptedData');
				responseContainingEle.innerText = this.response;
			}
		});
		return send.apply(this, arguments);
	};
})();