let AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx;
let fs;
let ksNode;
let source;
let freq;
let period;
let allpassTuningC;

async function init() {
    audioCtx = new AudioContext();
    fs = audioCtx.sampleRate;
    await audioCtx.audioWorklet.addModule('basic-ks-processor.js');
    updateFreq(400);
}

function updateFreq(f)
{
    freq = f;

    let true_period = fs / freq;
    let omegaNorm = 2 * Math.PI * freq / fs; 

    // can replace 0.5 by a stretching factor S, see eq. 22
    let lowpassPhaseDelay = -Math.atan(-0.5 * Math.sin(omegaNorm) / (0.5 + 0.5 * Math.cos(omegaNorm))) / omegaNorm;
    period = Math.floor(true_period - lowpassPhaseDelay - 1e-6);
    let allpassPhaseDelay = true_period - period - lowpassPhaseDelay;
    // eq. 16
    allpassTuningC = Math.sin(0.5 * omegaNorm - 0.5 * omegaNorm * allpassPhaseDelay) / Math.sin(0.5 * omegaNorm + 0.5 * omegaNorm * allpassPhaseDelay);

    if (ksNode)
    {
        ksNode.parameters.get('period').value = period;
        ksNode.parameters.get('allpassTuningC').value = allpassTuningC;
    }
}

async function play()
{
    if (!audioCtx) await init();

 
    const buffer = audioCtx.createBuffer(1, fs, fs);
    const bufferData = buffer.getChannelData(0);
 
    ksNode = new AudioWorkletNode(audioCtx, 'basic-ks-processor');

    for (var i = 0; i < period; i++)
    {
        bufferData[i] = (2 * Math.random() - 1);
    }
 
    source = audioCtx.createBufferSource();
    source.buffer = buffer;
    
    source.connect(ksNode);
    ksNode.connect(audioCtx.destination);

    ksNode.parameters.get('period').value = period;
    ksNode.parameters.get('allpassTuningC').value = allpassTuningC;

    source.start();
}

function stop()
{
    ksNode.port.postMessage('stop');
    source.disconnect();
    ksNode.disconnect();

    delete ksNode;
}