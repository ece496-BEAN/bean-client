function convertTransactions(inputJson) {
  const newCategoryData = `[
    {
        "id": "b2d40c66-5a4d-4117-9ab1-fbff2eb71191",
        "name": "income-stock dividends",
        "description": "",
        "legacy": false
    },
    {
        "id": "f52b3ba5-2468-4700-8739-27e75a6bf1fb",
        "name": "income-side hustle",
        "description": "",
        "legacy": false
    },
    {
        "id": "76c66901-b548-413f-be00-90ea934af5b8",
        "name": "income-salary",
        "description": "",
        "legacy": false
    },
    {
        "id": "c3a7625a-9169-4bf8-9c7f-4967dd284b4d",
        "name": "income-initial value",
        "description": "",
        "legacy": false
    }
]`;

  const categories = JSON.parse(newCategoryData);

  const categoryMap = {};

  categories.forEach((category) => {
    categoryMap[category.name.slice("income-".length)] = category.id;
  });

  // console.log(JSON.stringify(categoryMap, null, 2));

  try {
    const transactionsArray = JSON.parse(inputJson);
    if (!Array.isArray(transactionsArray)) {
      console.error("Input is not a valid JSON array.");
      return;
    }

    const outputObjects = transactionsArray.map((item) => {
      const category_uuid = categoryMap[item.category] || categoryMap["other"]; // Default to "other" if category not found

      const transactionObject = {
        name: "my transaction name",
        description: "my transaction description",
        amount: (-1 * item.amount).toString(), // Convert amount to string as per example output
        category_uuid: category_uuid,
      };

      const outputObject = {
        name: "my transaction group name",
        description: "my transaction group description",
        source: null,
        date: item.date,
        transactions: [transactionObject],
      };
      return outputObject;
    });
    console.log(JSON.stringify(outputObjects));
    // outputObjects.forEach(outputObj => {
    //     console.log(JSON.stringify(outputObj));
    // });
  } catch (error) {
    console.error("Error parsing JSON:", error);
  }
}

// Read input from stdin
let inputData = "";
process.stdin.on("data", (chunk) => {
  inputData += chunk;
});

process.stdin.on("end", () => {
  convertTransactions(inputData);
});
