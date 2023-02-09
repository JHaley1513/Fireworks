## What it's about
This is an interactive point-and-click [game](https://jhaley1513.github.io/Fireworks/).<br>
Launch fireworks, fill up a progress bar, and try not to go deaf from the resulting explosions.<br>
(Just kidding...mostly)

## How I built it
- I repurposed the animations from this script: https://codepen.io/whqet/pen/Auzch
- I took the script, changed the fireworks events to trigger only on clicks, and tied them to a progress bar.
- When the bar is filled, multiple fireworks are launched to random locations, and the size of subsequent fireworks is increased.
- Every launch triggers an audio file, panned to the launch location. I used multiple audio elements and contexts for playing multiple audio files simultaneously.

## If I had more time I would add these options to the UI
- Random vs progressive coloring
- Preferred colors
- Random vs fixed launch location
- Gravity / decay amounts (how large the fireworks get and how quickly they fall to earth)
- Add dynamic padding above the progress bar & text - as it is, vertically resizing the window moves them out of frame.
