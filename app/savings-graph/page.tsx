"use client";

import React, { useEffect, useState } from "react"; // Import useContext
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import LineChart from "@/components/LineChart";
import ParentSize from "@visx/responsive/lib/components/ParentSize";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ChevronDown, Settings, X } from "lucide-react";
import { useBudgetContext } from "@/components/BudgetContext";

const SavingsGraphPage = () => {
  const [savingsData, setSavingsData] = useState<
    { date: Date; value: number }[]
  >([]);
  const [selectedTimeframe, setSelectedTimeframe] =
    useState<string>("PAST_MONTH");
  const [isControlPanelExpanded, setIsControlPanelExpanded] =
    useState<boolean>(true);
  const { categories, removeCategory, isEditMode, updateAmount } =
    useBudgetContext();

  useEffect(() => {
    async function fetchSavingsData() {
      try {
        const response = await fetch("/api/user-data");
        const data = await response.json();
        // The first set of data points is the user's savings over time; that is, [revenue - expenses].
        const savingsData: { date: Date; value: number }[] = [];

        for (const dateEntry of data) {
          for (const date in dateEntry) {
            let dailyValue = 0;
            for (const transaction of dateEntry[date]) {
              if (transaction.transaction_type === "credit") {
                dailyValue += transaction.amount;
              } else if (transaction.transaction_type === "debit") {
                dailyValue -= transaction.amount;
              }
            }
            savingsData.push({ date: new Date(date), value: dailyValue });
          }
        }

        setSavingsData(savingsData);
      } catch (error) {
        console.error("Failed to fetch savings data:", error);
      }
    }

    fetchSavingsData();
  }, []);

  const handleTimeframeChange = (timeframe: string) => {
    setSelectedTimeframe(timeframe);
    // Fetch data based on timeframe
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-purple-700 to-indigo-800 text-white p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Savings Graph</h1>
        <Settings className="h-6 w-6" />
      </header>

      <main className="flex-grow p-4 overflow-y-auto">
        {/* Timeframe Selector */}
        <div className="flex gap-2 mb-4">
          <Select
            onValueChange={handleTimeframeChange}
            defaultValue={selectedTimeframe}
          >
            <SelectTrigger className="w-auto">
              <SelectValue placeholder="Select Timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PAST_MONTH">Last Month</SelectItem>
              <SelectItem value="PAST_3_MONTHS">Last 3 Months</SelectItem>
              <SelectItem value="YTD">Year to Date</SelectItem>
              <SelectItem value="NEXT_YEAR">Next Year</SelectItem>
              <SelectItem value="NEXT_5_YEARS">Next 5 Years</SelectItem>
              <SelectItem value="ALL_TIME">All Time</SelectItem>
              <SelectItem value="CUSTOM">Custom</SelectItem>
            </SelectContent>
          </Select>
          {/* Add a custom date range picker if needed */}
        </div>

        {/* Graph and Legend */}
        <Card className="bg-white shadow-lg mb-4">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-semibold text-gray-700">
              Savings Graph
            </CardTitle>
            {/* Graph Legend */}
            <div className="flex items-center">
              <div className="flex items-center mr-4">
                <div className="w-3 h-3 rounded-full bg-blue-500 mr-1"></div>
                <span>Actual</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-blue-500/50 mr-1"></div>
                <span>Forecast</span>
              </div>
            </div>
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

        {/* Control Panel */}
        <Card className="bg-white shadow-lg">
          <CardHeader
            className="pb-2 flex flex-row items-center justify-between space-y-0 pb-2 cursor-pointer"
            onClick={() => setIsControlPanelExpanded(!isControlPanelExpanded)}
          >
            <CardTitle className="text-lg font-semibold text-gray-700">
              Budget Categories
            </CardTitle>
            <ChevronDown
              className={`h-4 w-4 transition-transform ${
                isControlPanelExpanded ? "rotate-180" : ""
              }`}
            />
          </CardHeader>
          {isControlPanelExpanded && (
            <CardContent>
              <ul className="space-y-3">
                {categories.map((category, index) => (
                  <li key={index} className="relative overflow-hidden">
                    <div
                      className="absolute inset-0 rounded-lg opacity-20"
                      style={{
                        width: `${
                          (category.amount /
                            categories.reduce(
                              (sum, category) => sum + category.amount,
                              0,
                            )) *
                          100
                        }%`,
                        backgroundColor: category.color,
                      }}
                    ></div>
                    <div className="flex items-center justify-between p-2 rounded-lg relative z-10">
                      <div className="flex items-center flex-grow mr-2">
                        <div
                          className="w-4 h-4 rounded-full mr-3"
                          style={{ backgroundColor: category.color }}
                        ></div>
                        <span className="font-medium text-gray-700">
                          {category.name}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <div className="flex items-center mr-2">
                          <Input
                            type="number"
                            value={category.amount}
                            onChange={(e) =>
                              updateAmount(index, e.target.value)
                            }
                            className="w-20 text-right"
                            disabled={!isEditMode}
                          />
                        </div>
                        {isEditMode && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeCategory(index)}
                          >
                            <X className="w-4 h-4 text-gray-500" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          )}
        </Card>
      </main>
    </div>
  );
};

export default SavingsGraphPage;
