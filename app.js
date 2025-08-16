import React, { useState } from "react";
import {
  Settings,
  PieChart,
  LayoutDashboard,
  House,
  Zap,
  Wifi,
  CookingPot,
  Droplet,
  Carrot,
} from "lucide-react";

function App() {
  const [activeTab, setActiveTab] = useState("setup");
  const [netIncome, setNetIncome] = useState("");
  const [savedIncome, setSavedIncome] = useState(null);
  const [bills, setBills] = useState({
    rent: "",
    electricity: "",
    internet: "",
    gas: "",
    water: "",
    groceries: "",
  });

  const handleSaveIncome = () => {
    setSavedIncome(netIncome);
  };

  const yearlyIncome = savedIncome ? savedIncome * 12 : 0;

  const renderContent = () => {
    switch (activeTab) {
      case "setup":
        return (
          <div className="p-6 space-y-8">
            {/* Header */}
            <h1 className="text-3xl font-bold mb-4">Start budgeting</h1>

            {/* Monthly Net Income */}
            <div>
              <h2 className="text-xl font-semibold mb-2">
                What is your monthly net income?
              </h2>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  className="border px-2 py-1 rounded"
                  placeholder="Enter monthly net income"
                  value={netIncome}
                  onChange={(e) => setNetIncome(e.target.value)}
                />
                <button
                  onClick={handleSaveIncome}
                  className="bg-blue-500 text-white px-3 py-1 rounded"
                >
                  Save
                </button>
              </div>
              {savedIncome && (
                <p className="mt-2 text-lg font-medium">
                  Yearly Equivalent: ${(yearlyIncome || 0).toLocaleString()}
                </p>
              )}
            </div>

            {/* Non-Negotiable Bills */}
            <div>
              <h2 className="text-2xl font-bold mb-1">Non-Negotiable Bills</h2>
              <p className="text-gray-600 mb-4">
                These are your necessities—if you lost your job today, you would
                stop putting money into every other category except this one.
              </p>

              <div className="space-y-3">
                {/* Rent */}
                <div className="flex items-center gap-2">
                  <House className="w-5 h-5 text-gray-700" />
                  <span className="w-32">Rent / Mortgage</span>
                  <input
                    type="number"
                    className="border px-2 py-1 rounded flex-1"
                    placeholder="Enter amount"
                    value={bills.rent}
                    onChange={(e) =>
                      setBills({ ...bills, rent: e.target.value })
                    }
                  />
                </div>

                {/* Electricity */}
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-gray-700" />
                  <span className="w-32">Electricity</span>
                  <input
                    type="number"
                    className="border px-2 py-1 rounded flex-1"
                    placeholder="Enter amount"
                    value={bills.electricity}
                    onChange={(e) =>
                      setBills({ ...bills, electricity: e.target.value })
                    }
                  />
                </div>

                {/* Internet */}
                <div className="flex items-center gap-2">
                  <Wifi className="w-5 h-5 text-gray-700" />
                  <span className="w-32">Internet</span>
                  <input
                    type="number"
                    className="border px-2 py-1 rounded flex-1"
                    placeholder="Enter amount"
                    value={bills.internet}
                    onChange={(e) =>
                      setBills({ ...bills, internet: e.target.value })
                    }
                  />
                </div>

                {/* Gas */}
                <div className="flex items-center gap-2">
                  <CookingPot className="w-5 h-5 text-gray-700" />
                  <span className="w-32">Gas</span>
                  <input
                    type="number"
                    className="border px-2 py-1 rounded flex-1"
                    placeholder="Enter amount"
                    value={bills.gas}
                    onChange={(e) =>
                      setBills({ ...bills, gas: e.target.value })
                    }
                  />
                </div>

                {/* Water */}
                <div className="flex items-center gap-2">
                  <Droplet className="w-5 h-5 text-gray-700" />
                  <span className="w-32">Water</span>
                  <input
                    type="number"
                    className="border px-2 py-1 rounded flex-1"
                    placeholder="Enter amount"
                    value={bills.water}
                    onChange={(e) =>
                      setBills({ ...bills, water: e.target.value })
                    }
                  />
                </div>

                {/* Groceries */}
                <div className="flex items-center gap-2">
                  <Carrot className="w-5 h-5 text-gray-700" />
                  <span className="w-32">Groceries</span>
                  <input
                    type="number"
                    className="border px-2 py-1 rounded flex-1"
                    placeholder="Enter amount"
                    value={bills.groceries}
                    onChange={(e) =>
                      setBills({ ...bills, groceries: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        );
      case "split":
        return <div className="p-6">Income Split (placeholder)</div>;
      case "category":
        return <div className="p-6">Category View (placeholder)</div>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Tabs */}
      <div className="flex justify-around border-b bg-white shadow">
        <button
          onClick={() => setActiveTab("setup")}
          className={`flex items-center gap-2 px-4 py-3 ${
            activeTab === "setup" ? "border-b-2 border-blue-500 font-bold" : ""
          }`}
        >
          <Settings className="w-5 h-5" />
          Setup
        </button>
        <button
          onClick={() => setActiveTab("split")}
          className={`flex items-center gap-2 px-4 py-3 ${
            activeTab === "split" ? "border-b-2 border-blue-500 font-bold" : ""
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          Income Split
        </button>
        <button
          onClick={() => setActiveTab("category")}
          className={`flex items-center gap-2 px-4 py-3 ${
            activeTab === "category"
              ? "border-b-2 border-blue-500 font-bold"
              : ""
          }`}
        >
          <PieChart className="w-5 h-5" />
          Category View
        </button>
      </div>

      {/* Content */}
      {renderContent()}
    </div>
  );
}

export default App;
