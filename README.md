**As the FIA timing website has been redesigned, this extension no longer works (and isn't as necessary as the site is vastly improved). I've removed the extensions from the stores, but will leave the repo as an archive. And as always, check [timing71.org](https://www.timing71.org/) for all your timing needs!**

# Better Timing Extension

1. Install the appropriate extension:
* [Chrome (including Opera, Chromium Edge)](https://chrome.google.com/webstore/detail/better-timing-for-no-race/ollaocbeemghkmkbepdkcgcbigegbcjc)
* [Firefox (including mobile)](https://addons.mozilla.org/en-US/firefox/addon/better-timing-for-no-race/)
2. Go to the [fiawec.com](fiawec.com) live timing page.
3. Click "Toggle" on the top right of the page to switch between the default view and Better Timing view.

It should look something like this:
![screenshot](https://lh3.googleusercontent.com/6dTzXcR7JbM33IXMMTuRrqJbErEgq3oft3QrBHFrFuWJCJhuank1HxtOcSb7IPZdDDP34tU3B1Q=w9640-h9400-e365)

If there is no current live race and you want to test the extension, go to (https://hankscorpio83.github.io/) and see test data cycle through. 

# Features
- Entire timing table is sortable (click on the desired column to sort)
- Estimated laps remaning
- Click on a row to show extra information like driver details (personal best lap, laps/time driven), car information (make/model, tires), best sector/lap times, extra timing detail (previous gap, interval, best sector/lap times, and a very crude and likely incorrect guess at how many pit stops remain)
- Sector times detail

# What Am I Looking At?
|Term|Definition|Notes|
|---|---|---|
|Pos|Position|Overall position (in all classes)|
|Num|Car Number|The number of the car|
|PIC|Position in Class|Position in own class|
|Status|Car Status|(See the next table)|
|Gap|Gap to Leader|Time behind the overall leader|
|Int|Interval|Time behind the next car in class|

|Term|Definition|
|---|---|
|Run|Car is currently running on track.|
|In|Pit in. Car is in the pits|
|Out|Pit out. Car left the pits this lap|
|Off|Car is off track. Usually indicates the car has stopped on track due to a technical issue or accident.|
|Stop|Car has stopped and is out of the race.|

# Technical Details

This extension simply lays out the live timing information in a different way. Nothing is saved or stored, so there is no ability to rewind, adjust timing to sync with your video, etc. This is intentional to avoid the ACO/WEC from claiming it is an illegal use of their data. Unfortunate, but that's how it goes.

A basic outline of how it works:
- We build an overlay that simply covers the website with a new timing table.
- We extend the native XHR load function to watch AJAX requests for the live timing JSON and copy the data to a hidden container on the page.
- We use a mutation observer to watch the hidden container and update the data on the timing table whenever the contents change.
- As part of the update process, we also do the calculations and checks to estimate the laps remainig, highlight personal best sector and lap times, etc.
