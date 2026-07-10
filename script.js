let msgOut = null 
let visibleNodes = [];
let numNodes = 0;

async function ListNodes(){

    const payload ={
        deviceID : msgOut
    };
    try{
        const response = await fetch("https://z4wpd0rrrb.execute-api.us-east-1.amazonaws.com/ListNodes/POST", {
            method : "POST",
            headers : {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok){
            throw new Error(`Response status: ${response.status}`);
        }
        const result = await response.json();
        console.log(result);

        // Create a new button for each node found 
        numNodes = Object.keys(result).length;
        const keys = Object.keys(result);
        for (let i = 0; i < numNodes; i++){
                visibleNodes[i] = document.createElement("button");
                visibleNodes[i].textContent = `Node ${keys[i]}`;
                document.body.appendChild(visibleNodes[i]);
            }
        console.log(numNodes);

    }
    catch (error) {
        console.error(error);
    }


}

async function displayCustomText(){
    
    // take msgOut and send it to aws lambda
    const payload = {
        deviceID: msgOut
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

        // check for previously placed node buttons and delete them
        if (visibleNodes[0]){
            for (let i = 0; i < numNodes; i++) {
                visibleNodes[i].remove();
            }
        }
        numNodes = 0;

        //displayCustomText();
        ListNodes();
    })
    

}



printTextBox();


//displayCustomText();


