let audioContext;
let addColBuffer;

/**
 * Initializes the Web Audio API context and loads the sound file.
 */
export function initAudio() {
    // Create context on first call
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    // Load the sound effect
    fetch('add-col.mp3')
        .then(response => response.arrayBuffer())
        .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer))
        .then(decodedData => {
            addColBuffer = decodedData;
        })
        .catch(error => console.error('Error loading sound:', error));
}

/**
 * Plays the 'add col' sound effect.
 */
export function playAddSound() {
    if (!audioContext || !addColBuffer) return;
    
    // Resume context on user gesture if needed (e.g., after page load)
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }

    const source = audioContext.createBufferSource();
    source.buffer = addColBuffer;
    source.connect(audioContext.destination);
    source.start(0);
}