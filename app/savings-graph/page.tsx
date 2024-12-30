"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import LineChart from "@/components/LineChart";
import ParentSize from "@visx/responsive/lib/components/ParentSize";

const SavingsGraphPage = () => {
  const [savingsData, setSavingsData] = useState<
    { date: Date; value: number }[]
  >([]);

  useEffect(() => {
    async function fetchSavingsData() {
      try {
        const response = await fetch("/api/user-data");
        const data = await response.json();
        setSavingsData(data);
      } catch (error) {
        console.error("Failed to fetch savings data:", error);
      }
    }

    fetchSavingsData();
  }, []);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-purple-700 to-indigo-800 text-white p-4">
        <h1 className="text-2xl font-bold">Savings Graph</h1>
      </header>

      <main className="flex-grow p-4 overflow-y-auto">
        <Card className="bg-white shadow-lg col-span-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold text-gray-700">
              Savings Graph
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full h-64">
              <ParentSize>
                {({ width, height }) => (
                  <LineChart width={width} height={height} data={savingsData} />
                )}
              </ParentSize>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default SavingsGraphPage;
