let msgOut = "empty"

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
        console.log(result);

    } catch (error) {
        console.error(error);
    }
}



displayCustomText();
