// watch for intercepted data to be available
function scrapeData() {
    var responseContainingEle = document.getElementById('__interceptedData');
		//console.log(responseContainingEle);
    if (responseContainingEle) {
				//console.log(responseContainingEle.innerText);
				if (responseContainingEle.innerHTML !== "") {
					updateData(JSON.parse(responseContainingEle.innerHTML));
				}
    } else {
        requestIdleCallback(betterTiming.scrapeData);
    }
}
requestIdleCallback(scrapeData);