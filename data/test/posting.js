async function postTransactionGroups(inputJson) {
  const API_ENDPOINT = "http://localhost:8000/api/transaction-groups/";
  const AUTH_TOKEN =
    "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzQyNDkxOTgyLCJpYXQiOjE3NDI0ODgzODIsImp0aSI6ImIwMzJiMDcyYTE4ZTQwMzc5YjU0MzBhZDVjMGMwNTA2IiwidXNlcl9pZCI6ImFiM2EwODAyLTc1ZjYtNDU4NC1hOGJkLTcxMTczODBmYzEyNCJ9.huvSnmPWQvbxvTIzkgRi1vQy422sxCfcgdRyIvU0jpE"; // Replace with your actual token

  try {
    const transactionGroups = JSON.parse(inputJson);

    if (!Array.isArray(transactionGroups)) {
      console.error("Input from stdin does not contain a valid JSON array.");
      return;
    }

    for (let index = 0; index < transactionGroups.length; index++) {
      const outputObj = transactionGroups[index];

      const myHeaders = new Headers();
      myHeaders.append("Content-Type", "application/json");
      myHeaders.append("Authorization", AUTH_TOKEN);

      const raw = JSON.stringify(outputObj);

      const requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: raw,
        redirect: "follow",
      };

      try {
        const response = await fetch(API_ENDPOINT, requestOptions);
        if (response.ok) {
          console.log(
            `Object ${index + 1}/${transactionGroups.length}: POST successful`,
          );
          // Optionally process response if needed:
          // const result = await response.text();
          // console.log("Response:", result);
        } else {
          console.error(
            `Object ${index + 1}/${transactionGroups.length}: POST failed with status ${response.status}`,
          );
          const errorText = await response.text();
          console.error("Error details:", errorText);
        }
      } catch (error) {
        console.error(
          `Object ${index + 1}/${transactionGroups.length}: POST request error`,
          error,
        );
      }
    }

    console.log("Posting process completed.");
  } catch (error) {
    console.error("Error processing JSON input:", error);
  }
}

// Read input from stdin
let inputData = "";
process.stdin.on("data", (chunk) => {
  inputData += chunk;
});

process.stdin.on("end", () => {
  postTransactionGroups(inputData);
});
