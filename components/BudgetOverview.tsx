"use client";
import React from "react";
import { useParams } from "next/navigation";

function BudgetOverview() {
  const params = useParams();
  const uuid = params.uuid as string; // Access the uuid

  // ... your logic to fetch and display budget details based on uuid ...
  return <p>Displaying Budget with UUID: {uuid}</p>;
}
export default BudgetOverview;
