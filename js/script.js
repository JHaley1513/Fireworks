// if false: fireworks color starts with a default color and gradually changes with each launch
var randomColors = false; 
// if true: launch fireworks from random spots along the bottom of the screen, false: always launch from the bottom middle.
var randomLaunchPosition = true;

var progressBar = document.getElementById('progress-bar');
var mainCanvas = document.getElementById('main-canvas');
var audioSamples = ["audio/fireworks1.wav",
                    "audio/fireworks3.wav",
                    "audio/fireworks5.wav",
                    "audio/fireworks7.wav"
];

var contexts = [];
var sources = [];
var panners = [];

// Add padding above the text to make it appear at bottom of screen. (left/right and bottom padding are 0)
var text = document.getElementById('text');
text.padding = window.innerHeight - 180 + "px 0 0";

var baseSize = 1.0;  // size of fireworks. increases every time you fill up the progress bar

// Create multiple audio contexts and panners, allows playing multiple audio files simultaneously
for (let i = 0; i < 6; i++){
	newContextAndPanner(i);
}

resetProgressBar(); // sets progress bar maximum to a random value between 5 and 15
console.log('Initialized.');

function getAudioElement(idx) {
	elementName = "boom" + idx;
	return document.getElementById(elementName);
}

function newContextAndPanner(idx) {
	let audioElement = getAudioElement(idx);
	let ctx = new AudioContext();
	let src = ctx.createMediaElementSource(audioElement);
	let pan = ctx.createStereoPanner();
	src.connect(pan);
	pan.connect(ctx.destination);

	// prevent garbage collection
	contexts.push(ctx);
	sources.push(src);
	panners.push(pan);
}

function setPanning(xPos, idx=0) {
	let panPosition = xPos / canvas.width; // this gives us a number from 0 to 1; we want a number from -1 to 1.
	panPosition = (panPosition*2) - 1;
	panners[idx].pan.value = panPosition;
}
  
function loadAudioSample(idx=0) {
	let i = Math.floor(Math.random() * audioSamples.length);
	console.log(i);
	getAudioElement(idx).src = audioSamples[i];
}

function explosionSound(xPos, idx=0) {
	setPanning(xPos);
	let audioElement = getAudioElement(idx);
	loadAudioSample(idx);
	audioElement.play();
}

function randomFireworks() {
	for (let i = 0; i < contexts.length; i++){
		// generate random locations within height and width of Canvas element
		let x = random(0, cw);
		let y = random(0, ch/2);
		fireworks.push(new Firework(cw/2, ch, x, y));
		explosionSound(x, i);
	}
}

function incrementProgressBar() {
	progressBar.value++;
}

function progressBarFull() {
	return progressBar.value >= progressBar.max - 1; // Reset progress bar when it's about to be filled up
}

// Clear progress bar, set maximum to a random value, increase size of fireworks
function resetProgressBar() {
	progressBar.value = 0;
	progressBar.max = (Math.random() * 10) + 5;
	baseSize *= 1.2;
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////// all the code below this line, except for calls to the above functions, is from https://codepen.io/whqet/pen/Auzch ////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// when animating on canvas, it is best to use requestAnimationFrame instead of setTimeout or setInterval
// not supported in all browsers though and sometimes needs a prefix, so we need a shim
window.requestAnimFrame = ( function() {
	return window.requestAnimationFrame ||
				window.webkitRequestAnimationFrame ||
				window.mozRequestAnimationFrame ||
				function( callback ) {
					window.setTimeout( callback, 1000 / 60 );
				};
})();

// now we will setup our basic variables for the demo
var canvas = document.getElementById( 'main-canvas' ),
		ctx = canvas.getContext( '2d' ),
		// full screen dimensions
		cw = window.innerWidth,
		ch = window.innerHeight,
		// firework collection
		fireworks = [],
		// particle collection
		particles = [],
		// starting hue
		hue = random(0, 360),
		// when launching fireworks with a click, too many get launched at once without a limiter, one launch per 5 loop ticks
		limiterTotal = 5,
		limiterTick = 0,
		// this will time the auto launches of fireworks, one launch per 80 loop ticks
		timerTotal = 80,
		timerTick = 0,
		mousedown = false,
		// mouse x coordinate,
		mx,
		// mouse y coordinate
		my;

// set canvas dimensions
canvas.width = cw;
canvas.height = ch - 130;

// now we are going to setup our function placeholders for the entire demo

// get a random number within a range
function random( min, max ) {
	return Math.random() * ( max - min ) + min;
}

// calculate the distance between two points
function calculateDistance( p1x, p1y, p2x, p2y ) {
	var xDistance = p1x - p2x,
			yDistance = p1y - p2y;
	return Math.sqrt( Math.pow( xDistance, 2 ) + Math.pow( yDistance, 2 ) );
}

// create firework
function Firework( sx, sy, tx, ty ) {
	// actual coordinates
	this.x = sx;
	this.y = sy;
	// starting coordinates
	this.sx = sx;
	this.sy = sy;
	// target coordinates
	this.tx = tx;
	this.ty = ty;
	// distance from starting point to target
	this.distanceToTarget = calculateDistance( sx, sy, tx, ty );
	this.distanceTraveled = 0;
	// track the past coordinates of each firework to create a trail effect, increase the coordinate count to create more prominent trails
	this.coordinates = [];
	this.coordinateCount = 3;
	// populate initial coordinate collection with the current coordinates
	while( this.coordinateCount-- ) {
		this.coordinates.push( [ this.x, this.y ] );
	}
	this.angle = Math.atan2( ty - sy, tx - sx );
	this.speed = 2;
	this.acceleration = 1.05;
	this.brightness = random( 50, 70 );
	// circle target indicator radius
	this.targetRadius = 1;
}

// update firework
Firework.prototype.update = function( index ) {
	if (progressBarFull()) {
		incrementProgressBar();
		randomFireworks();
		resetProgressBar();
	}
	else {
		// remove last item in coordinates array
		this.coordinates.pop();
		// add current coordinates to the start of the array
		this.coordinates.unshift( [ this.x, this.y ] );

		// cycle the circle target indicator radius
		if( this.targetRadius < 8 ) {
			this.targetRadius += 0.3;
		} else {
			this.targetRadius = 1;
		}

		// speed up the firework
		this.speed *= this.acceleration;

		// get the current velocities based on angle and speed
		var vx = Math.cos( this.angle ) * this.speed,
				vy = Math.sin( this.angle ) * this.speed;
		// how far will the firework have traveled with velocities applied?
		this.distanceTraveled = calculateDistance( this.sx, this.sy, this.x + vx, this.y + vy );

		// if the distance traveled, including velocities, is greater than the initial distance to the target, then the target has been reached
		if( this.distanceTraveled >= this.distanceToTarget ) {
			createParticles( this.tx, this.ty );
			// remove the firework, use the index passed into the update function to determine which to remove
			fireworks.splice( index, 1 );
			explosionSound(this.tx);
			incrementProgressBar();
		} else {
			// target not reached, keep traveling
			this.x += vx;
			this.y += vy;
		}
	}
}

// draw firework
Firework.prototype.draw = function() {
	ctx.beginPath();
	// move to the last tracked coordinate in the set, then draw a line to the current x and y
	ctx.moveTo( this.coordinates[ this.coordinates.length - 1][ 0 ], this.coordinates[ this.coordinates.length - 1][ 1 ] );
	ctx.lineTo( this.x, this.y );
	ctx.strokeStyle = 'hsl(' + hue + ', 100%, ' + this.brightness + '%)';
	ctx.stroke();

	ctx.beginPath();
	// draw the target for this firework with a pulsing circle
	ctx.arc( this.tx, this.ty, this.targetRadius, 0, Math.PI * 2 );
	ctx.stroke();
}

// create particle
function Particle( x, y ) {
	this.x = x;
	this.y = y;
	// track the past coordinates of each particle to create a trail effect, increase the coordinate count to create more prominent trails (default: 5)
	this.coordinates = [];
	this.coordinateCount = 5;
	while( this.coordinateCount-- ) {
		this.coordinates.push( [ this.x, this.y ] );
	}
	// set a random angle in all possible directions, in radians
	this.angle = random( 0, Math.PI * 2 );
	this.speed = random( 1, 10 );
	// friction will slow the particle down (default: 0.95)
	this.friction = 0.95;
	// gravity will be applied and pull the particle down (default: 1)
	this.gravity = 1.;
	// set the hue to a random number +-50 of the overall hue variable
	this.hue = random( hue - 50, hue + 50 );
	this.brightness = random( 50, 80 );
	this.alpha = 1;
	// set how fast the particle fades out (higher number = faster)
	this.decay = random( 0.003, 0.018 );
}

// update particle
Particle.prototype.update = function( index ) {
	// remove last item in coordinates array
	this.coordinates.pop();
	// add current coordinates to the start of the array
	this.coordinates.unshift( [ this.x, this.y ] );
	// slow down the particle
	this.speed *= this.friction;
	// apply velocity
	this.x += Math.cos( this.angle ) * this.speed;
	this.y += Math.sin( this.angle ) * this.speed + this.gravity;
	// fade out the particle
	this.alpha -= this.decay;

	// remove the particle once the alpha is low enough, based on the passed in index
	if( this.alpha <= this.decay ) {
		particles.splice( index, 1 );
	}
}

// draw particle
Particle.prototype.draw = function() {
	ctx. beginPath();
	// move to the last tracked coordinates in the set, then draw a line to the current x and y
	ctx.moveTo( this.coordinates[ this.coordinates.length - 1 ][ 0 ], this.coordinates[ this.coordinates.length - 1 ][ 1 ] );
	ctx.lineTo( this.x, this.y );
	ctx.strokeStyle = 'hsla(' + this.hue + ', 100%, ' + this.brightness + '%, ' + this.alpha + ')';
	ctx.stroke();
}

// create particle group/explosion
function createParticles( x, y ) {
	// increase the particle count for a bigger explosion (default: 30), beware of the canvas performance hit with the increased particles though
	var particleCount = Math.floor(((Math.random() * 20) + 20) * baseSize);
	while( particleCount-- ) {
		particles.push( new Particle( x, y ) );
	}
}

// main demo loop
function loop() {
	// this function will run endlessly with requestAnimationFrame
	requestAnimFrame( loop );

	if(randomColors) {
    	hue = random(0, 360);
	} else {
		// increase the hue to get different colored fireworks over time
		hue += 0.5;
	}
    
	// normally, clearRect() would be used to clear the canvas
	// we want to create a trailing effect though
	// setting the composite operation to destination-out will allow us to clear the canvas at a specific opacity, rather than wiping it entirely
	ctx.globalCompositeOperation = 'destination-out';
	// decrease the alpha property to create more prominent trails
	ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
	ctx.fillRect( 0, 0, cw, ch );
	// change the composite operation back to our main mode
	// lighter creates bright highlight points as the fireworks and particles overlap each other
	ctx.globalCompositeOperation = 'lighter';

	// loop over each firework, draw it, update it
	var i = fireworks.length;
	while( i-- ) {
		fireworks[ i ].draw();
		fireworks[ i ].update( i );
	}

	// loop over each particle, draw it, update it
	var i = particles.length;
	while( i-- ) {
		particles[ i ].draw();
		particles[ i ].update( i );
	}

	// launches fireworks automatically to random coordinates, when the mouse isn't down
	// if( timerTick >= timerTotal ) {
	// 	if( !mousedown ) {
	// 		// start the firework at the bottom middle of the screen, then set the random target coordinates, the random y coordinates will be set within the range of the top half of the screen
	// 		fireworks.push( new Firework( cw / 2, ch, random( 0, cw ), random( 0, ch / 2 ) ) );
	// 		timerTick = 0;
	// 	}
	// } else {
	// 	timerTick++;
	// }

	// limit the rate at which fireworks get launched when mouse is down
	if( limiterTick >= limiterTotal ) {
		if( mousedown ) {
			
			if (randomLaunchPosition) {
				// launch firework from random position along bottom of screen
				let x = Math.floor(Math.random() * cw);
				fireworks.push( new Firework( x, ch, mx, my ) );
			} else {
				// start the firework at the bottom middle of the screen, then set the current mouse coordinates as the target
				fireworks.push( new Firework( cw / 2, ch, mx, my ) );
			}
			limiterTick = 0;
		}
	} else {
		limiterTick++;
	}
}

// mouse event bindings
// update the mouse coordinates on mousemove
canvas.addEventListener( 'mousemove', function( e ) {
	mx = e.pageX - canvas.offsetLeft;
	my = e.pageY - canvas.offsetTop;
});

// toggle mousedown state and prevent canvas from being selected
canvas.addEventListener( 'mousedown', function( e ) {
	e.preventDefault();
	mousedown = true;
});

canvas.addEventListener( 'mouseup', function( e ) {
	e.preventDefault();
	mousedown = false;
});

// once the window loads, we are ready for some fireworks!
window.onload = loop;
