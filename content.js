HTMLElement.prototype.htmlContent = function(html) {
	var dom = new DOMParser().parseFromString('<template>'+html+'</template>', 'text/html').head;
	this.appendChild(dom.firstElementChild.content);
}

var arr = {
	max: function(array) {
		return Math.max.apply(null, array);
	},

	min: function(array) {
		return Math.min.apply(null, array);
	},

	range: function(array) {
		return arr.max(array) - arr.min(array);
	},

	midrange: function(array) {
		return arr.range(array) / 2;
	},

	sum: function(array) {
		var num = 0;
		for (var i = 0, l = array.length; i < l; i++) num += array[i];
			return num;
	},

	mean: function(array) {
		return arr.sum(array) / array.length;
	},

	median: function(array) {
		array.sort(function(a, b) {
			return a - b;
		});
		var mid = array.length / 2;
		return mid % 1 ? array[mid - 0.5] : (array[mid - 1] + array[mid]) / 2;
	},

	modes: function(array) {
		if (!array.length) return [];
		var modeMap = {},
		maxCount = 1,
		modes = [array[0]];

		array.forEach(function(val) {
			if (!modeMap[val]) modeMap[val] = 1;
			else modeMap[val]++;

			if (modeMap[val] > maxCount) {
				modes = [val];
				maxCount = modeMap[val];
			}
			else if (modeMap[val] === maxCount) {
				modes.push(val);
				maxCount = modeMap[val];
			}
		});
		return modes;
	},

	variance: function(array) {
		var mean = arr.mean(array);
		return arr.mean(array.map(function(num) {
			return Math.pow(num - mean, 2);
		}));
	},

	standardDeviation: function(array) {
		return Math.sqrt(arr.variance(array));
	},

	meanAbsoluteDeviation: function(array) {
		var mean = arr.mean(array);
		return arr.mean(array.map(function(num) {
			return Math.abs(num - mean);
		}));
	},

	zScores: function(array) {
		var mean = arr.mean(array);
		var standardDeviation = arr.standardDeviation(array);
		return array.map(function(num) {
			return (num - mean) / standardDeviation;
		});
	}
};

function updateMedianStint($cell) {
	var pitStops = $cell.attr('pitstops')
		, stintLengths = []
		;

	if (pitStops !== undefined) {
		pitStops = pitStops.split(',');
		// array of pit stop laps => array of stint lengths by subtracting previous stop
		for (var i = pitStops.length - 1; i >= 1; i--) {
			stintLengths.unshift(parseInt(pitStops[i], 10) - parseInt(pitStops[i-1], 10))
		}
		$cell.attr('median-stint', arr.median(stintLengths));
	}
}

var betterTiming = [];

betterTiming.weather = {
	sunny: "Sunny", 
	mostly_sunny: "Mostly Sunny", 
	cloudy: "Cloudy",
	partly_cloudy: "Partly Cloudy",
	clear_day: "Clear",
	clear_night: "Clear - Night",
	rain: "Rain",
	sleet: "Sleet",
	snow: "Snow"
}

betterTiming.updateCount = 0;
betterTiming.countdown;
betterTiming.countdownTimer;
betterTiming.lapsRemaining = 599;
betterTiming.bestLap = moment("23:59:59.999", ['hh:mm:ss.SSS']).format('mm:ss.SSS');
betterTiming.bestSector1 = moment("23:59:59.999", ['hh:mm:ss.SSS']).format('mm:ss.SSS');
betterTiming.bestSector2 = moment("23:59:59.999", ['hh:mm:ss.SSS']).format('mm:ss.SSS');
betterTiming.bestSector3 = moment("23:59:59.999", ['hh:mm:ss.SSS']).format('mm:ss.SSS');
betterTiming.bestSpeed = 0;

betterTiming.$injectionPoint = $('body');
betterTiming.$wrapper = document.createElement('section');
betterTiming.$wrapper.classList = "enhanced-wrapper compact";

betterTiming.$statusTable = document.createElement('table');
betterTiming.$statusTable.classList = "enhanced-status";
betterTiming.$statusTable.htmlContent('<thead></thead><tbody>' +
	'<tr class="row">' +
		'<td class="elapsed" style="display: none;" data-status="elapsed"></td>' +
		'<td class="remaining" data-status="remaining"></td>' +
		'<td class="status" data-status="racestate"></td>' +
		'<td class="weather" data-status="weather"></td>' +
	'</tr>');

betterTiming.$standingsTable = document.createElement('table');
betterTiming.$standingsTable.classList = "enhanced-order sortable";
betterTiming.$standingsTable.htmlContent('<thead>' +
	'<tr class="row">' +
		'<th data-sort-method="number" data-sort-default>Pos</th>' +
		'<th>Num</th>' +
		'<th>PIC</th>' +
		'<th>Status</th>' +
		'<th class="align-left">Driver / Team / Car (Tire)</th>' +
		'<th>Laps</th>' +
		'<th class="hide-900">Best</th>' +
		'<th class="hide-900">Gap</th>' +
		'<th>Int</th>' +
		'<th>Lap Time</th>' +
		'<th class="hide-700">S1</th>' +
		'<th class="hide-700">S2</th>' +
		'<th class="hide-700">S3</th>' +
		'<th class="car-speed">Speed</th>' +
		'<th class="hide-700">Pit</th>' +
	'</tr>' +
	'</thead>' +
	'<tbody>' +
	'<tr data-template="car-row" :class="team.category">' +
		'<td class="car-ranking" data-entry="ranking"></td>' +
		'<td class="car-number" :class="team.category" data-entry="number"></td>' +
		'<td class="car-pic" :class="team.category" data-entry="categoryPosition"></td>' +
		'<td class="car-state" data-entry="state"></td>' +
		'<td class="car-team align-left">' +
			'<span class="car-detail-wrap">' +
			'<span class="driver" data-entry="driver"></span>' +
			'<span :class="team.category" data-entry="team"></span>' +
			'</span>' +
			'<span class="car-detail-wrap expanded-info justify-between">' +
			'<span class="driver-detail">' +
			'<span data-entry="driver_id"></span>' +
			'<span class="driver-detail-popup"></span>' +
			'</span>' +
			'<span class="car-car" data-entry="car"></span>' +
			'<span class="car-tire" data-entry="tyre"></span>' +
			'</span>' +
		'</td>' +
		'<td class="car-lap-count" data-entry="lap"></td>' +
		'<td class="car-bestlap hide-900" data-entry="bestlap"></td>' +
		'<td class="car-gaps hide-900">' +
			'<span data-entry="gap"></span>' +
			'<span class="previous expanded-info" data-entry="classGap"></span>' +
		'</td>' +
		'<td class="car-gap-previous">' +
			'<span data-entry="gapPrev"></span>' +
			'<span class="previous expanded-info" data-entry="classGapPrev"></span>' +
		'</td>' +
		'<td class="car-lap-times">' +
			'<span data-entry="lastlap"></span>' +
			'<span class="best expanded-info" data-entry="bestlap"></span>' +
		'</td>' +
		'<td class="sector hide-700" data-sector="1">' +
			'<span class="bar"></span>' +
			'<span class="current" data-entry="currentSector1"></span>' +
			'<span class="best expanded-info" data-entry="bestSector1"></span>' +
		'</td>' +
		'<td class="sector hide-700" data-sector="2">' +
			'<span class="bar"></span>' +
			'<span class="current" data-entry="currentSector2"></span>' +
			'<span class="best expanded-info" data-entry="bestSector2"></span>' +
		'</td>' +
		'<td class="sector hide-700" data-sector="3">' +
			'<span class="bar"></span>' +
			'<span class="current" data-entry="currentSector3"></span>' +
			'<span class="best expanded-info" data-entry="bestSector3"></span>' +
		'</td>' +
		'<td class="car-speed">' +
			'<span data-entry="speed"></span>' +
		'</td>' +
		'<td class="car-pitstops hide-700">' +
			'<span data-entry="pitstop"></span>' +
			'<span class="expanded-info">' +
			'<span class="remaining" data-calc="pit-remaining"></span>' +
			'<span class="estimate" data-calc="pit-estimate"></span>' +
			'</span>' +
		'</td>' +
	'</tr>' + 
	'</tbody>');



// apply enhanced view
function enhance() {
	$('body').addClass('enhanced');
	document.body.appendChild(betterTiming.$wrapper);
	$(betterTiming.$wrapper).append('<a id="betterTimingClose" href="#">Toggle</a>')
	betterTiming.$wrapper.appendChild(betterTiming.$statusTable);
	betterTiming.$wrapper.appendChild(betterTiming.$standingsTable);
	
	$('#betterTimingClose').on('click', function() {
		$('body').toggleClass('enhanced');
	});
	
	betterTiming.$data = document.querySelector('#__interceptedData');
	var betterTimingObserver = new MutationObserver(function(mutations, observer) {
		if (betterTiming.$data.textContent !== "") {
			//console.log(JSON.parse(betterTiming.$data.textContent));
			updateData(JSON.parse(betterTiming.$data.textContent));
		}
	});
	
	betterTimingObserver.observe(betterTiming.$data, {
		attributes: true,
		characterData: true,
		childList: true,
		subtree: true,
		attributeOldValue: true,
		characterDataOldValue: true
	});
}

function updateData(data){
	//console.log(data);
	betterTiming.data = data;
	betterTiming.dataStatusLength = betterTiming.data.params.length;
	betterTiming.dataCarsLength = betterTiming.data.entries.length;
	betterTiming.dataDriversLength = betterTiming.data.driversResult.length;
	$('#__interceptedData').text('');

	//console.log('first run? ' + betterTiming.firstRun)

	betterTiming.updateCount++;
	if (betterTiming.updateCount === 1) {
		buildEnhancedView();
	} else {
		updateEnhancedView();
	}
};

// build enhanced view
function buildEnhancedView(){
	// build standings
	betterTiming.$standingsTable = $('.enhanced-order tbody');
	betterTiming.sortTable = new Tablesort(document.querySelector('.enhanced-order'));
	
	// build status
	betterTiming.$statusTable = $('.enhanced-status tbody');
	populateRaceStatus();

	// create a row for each car in the data
	for (var i = 0; i < betterTiming.dataCarsLength; i++) {
		var $row = $('[data-template="car-row"]').clone()
		;

		populateTableData(betterTiming.data.entries[i], $row);
		$row.removeAttr('data-template').appendTo(betterTiming.$standingsTable);
	};

	loadStoredPitstops();
	checkOverallBest();
	calculatePitStrategy();

	// toggle row expanded on click
	betterTiming.$standingsTable.find('tr').on('click', function() {
		var $row = $(this);

		$row.toggleClass('expanded');
		if ($row.hasClass('expanded')) {
			populateDriverData($row);
		}
	})
};

// update enhanced view data
function updateEnhancedView(){
	clearInterval(betterTiming.countdownTimer);
	
	// populate data for each car
	for (var i = 0; i < betterTiming.dataCarsLength; i++) {
		var $row = betterTiming.$standingsTable.find('tr[data-ident="'+ betterTiming.data.entries[i]['id'] +'"]')
			;

		populateTableData(betterTiming.data.entries[i], $row);
	};

	betterTiming.sortTable.refresh();
	populateRaceStatus();
	checkOverallBest();
	calculatePitStrategy();
};

function clearStoredPitstops(sessionId) {
	localStorage.clear();
	localStorage.setItem('sessionId', sessionId);
	betterTiming.$standingsTable.find('.car-pitstops').removeAttr('pitstops').removeAttr('median-stint').find('[data-calc]').text();
}

// load pitstop data from local storage
function loadStoredPitstops() {
	var StatusData = betterTiming.data.params
		, storedSessionId = localStorage.getItem('sessionId')
		;

	// if there is no/a different stored session ID, erase the stored data
	if(storedSessionId === null || storedSessionId != StatusData['sessionId']) {
		clearStoredPitstops(StatusData['sessionId']);
	} else {
		for (var i = localStorage.length - 1; i >= 0; i--) {
			// for each item in storage, copy the stored pitstop data to the car data
			var carId = localStorage.key(i)
				, $row = betterTiming.$standingsTable.find('[data-ident="' + carId + '"]')
				;

			if ($row.length > 0) {
				$row.find('.car-pitstops').attr('pitstops', localStorage.getItem(carId));
				updateMedianStint($row);
			}
		}
	}
}

// highlight overall best lap/sector/speeds
function checkOverallBest() {
	var $pbs = betterTiming.$standingsTable.find('.pb')
	;

	for (var i = 0; i < $pbs.length; i++) {
		var $cell = $pbs.eq(i)
		;

		switch ($cell.attr('data-entry')) {
			case 'lastlap':
				var rowBestLap = moment($cell.text(), ['hh:mm:ss.SSS' ,'mm:ss.SSS', 'ss.SSS']).format('mm:ss.SSS')

				if (rowBestLap <= betterTiming.bestLap) {
					betterTiming.$standingsTable.find('.car-lap-times.ob').removeClass('ob');
					$cell.addClass('ob');
					betterTiming.bestLap = rowBestLap;
				}
			break;
			case 'currentSector1':
				var rowBestSector1 = moment($cell.text(), ['hh:mm:ss.SSS' ,'mm:ss.SSS', 'ss.SSS']).format('mm:ss.SSS')

				if (rowBestSector1 <= betterTiming.bestSector1) {
					betterTiming.$standingsTable.find('.ob[data-entry="currentSector1"]').removeClass('ob');
					$cell.addClass('ob');
					betterTiming.bestSector1 = rowBestSector1;
				}
			break;
			case 'currentSector2':
				var rowBestSector2 = moment($cell.text(), ['hh:mm:ss.SSS' ,'mm:ss.SSS', 'ss.SSS']).format('mm:ss.SSS')

				if (rowBestSector2 <= betterTiming.bestSector2) {
					betterTiming.$standingsTable.find('.ob[data-entry="currentSector2"]').removeClass('ob');
					$cell.addClass('ob');
					betterTiming.bestSector2 = rowBestSector2;
				}
			break;
			case 'currentSector3':
				var rowBestSector3 = moment($cell.text(), ['hh:mm:ss.SSS' ,'mm:ss.SSS', 'ss.SSS']).format('mm:ss.SSS')

				if (rowBestSector3 <= betterTiming.bestSector3) {
					betterTiming.$standingsTable.find('.ob[data-entry="currentSector3"]').removeClass('ob');
					$cell.addClass('ob');
					betterTiming.bestSector3 = rowBestSector3;
				}
			break;
		}
	}

	var $rows = betterTiming.$standingsTable.find('tr')
	;

	for (var i = 1; i < $rows.length; i++) {
		var $row = $rows.eq(i)
		, rowSpeed = parseFloat($row.find('[data-entry="speed"]').text(), 10)

		if (rowSpeed > betterTiming.bestSpeed) {
			betterTiming.$standingsTable.find('[data-entry="speed"].ob').removeClass('ob');
			$row.find('[data-entry="speed"]').addClass('ob');
			betterTiming.bestSpeed = rowSpeed;
		}
	}
};

function populateRaceStatus() {
	var StatusData = betterTiming.data.params
		, storedSessionId = localStorage.getItem('sessionId')
		;

	// if there is no/a different stored session ID, erase the stored data
	if(storedSessionId === null || storedSessionId != StatusData['sessionId']) {
		clearStoredPitstops(StatusData['sessionId']);
	}
	
	betterTiming.$statusTable.find('[data-status]').each(function() {
		var field = $(this).attr('data-status')
		, $this = $(this)
		;

		//console.log(field, $this);
		$this.text(StatusData[field]);

		switch (field) {
			case 'racestate':
				$this[0].classList = $this.text().toLowerCase() + '_flag status'; //.text('');
			break;
			case 'weather':
				$this.text(betterTiming.weather[StatusData[field]] + ', ' + StatusData['airTemp'] + '°/' + StatusData['trackTemp'] + '°');
			break;
			//case 'elapsed':
			case 'remaining':
				// fake countdown + estimated laps left
				betterTiming.seconds = parseInt($(this).text(), 10);
				betterTiming.$timer = $(this);

				betterTiming.countdown = function() {
					if (betterTiming.seconds > 0) {						
						betterTiming.$timer.text(convertSecondsToHMS(betterTiming.seconds));
						betterTiming.seconds--;
						
						var $firstPlace = betterTiming.$standingsTable.find('tr').eq(1);
						
						if ($firstPlace.length > 0) {
							var lapsCompleted = parseInt($firstPlace.find('[data-entry="lap"]').text(), 10)
							, elapsed = parseInt(StatusData['elapsed'], 10)
							;
							betterTiming.lapsRemaining = Math.floor(betterTiming.seconds / (elapsed/lapsCompleted))
							
							if (betterTiming.lapsRemaining > 1 && betterTiming.lapsRemaining < 600) {
								var lapsTotal = betterTiming.lapsRemaining + lapsCompleted;
								betterTiming.$timer.text(betterTiming.$timer.text() + ' (~' + betterTiming.lapsRemaining + 'L remain of '+ lapsTotal + 'L total)');
							}
						}
					} else {
						betterTiming.$timer.text('Complete');
						clearInterval(betterTiming.countdownTimer);
					}
				}
				betterTiming.countdown();
				if (StatusData['racestate'].toLowerCase() != "chk" && StatusData['racestate'].toLowerCase() != "off") {
					betterTiming.countdownTimer = setInterval(betterTiming.countdown, 1000);
				}
			break;
		};
	});
}

function convertSecondsToHMS(seconds) {
	var hours = Math.floor(seconds / 3600)
	, minutes = Math.floor(((seconds / 3600 ) % 1) * 60)
	;

	var seconds = seconds % 60;
	
	if (hours < 10) {
		hours = "0" + hours;
	}					
	if (minutes < 10) {
		minutes = "0" + minutes;
	}
	if (seconds < 10) {
		seconds = "0" + seconds;
	}
	
	return (hours + ':' + minutes + ':' + seconds);
}

function populateTableData(carData, $row) {
	var carClass = carData['category']
	, currentSector = carData['sector']
	;

	if ($row.attr('data-ident') === undefined) {
		$row.attr('data-ident', carData['id']);
	}

	$row.addClass(carClass);
	$row.find('.pb').removeClass('pb');
	$row.find('.ob').removeClass('ob');
	
	$row.find('[data-entry]').each(function() {
		var field = $(this).attr('data-entry')
		, $this = $(this)
		;
		$this.text(carData[field]);

		switch (field) {
			case 'number':
				$this.addClass(carClass);
				$this.attr('data-category', carClass);
			break;
			case 'categoryPosition':
			case 'team':
			case 'car':
			case 'tyre':
				$this.addClass(carClass);
			break;
			case 'state':
				$this[0].classList = 'car-state state-' + carData[field].toLowerCase();
				if (carData[field].toLowerCase() === "stop") {
					$row.addClass('car-state-stop');
				} else {
					$row.removeClass('car-state-stop');
				}
			break;
			case 'bestlap':
				var rowBestLap = moment(carData[field], ['hh:mm:ss.SSS' ,'mm:ss.SSS', 'ss.SSS']).format('mm:ss.SSS')

				if (rowBestLap <= betterTiming.bestLap) {
					betterTiming.$standingsTable.find('.ob[data-entry="bestlap"]').removeClass('ob');
					$this.addClass('ob');
					betterTiming.bestLap = rowBestLap;
				}
			break;
			case 'lastlap':
				if ($this.text() === "") {
					$this.html('&nbsp;');
				} else if ( carData[field] === carData['bestlap'] ) {
					$this.addClass('pb');
				};
			break;
			case 'gapPrev':
				$this.closest('td').removeClass('popcorn-time');
				var gapPrevString = carData[field];
				if ( parseFloat(gapPrevString, 10) < 1.5 && gapPrevString.indexOf(' ') === -1 && gapPrevString.indexOf(':') === -1) {
					$this.closest('td').addClass('popcorn-time');
				}
			break;
			case 'currentSector1':
				if ($this.text() === "") {
					$this.html('&nbsp;');
				} else {
					var bestSector1 = moment(carData['bestSector1'], ['hh:mm:ss.SSS' ,'mm:ss.SSS', 'ss.SSS']).format('mm:ss.SSS')
						, currentSector1 = moment(carData[field], ['hh:mm:ss.SSS' ,'mm:ss.SSS', 'ss.SSS']).format('mm:ss.SSS')

					if ( currentSector1 <= bestSector1 ) {
						$this.addClass('pb');
					}
				};
			break;
			case 'bestSector1':
				var currentSector1 = moment(carData[field], ['hh:mm:ss.SSS' ,'mm:ss.SSS', 'ss.SSS']).format('mm:ss.SSS')

				if ( currentSector1 <= betterTiming.bestSector1 ) {
					betterTiming.$standingsTable.find('.ob[data-entry="bestSector1"]').removeClass('ob');
					$this.addClass('ob');
					betterTiming.bestSector1 = currentSector1;
				};
			break;
			case 'currentSector2':
				if ($this.text() === "") {
					$this.html('&nbsp;');
				} else {
					var bestSector2 = moment(carData['bestSector2'], ['hh:mm:ss.SSS' ,'mm:ss.SSS', 'ss.SSS']).format('mm:ss.SSS')
						, currentSector2 = moment(carData[field], ['hh:mm:ss.SSS' ,'mm:ss.SSS', 'ss.SSS']).format('mm:ss.SSS')

					if ( currentSector2 <= bestSector2 ) {
						$this.addClass('pb');
					}
				};
			break;
			case 'bestSector2':
				var currentSector2 = moment(carData[field], ['hh:mm:ss.SSS' ,'mm:ss.SSS', 'ss.SSS']).format('mm:ss.SSS')

				if ( currentSector2 <= betterTiming.bestSector2 ) {
					betterTiming.$standingsTable.find('.ob[data-entry="bestSector2"]').removeClass('ob');
					$this.addClass('ob');
					betterTiming.bestSector2 = currentSector2;
				};
			break;
			case 'currentSector3':
				if ($this.text() === "") {
					$this.html('&nbsp;');
				} else {
					var bestSector3 = moment(carData['bestSector3'], ['hh:mm:ss.SSS' ,'mm:ss.SSS', 'ss.SSS']).format('mm:ss.SSS')
						, currentSector3 = moment(carData[field], ['hh:mm:ss.SSS' ,'mm:ss.SSS', 'ss.SSS']).format('mm:ss.SSS')

					if ( currentSector3 <= bestSector3 ) {
						$this.addClass('pb');
					}
				};
			break;
			case 'bestSector3':
				var currentSector3 = moment(carData[field], ['hh:mm:ss.SSS' ,'mm:ss.SSS', 'ss.SSS']).format('mm:ss.SSS')

				if ( currentSector3 <= betterTiming.bestSector3 ) {
					betterTiming.$standingsTable.find('.ob[data-entry="bestSector3"]').removeClass('ob');
					$this.addClass('ob');
					betterTiming.bestSector3 = currentSector3;
				};
			break;
		}
	});
	
	// sector progress indicator
	$row.find('.bar').css('width', '0');
	$row.find('[data-sector]').removeClass('recent').each(function() {
		if ($(this).attr('data-sector') == currentSector) {
			var $bar = $(this).find('.bar');
			$bar.text((parseFloat(carData['position']['percent'], 10) * 100));
			$bar.css('width', (parseFloat(carData['position']['percent'], 10) * 100) + '%');
			return;
		}
	});
	
	populateDriverData($row);
}

function populateDriverData($row) {
	if ($row.hasClass('expanded')) {
		var $driverDetail = $row.find('.driver-detail')
		, $driverDetailPopup = $driverDetail.find('.driver-detail-popup')
		, driverId = $driverDetail.find('[data-entry="driver_id"]').text()
		;

		var driverData = betterTiming.data.driversResult.find(o => o.driverID == driverId)
			;

		if (driverData != undefined) {
			if (driverData.lastLapDiff == undefined) {
				driverData.lastLapDiff = "-";
			}
					
			$driverDetailPopup.html('<table><thead>' +
				'<tr><th>Laps</th><th>Best Lap</th><th>Best Lap #</th><th>Last Lap Diff</th><th>Driving Time</th></tr></thead>' +
				'<tbody><tr>' +
				'<td>' + driverData.laps + '</td>' +
				'<td>' + driverData.bestLap + '</td>' +
				'<td>' + driverData.bestLapNumber + '</td>' +
				'<td>' + driverData.lastLapDiff + '</td>' +
				'<td>' + convertSecondsToHMS(driverData['drivingTime']) + '</td>' +
				'</tr></tbody></table>'
			);
		}
	}
}

function calculatePitStrategy() {
	var $pitstops = betterTiming.$standingsTable.find('[data-entry="pitstop"]')
	;

	for (var i = 1; i < $pitstops.length; i++) {
		// estimate next stops for each car
		var $this = $pitstops.eq(i)
		, $row = $this.closest('tr')
		, $cell = $this.closest('.car-pitstops')
		, $estimate = $cell.find('[data-calc="pit-estimate"]')
		, $remaining = $cell.find('[data-calc="pit-remaining"]')
		, pitstops = parseInt($this.text(), 10)
		, carId = $row.data('ident')
		, pitstopData = $cell.attr('pitstops')
		, carCurrentLap = $row.find('.car-lap-count').text()
		;
		
		// if on in in lap, record it
		if (carCurrentLap > 0 && $row.find('.state-in').length > 0) {
			if (pitstopData !== undefined) {
				pitstopData = pitstopData.split(',');
				if (pitstopData.indexOf(carCurrentLap) === -1 && pitstopData[pitstopData.length - 1] != carCurrentLap - 1) {
					pitstopData.push(carCurrentLap);
				}
			} else {
				pitstopData = [carCurrentLap];
			}
			$cell.attr('pitstops', pitstopData);
			localStorage.setItem(carId, pitstopData);
			pitstops++;
			updateMedianStint($cell);
		}


		if (pitstops > 0 && betterTiming.lapsRemaining < 600) {
			pitstopData = $cell.attr('pitstops')
			if (pitstopData !== undefined) {
				pitstopData = pitstopData.split(',');
			
				var lastStopLap = parseInt(pitstopData.pop(), 10)
					, lapsSinceLast = parseInt(carCurrentLap, 10) - lastStopLap
					,  medianStint = $cell.attr('median-stint')
					;

				if (lapsSinceLast < 0) {
					lapsSinceLast = 0;
				}

				if (medianStint != "NaN") {

					var medianStint = parseInt(medianStint, 10)
						, lapsUntilNext = medianStint - lapsSinceLast
						, remainingStops = Math.floor(betterTiming.lapsRemaining / medianStint)
						;

					if (lapsUntilNext < 0) {
						lapsUntilNext = 0;
					}

					if (remainingStops < 1) {
						// probably no more stops!
						$remaining.text('No stops left!')
						$estimate.text('');
						$cell.removeClass('imminent');
					} else {
						$remaining.text("Next: " + lapsUntilNext + "L");
						$estimate.text("Median: " + medianStint + "L");
						if (lapsUntilNext <= 1) {
							$cell.addClass('imminent');
						} else {
							$cell.removeClass('imminent');
						}
					}
				}
			}
		}
	}
}

// observe ajax requests and add response to body
function interceptData() {
	var xhrOverrideScript = document.createElement('script');
	xhrOverrideScript.type = 'text/javascript';
	xhrOverrideScript.src = chrome.runtime.getURL("piggyback.js");
	document.getElementsByTagName('head')[0].appendChild(xhrOverrideScript);
}

// once body and head are available, inject script
function checkForDOM() {
	if (document.body && document.head) {
		var dataDOMElement = document.createElement('div');
		dataDOMElement.id = '__interceptedData';
		dataDOMElement.style.height = 0;
		dataDOMElement.style.overflow = 'hidden';
		document.body.appendChild(dataDOMElement);

		interceptData();
		enhance();
	} else {
		requestIdleCallback(checkForDOM);
	}
}
requestIdleCallback(checkForDOM);

// watch for intercepted data to be available
function scrapeData() {
	var responseContainingEle = document.getElementById('__interceptedData');
	if (responseContainingEle) {
		try {
			updateData(JSON.parse(responseContainingEle.innerHTML));
		} catch(e) {
			console.log("error parsing JSON data. " + e);
		}
	} else {
		requestIdleCallback(scrapeData);
	}
}
requestIdleCallback(scrapeData);
