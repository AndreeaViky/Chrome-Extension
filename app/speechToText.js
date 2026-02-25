let mediaRecorder;
let chunks = [];

async function startRecording() {
    console.log('start recording');
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.ondataavailable = event => {
        chunks.push(event.data);
    };
    mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { 'type': 'mp3' });
        speech2text(blob).then((result) => {
            console.log(result);
            const number = result.text.match(/\d+/);
            console.log(number);
            // number = textToNumber(number);
            if (number) {
                tabToIndex(number[0]);
            }
        });
        chunks = [];
    };
    mediaRecorder.start();
}

function stopRecording() {
    console.log('stop recording');
    mediaRecorder.stop();
}

document.addEventListener('keydown', handleKeyPress);

function handleKeyPress(event) {
    if (event.key === 'z' && event.ctrlKey === true) {
        if (mediaRecorder && mediaRecorder.state === 'recording') {
            stopRecording();
        } else {
            startRecording();
        }
    }
}


async function speech2text(data) {
	const response = await fetch(
		"https://api-inference.huggingface.co/models/openai/whisper-large-v3",
		{
			headers: { Authorization: "Bearer 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" },
			method: "POST",
			body: data,
		}
	);
	const result = await response.json();

	return result;
}


function tabToIndex(index) {
    const elementsWithTabIndex = document.querySelectorAll('[data-tabindex]');

    if (elementsWithTabIndex.length === 0) {
        console.log('No elements with tabindex');
        return;
    }

    const element = elementsWithTabIndex[index-1];

    if (element) {
        element.focus();
        let index = element.getAttribute('data-tabindex');
        let parsed = index + ": " +parserHTML(element);
        console.log(parsed);
        text2speech({"inputs": parsed}).then((response) => {
          var url = URL.createObjectURL(response);
          var a = new Audio(url);
          a.play();
      });
    }
}