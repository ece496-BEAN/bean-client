"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";

function BudgetOverview() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const uuid = params.uuid as string; // Access the uuid
  const initialEditMode = searchParams.get("edit") === "true";

  const [editMode, setEditMode] = useState(initialEditMode);

  useEffect(() => {
    // Update URL when editMode changes
    const newSearchParams = new URLSearchParams(searchParams);

    if (editMode) {
      newSearchParams.set("edit", "true");
    } else {
      newSearchParams.delete("edit");
    }

    // Combine the pathname and the updated query parameters and push the new router.
    router.push(`${location.pathname}?${newSearchParams}`);
  }, [editMode, router, searchParams]);

  // ... your logic to fetch and display budget details based on uuid ...
  return <p>Displaying Budget with UUID: {uuid}</p>;
}
export default BudgetOverview;
