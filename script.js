let msgOut = null 
let visibleNodes = [];
let numNodes = 0;
let nodeKeys = []
let tempChart = null;
let dataDomain = [];
let dataRange = [];

let totalReadings = 1000;

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
        const nodesContainer = document.getElementById("nodes-grid");
        for (let i = 0; i < numNodes; i++){
                visibleNodes[i] = document.createElement("button");
                visibleNodes[i].className = "node-card";
                visibleNodes[i].textContent = `Node ${nodeKeys[i]}`;
                //document.body.appendChild(visibleNodes[i]);
                nodesContainer.appendChild(visibleNodes[i]);
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

                if (tempChart){
                    tempChart.remove();
                    chartContainer.remove();
                }

                const payload = {
                    deviceID: msgOut,
                    nodeNum: nodeKeys[i],
                    numReadings: totalReadings
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

                    // generate domain and range for graph
                    let minRangeVal = result.telemetryReadings[0].tempC;
                    let maxRangeVal = 0
                    for (let i = 0; i < result.telemetryReadings.length; i++){
                        timeVal = result.telemetryReadings[i].timeUTC;
                        console.log(timeVal);
                        date = new Date(Number(timeVal));
                        estTime = date.toLocaleString("en-US", {
                            timeZone: "America/New_York"
                        });
                        console.log(estTime);
                        dataDomain[result.telemetryReadings.length - i - 1] = estTime;

                        dataRange[result.telemetryReadings.length - i - 1] = (Number(result.telemetryReadings[i].tempC) * (9/5) + 32).toFixed(1);
                       
                        if (Number(result.telemetryReadings[i].tempC) > maxRangeVal){
                            maxRangeVal = Number(result.telemetryReadings[i].tempC);
                        }

                        if (Number(result.telemetryReadings[i].tempC) < minRangeVal){
                            minRangeVal = Number(result.telemetryReadings[i].tempC);
                        }
                    }
                    maxRangeVal = parseInt(maxRangeVal * 9/5 + 32 + 2);
                    minRangeVal = parseInt(minRangeVal * 9/5 + 32 - 2);


                    // generate and populate graph, generate buttons for changing time scale
                    chartContainer = document.createElement("div");
                    chartContainer.style.width = "1000px";
                    chartContainer.style.height = "1000px";
                    chartContainer.style.margin = "0 auto";
                    tempChart = document.createElement("canvas");
                    document.body.appendChild(chartContainer);
                    chartContainer.appendChild(tempChart);
                    new Chart(tempChart, {
                        type: 'line',
                        data: {
                            labels: dataDomain,
                            datasets: [{
                                label: 'Temperature',
                                data: dataRange,
                                tension: 0.3
                            }]
                        },
                        options: {
                            scales: {
                                x: {
                                    border: {
                                        display: true,
                                        color: 'white',
                                        width: 2
                                    },
                                    ticks: {
                                        color: 'white'
                                    }

                                },

                                y: {
                                    min: minRangeVal,
                                    max: maxRangeVal,

                                    // grid: {
                                    //     display: true,
                                    //     color: 'rgba(255, 255, 255, 1)',
                                    //     linewidth: 5
                                    // },
                                    border: {
                                        display: true,
                                        color: 'white', //rgba(125, 250, 231, 0.6)
                                        width: 2
                                    },
                                    ticks: {
                                        color: 'white'
                                    }
                                }
                            }
                        }
                    });
                    tempChart.style.width = "100px";                   
                    

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


