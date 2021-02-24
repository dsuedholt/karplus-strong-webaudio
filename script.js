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

    period_sec = 1 / freq;
    period_samp = Math.ceil(fs / freq);
 
    buffer = audioCtx.createBuffer(1, fs, fs);
    bufferData = buffer.getChannelData(0);
 
    for (var i = 0; i < period_samp; i++)
    {
        bufferData[i] = (2 * Math.random() - 1);
    }
 
    const source = audioCtx.createBufferSource();
    source.buffer = buffer;

    ksNode = new AudioWorkletNode(audioCtx, 'basic-ks-processor');

    source.connect(ksNode);
    ksNode.connect(audioCtx.destination);

    const periodParam = ksNode.parameters.get('period');
    periodParam.setValueAtTime(period_samp, audioCtx.currentTime)

    source.start();
}

function stop()
{
    ksNode.port.postMessage('stop');
}