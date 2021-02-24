let AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx;
let fs;
let ksNode;

async function init() {
    audioCtx = new AudioContext();
    fs = audioCtx.sampleRate;
    await audioCtx.audioWorklet.addModule('basic-ks-processor.js');
}

async function play(freq)
{
    if (!audioCtx) await init();

    let true_period = fs / freq;
 
    const buffer = audioCtx.createBuffer(1, fs, fs);
    const bufferData = buffer.getChannelData(0);
 

    ksNode = new AudioWorkletNode(audioCtx, 'basic-ks-processor');

    let omegaNorm = 2 * Math.PI * freq / fs; 

    // can replace 0.5 by a stretching factor S, see eq. 22
    let lowpassPhaseDelay = -Math.atan(-0.5 * Math.sin(omegaNorm) / (0.5 + 0.5 * Math.cos(omegaNorm))) / omegaNorm;
    let period = Math.floor(true_period - lowpassPhaseDelay - 1e-6);
    let allpassPhaseDelay = true_period - period - lowpassPhaseDelay;
    
    // eq. 16
    let allpassTuningC = Math.sin(0.5 * omegaNorm - 0.5 * omegaNorm * allpassPhaseDelay) / Math.sin(0.5 * omegaNorm + 0.5 * omegaNorm * allpassPhaseDelay);
    console.log(allpassTuningC);
    // eq. 12
    const allpassTuner = new IIRFilterNode(audioCtx, {feedforward: [allpassTuningC, 1], feedback: [1, allpassTuningC]});

    for (var i = 0; i < period; i++)
    {
        bufferData[i] = (2 * Math.random() - 1);
    }
 
    const source = audioCtx.createBufferSource();
    source.buffer = buffer;
    
    source.connect(ksNode);
    ksNode.connect(allpassTuner);
    allpassTuner.connect(audioCtx.destination);

    ksNode.parameters.get('period').value = period;

    source.start();
}

function stop()
{
    ksNode.port.postMessage('stop');
}