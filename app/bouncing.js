let timeoutId;

function callFunction(param) {
    // Clear the previous timeout
    clearTimeout(timeoutId);

    // Set a new timeout to call the function after 1000 ms
    timeoutId = setTimeout(() => {
        // Call the function with the parameter
        text2speech({"inputs": param}).then((response) => {
            var url = URL.createObjectURL(response);
            var a = new Audio(url);
            a.play();
        });
    }, 1000);
}