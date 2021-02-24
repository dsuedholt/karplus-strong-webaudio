class CircularBuffer
{
    constructor(size)
    {
        this.buffer = new Array(size).fill(0);
        this.size = size;
    }

    read(idx)
    {
        while (idx < 0) idx += this.size;
        return this.buffer[idx % this.size];
    }

    write(idx, val)
    {
        this.buffer[idx % this.size] = val;
    }
}

class BasicKSProcessor extends AudioWorkletProcessor 
{

    constructor(options)
    {
        super(options);
        this.buffer = new CircularBuffer(1000);
        this.bufIdx = 0;
        this.playing = true;

        this.port.onmessage = (e) => {
            if (e.data === 'stop')
                this.playing = false;
        }
    }

    static get parameterDescriptors () {
        return [
            {
                name: 'period', 
                defaultValue: 101,
                minValue: 0, 
                maxValue: 20000,
                automationRate: 'a-rate'
            },
        ]
    } 

    process (inputs, outputs, parameters)
    {
        const input = inputs[0][0];
        const output = outputs[0][0];
        
        for (let i = 0; i < output.length; i++) 
        {
            output[i] = input ? input[i] : 0;
            let period = parameters['period'].length > 1 ? parameters['period'][i] : parameters['period'][0] ;
            output[i] += 0.995 * (0.5 * this.buffer.read(i + this.bufIdx - period) + 0.5 * this.buffer.read(i + this.bufIdx - period - 1));
            this.buffer.write(this.bufIdx + i, output[i]);
        }
        this.bufIdx += output.length;
        return this.playing;
    }
}

registerProcessor('basic-ks-processor', BasicKSProcessor)