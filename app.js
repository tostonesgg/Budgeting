import React, { useState } from "react";
import { Layout, PieChart, Settings, House, Zap, Wifi, CookingPot, Droplet, Carrot, Phone } from "lucide-react";

function App() {
  const [activeTab, setActiveTab] = useState("setup");
  const [netIncome, setNetIncome] = useState("");
  const [savedIncome, setSavedIncome] = useState(null);
  const [nonNegotiables, setNonNegotiables] = useState({
    rent: "",
    electricity: "",
    internet: "",
    gas: "",
    water: "",
    groceries: "",
    phone: ""
  });

  const handleSaveIncome = () => {
    setSavedIncome(parseFloat(netIncome) || 0);
  };

  const handleNonNegotiableChange = (field, value) => {
    setNonNegotiables({ ...nonNegotiables, [field]: value });
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Tabs */}
      <div className="flex border-b bg-white shadow">
        <button
          onClick={() => setActiveTab("setup")}
          className={`flex items-center gap-2 px-6 py-3 font-semibold ${
            activeTab === "setup" ? "border-b-2 border-blue-500 text-blue-600" : "text-gray-600"
          }`}
        >
          <Layout className="w-4 h-4" /> Setup
        </button>
        <button
          onClick={() => setActiveTab("spending")}
          className={`flex items-center gap-2 px-6 py-3 font-semibold ${
            activeTab === "spending" ? "border-b-2 border-blue-500 text-blue-600" : "text-gray-600"
          }`}
        >
          <PieChart className="w-4 h-4" /> Spending
        </button>
        <button
          onClick={() => setActiveTab("settings")}
          className={`flex items-center gap-2 px-6 py-3 font-semibold ${
            activeTab === "settings" ? "border-b-2 border-blue-500 text-blue-600" : "text-gray-600"
          }`}
        >
          <Settings className="w-4 h-4" /> Settings
        </button>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === "setup" && (
          <div>
            <h1 className="text-2xl font-bold mb-6">Start budgeting</h1>

            {/* Net Income */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-2">What is your monthly net income?</h2>
              <div className="flex gap-2 mb-2">
                <input
                  type="number"
                  value={netIncome}
                  onChange={(e) => setNetIncome(e.target.value)}
                  placeholder="Enter amount"
                  className="border px-3 py-2 rounded w-48"
                />
                <button
                  onClick={handleSaveIncome}
                  className="bg-blue-500 text-white px-4 py-2 rounded"
                >
                  Save
                </button>
              </div>
              {savedIncome !== null && (
                <p className="text-lg font-medium">Yearly equivalent: ${(savedIncome * 12).toFixed(2)}</p>
              )}
            </div>

            {/* Non-Negotiables */}
            <div>
              <h2 className="text-xl font-bold mb-1">Non-Negotiable Bills</h2>
              <p className="text-gray-600 mb-4">
                These are your necessities—if you lost your job today, you would stop putting money
                into every other category except this one.
              </p>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <House className="w-4 h-4 text-gray-700" />
                  <span className="w-32">Rent/Mortgage</span>
                  <input
                    type="number"
                    value={nonNegotiables.rent}
                    onChange={(e) => handleNonNegotiableChange("rent", e.target.value)}
                    className="border px-3 py-1 rounded w-40"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-500" />
                  <span className="w-32">Electricity</span>
                  <input
                    type="number"
                    value={nonNegotiables.electricity}
                    onChange={(e) => handleNonNegotiableChange("electricity", e.target.value)}
                    className="border px-3 py-1 rounded w-40"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Wifi className="w-4 h-4 text-blue-500" />
                  <span className="w-32">Internet</span>
                  <input
                    type="number"
                    value={nonNegotiables.internet}
                    onChange={(e) => handleNonNegotiableChange("internet", e.target.value)}
                    className="border px-3 py-1 rounded w-40"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <CookingPot className="w-4 h-4 text-red-500" />
                  <span className="w-32">Gas</span>
                  <input
                    type="number"
                    value={nonNegotiables.gas}
                    onChange={(e) => handleNonNegotiableChange("gas", e.target.value)}
                    className="border px-3 py-1 rounded w-40"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Droplet className="w-4 h-4 text-blue-400" />
                  <span className="w-32">Water</span>
                  <input
                    type="number"
                    value={nonNegotiables.water}
                    onChange={(e) => handleNonNegotiableChange("water", e.target.value)}
                    className="border px-3 py-1 rounded w-40"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Carrot className="w-4 h-4 text-green-500" />
                  <span className="w-32">Groceries</span>
                  <input
                    type="number"
                    value={nonNegotiables.groceries}
                    onChange={(e) => handleNonNegotiableChange("groceries", e.target.value)}
                    className="border px-3 py-1 rounded w-40"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-purple-500" />
                  <span className="w-32">Phone</span>
                  <input
                    type="number"
                    value={nonNegotiables.phone}
                    onChange={(e) => handleNonNegotiableChange("phone", e.target.value)}
                    className="border px-3 py-1 rounded w-40"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "spending" && (
          <div>
            <h1 className="text-2xl font-bold mb-6">Spending</h1>
            <p>Here you’ll manage allocations to your other categories.</p>
          </div>
        )}

        {activeTab === "settings" && (
          <div>
            <h1 className="text-2xl font-bold mb-6">Settings</h1>
            <p>App preferences go here.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
