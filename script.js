let msgOut = null 
let visibleNodes = [];
let numNodes = 0;
let nodeKeys = []

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
        nodeKeys = Object.keys(result);
        for (let i = 0; i < numNodes; i++){
                visibleNodes[i] = document.createElement("button");
                visibleNodes[i].textContent = `Node ${nodeKeys[i]}`;
                document.body.appendChild(visibleNodes[i]);
            }
        console.log(numNodes);

    }
    catch (error) {
        console.error(error);
    }

    OpenNodeData();
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
function WaitForDeviceID(){
    document.getElementById("submitButton").addEventListener("click", function() {
        msgOut = document.getElementById("deviceIdFromForm").value;
        console.log("New msgOut: ", msgOut);

        // check for previously placed node buttons and delete them
        if (visibleNodes[0]){
            for (let i = 0; i < numNodes; i++) {
                visibleNodes[i].remove();
            }
        }
        // erase previous node buttons and associated values
        numNodes = 0;
        visibleNodes = [];

        //displayCustomText();
        ListNodes();
    })
    

}

async function OpenNodeData(){
    for (let i = 0; i < numNodes; i++){
        if (visibleNodes[i]){
            visibleNodes[i].addEventListener("click", async function() {
                // on click, send nodeNum and deviceID to get 3 hours worth of data points (30 data points)

                const payload = {
                    deviceID: msgOut,
                    nodeNum: nodeKeys[i],
                    numReadings: 5
                };

                // fetch request here using POST method
                try{
                    const response = await fetch("https://w81qke5ani.execute-api.us-east-1.amazonaws.com/GetNodeSpecificTelemetry/POST", {
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

                    // print temp values from node
                    console.log(result);

                } catch (error) {
                    console.error(error);
                }

            })
        }
    } 
}


// Event loop consists of waiting for user to enter deviceID, which triggers ListNodes() 
// and prints a list of the nodes associated with a deviceID

WaitForDeviceID();


//displayCustomText();


