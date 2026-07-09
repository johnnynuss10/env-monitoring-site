//let msgOut = "ESP32_ad025C"
let msgOut = null 
let visibleNodes = [];
async function displayCustomText(){
    
    // take msgOut and send it to aws lambda
    const payload = {
        name: msgOut
    };

    // fetch request here using POST method
    try{
        const response = await fetch("https://h96c190k3i.execute-api.us-east-1.amazonaws.com/POST", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok){
            throw new Error(`Response status: ${response.status}`);
    }
        const result = await response.json();
        // identify nodes in response
        document.getElementById("output").textContent =
            result.device.latest_telemetry.tempC;
        console.log(result);

    } catch (error) {
        console.error(error);
    }
}

// print when submit button pressed
function printTextBox(){
    document.getElementById("submitButton").addEventListener("click", function() {
        msgOut = document.getElementById("deviceIdFromForm").value;
        console.log("New msgOut: ", msgOut);

        displayCustomText();
    })
    

}

printTextBox();


//displayCustomText();


//setInterval(printTextBox, 100);

