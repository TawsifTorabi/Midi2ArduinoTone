var myTextarea = document.getElementById("ResultsText");

// Initialize CodeMirror instance
var editor = CodeMirror.fromTextArea(myTextarea, {
    mode: "text/x-c++src",
    lineNumbers: true,
    theme: "abcdef",   //dracula, abcdef, ambiance
    lineWrapping: true
});

if (!(window.File && window.FileReader && window.FileList && window.Blob)) {
    document.querySelector("#FileDrop #Text").textContent = "Reading files not supported by this browser";
    notificator("Change The Browser! 🥱", true);
} else {
    const fileDrop = document.querySelector("#FileDrop");

    fileDrop.addEventListener("dragenter", () => fileDrop.classList.add("Hover"));

    fileDrop.addEventListener("dragleave", () => fileDrop.classList.remove("Hover"));

    fileDrop.addEventListener("drop", () => fileDrop.classList.remove("Hover"));

    document.querySelector("#FileDrop input").addEventListener("change", (e) => {
        const files = e.target.files;
        if (files.length > 0) {
            const file = files[0];
            document.querySelector("#FileDrop #Text").textContent = file.name;
            parseFile(file);
            notificator("Input Taken... 🎉", true);
        }
    });
}

let currentMidi = null;
let synths = [];
let playing = false;
let midiFileName = "";

function parseFile(file) {
    const reader = new FileReader();
    reader.onload = function (e) {
        const midi = new Midi(e.target.result);
        midiFileName = file.name.split('.').slice(0, -1).join('.') + ".ino";
        editor.setValue(generateArduinoCode(midi));
        document.querySelector("#PlayButton").removeAttribute("disabled");
        document.querySelector("#DownloadButton").removeAttribute("disabled");
        document.querySelector("#CopyButton").removeAttribute("disabled");
        currentMidi = midi;
    };
    reader.readAsArrayBuffer(file);
}

function generateArduinoCode(midi) {
    let arduinoCode = `
void song(int buzzerPin) {
`;

    midi.tracks.forEach(track => {
        let lastNoteEndTime = 0;
        track.notes.forEach(note => {
            const frequency = Math.round(Tone.Frequency(note.name).toFrequency());
            const startTime = Math.round(note.time * 1000);
            const duration = Math.round(note.duration * 1000);
            const gapDuration = startTime - lastNoteEndTime;

            if (gapDuration > 0) {
                arduinoCode += `
  delay(${gapDuration});
`;
            }

            arduinoCode += `
  tone(buzzerPin, ${frequency});
  delay(${duration});
  noTone(buzzerPin);
`;

            lastNoteEndTime = startTime + duration;
        });
    });

    arduinoCode += `
}

void setup() {
  song(11);  // Change the pin number as needed
}

void loop() {
  // Empty loop
}
`;
    return arduinoCode;
}

document.querySelector("#PlayButton").addEventListener("click", () => {
    if (playing) {
        // Stop playing
        synths.forEach(synth => synth.disconnect());
        synths = [];
        document.querySelector("#PlayButton").innerHTML = '<img title="Play Audio" style="height: 28px;" src="asset/play.png" alt="Play Audio" srcset="">';
        playing = false;
        notificator("Okay, Okay... 💨", true);
    } else {
        // Start playing
        if (currentMidi) {
            const now = Tone.now() + 0.5;
            currentMidi.tracks.forEach((track) => {
                const synth = new Tone.PolySynth(Tone.Synth, {
                    envelope: {
                        attack: 0.02,
                        decay: 0.1,
                        sustain: 0.3,
                        release: 1,
                    },
                }).toDestination();
                synths.push(synth);
                track.notes.forEach((note) => {
                    synth.triggerAttackRelease(note.name, note.duration, note.time + now, note.velocity);
                });
            });
            document.querySelector("#PlayButton").innerHTML = '<img title="Stop Audio" style="height: 28px;" src="asset/stop.png" alt="Stop Audio" srcset="">';
            notificator("I'm Playing.... 🙌", true);
            playing = true;
        }
    }
});

document.querySelector("#DownloadButton").addEventListener("click", () => {
    const textToSave = editor.getValue();
    const blob = new Blob([textToSave], { type: "text/plain" });
    const link = document.createElement("a");
    link.download = midiFileName;
    link.href = URL.createObjectURL(blob);
    link.click();
    URL.revokeObjectURL(link.href);
    notificator("File Created! ⚡", true);
});

document.querySelector("#CopyButton").addEventListener("click", () => {
    const textToCopy = editor.getValue();
    navigator.clipboard.writeText(textToCopy).then(() => {
        notificator("Code copied to clipboard! ✌", true);
    }).catch(err => {
        notificator("🤦‍♂️ Failed to copy text: " + err, true);
    });
});

// Disable buttons if textarea is empty
editor.on("change", () => {
    const code = editor.getValue();
    if (code.trim() === "") {
        document.querySelector("#DownloadButton").setAttribute("disabled", "true");
        document.querySelector("#CopyButton").setAttribute("disabled", "true");
    } else {
        document.querySelector("#DownloadButton").removeAttribute("disabled");
        document.querySelector("#CopyButton").removeAttribute("disabled");
    }
});

// Notificator
function notificator(txt, bool){
    let elem = document.getElementById('notificationText');
    let container = document.getElementById('notificationContainer');
    elem.innerHTML = txt;
    container.style.display = "inherit";
    clearTimeout(timeoutId);
    if(bool == true){
        var timeoutId = window.setTimeout(function(){
            elem.innerHTML = 'What did you think huh? 😂';
            container.style.display = "none";    
        }, 2500);
    }
}

function fetchMidiFromURL(url) {
    fetch(url)
        .then(response => response.arrayBuffer())
        .then(data => {
            const midi = new Midi(data);
            editor.setValue(generateArduinoCode(midi));
            document.querySelector("#PlayButton").removeAttribute("disabled");
            document.querySelector("#DownloadButton").removeAttribute("disabled");
            document.querySelector("#CopyButton").removeAttribute("disabled");
            currentMidi = midi;
            midiFileName = extractFileNameFromURL(url).replace(/\.[^/.]+$/, "") + ".ino";

            document.querySelector("#FileDrop #Text").textContent = extractFileNameFromURL(url).replace(/\.[^/.]+$/, "");
            notificator("Input Taken from URL... 🎉", true);
            if(playing){
                document.querySelector("#PlayButton").click();
            }
        })
        .catch(error => {
            console.error('Error fetching MIDI file:', error);
            notificator('Failed to load MIDI file from URL. 😫', true);
        });
}

function extractFileNameFromURL(url) {
    const urlParts = url.split('/');
    return urlParts[urlParts.length - 1];
}


// Fetch the JSON file and process it
fetch('midilist.json')
.then(response => response.json())
.then(data => {
    // Get the <ul> element
    const ul = document.getElementById('trackList');

    // Create <li> elements and append to the <ul>
    data.forEach(track => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.textContent = track.TrackName;
        a.href = `midi/${track.FileName}`;
        a.onclick = (event) => {
            event.preventDefault(); // Prevent default link behavior
            fetchMidiFromURL(a.href); // Call the function with the URL
        };
        li.appendChild(a);
        ul.appendChild(li);
    });
})
.catch(error => console.error('Error fetching the JSON file:', error));