import React, { useState } from "react";
import {
  Layout,
  PieChart,
  Settings,
  House,
  Zap,
  Wifi,
  CookingPot,
  Droplet,
  Carrot,
  Phone,
} from "lucide-react";

// tiny helpers
const n = (v) => {
  const x = parseFloat(String(v || "").replace(/[^0-9.\-]/g, ""));
  return Number.isFinite(x) ? x : 0;
};
const money = (v) =>
  (Number.isFinite(v) ? v : 0).toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
  });

export default function App() {
  const [activeTab, setActiveTab] = useState("setup");

  // Monthly net income input & saved snapshot
  const [netIncome, setNetIncome] = useState("");
  const [savedIncome, setSavedIncome] = useState(null);

  // Non-Negotiables
  const [nonNegotiables, setNonNegotiables] = useState({
    rent: "",
    electricity: "",
    internet: "",
    gas: "",
    water: "",
    groceries: "",
    phone: "",
  });

  // derived
  const monthlyNet = netIncome !== "" ? n(netIncome) : n(savedIncome);
  const yearlyNet = monthlyNet > 0 ? monthlyNet * 12 : 0;

  const nnTotal =
    n(nonNegotiables.rent) +
    n(nonNegotiables.electricity) +
    n(nonNegotiables.internet) +
    n(nonNegotiables.gas) +
    n(nonNegotiables.water) +
    n(nonNegotiables.groceries) +
    n(nonNegotiables.phone);

  const play = monthlyNet - nnTotal; // can be negative (overscheduled)

  const handleSaveIncome = () => setSavedIncome(n(netIncome));
  const onNNChange = (field) => (e) =>
    setNonNegotiables((s) => ({ ...s, [field]: e.target.value }));

  const Tab = ({ id, icon: Icon, children }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-2 px-6 py-3 font-semibold ${
        activeTab === id
          ? "border-b-2 border-blue-500 text-blue-600"
          : "text-gray-600"
      }`}
    >
      <Icon className="w-4 h-4" />
      {children}
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Tabs */}
      <div className="flex border-b bg-white shadow">
        <Tab id="setup" icon={Layout}>Setup</Tab>
        <Tab id="spending" icon={PieChart}>Income Split</Tab>
        <Tab id="settings" icon={Settings}>Settings</Tab>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === "setup" && (
          <div className="max-w-2xl mx-auto space-y-8">
            <h1 className="text-2xl font-bold">Start budgeting</h1>

            {/* Net income */}
            <section>
              <h2 className="text-xl font-semibold mb-2">
                What is your monthly net income?
              </h2>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="Enter monthly net income"
                  value={netIncome}
                  onChange={(e) => setNetIncome(e.target.value)}
                  className="border px-3 py-2 rounded w-56"
                />
                <button
                  onClick={handleSaveIncome}
                  className="bg-blue-600 text-white px-4 py-2 rounded"
                >
                  Save
                </button>
                <span className="text-sm text-gray-600">
                  (You don’t have to press Save to see updates.)
                </span>
              </div>
              <p className="mt-2 text-lg font-medium">
                Yearly equivalent: {yearlyNet ? money(yearlyNet) : "—"}
              </p>
            </section>

            {/* Non-Negotiable Bills */}
            <section>
              <h2 className="text-xl font-bold mb-1">Non-Negotiable Bills</h2>
              <p className="text-gray-600 mb-4">
                These are your necessities—if you lost your job today, you would
                stop putting money into every other category except this one.
              </p>

              <div className="space-y-3">
                <Row
                  icon={House}
                  label="Rent / Mortgage"
                  value={nonNegotiables.rent}
                  onChange={onNNChange("rent")}
                />
                <Row
                  icon={Zap}
                  label="Electricity"
                  value={nonNegotiables.electricity}
                  onChange={onNNChange("electricity")}
                />
                <Row
                  icon={Wifi}
                  label="Internet"
                  value={nonNegotiables.internet}
                  onChange={onNNChange("internet")}
                />
                <Row
                  icon={CookingPot}
                  label="Gas"
                  value={nonNegotiables.gas}
                  onChange={onNNChange("gas")}
                />
                <Row
                  icon={Droplet}
                  label="Water"
                  value={nonNegotiables.water}
                  onChange={onNNChange("water")}
                />
                <Row
                  icon={Carrot}
                  label="Groceries"
                  value={nonNegotiables.groceries}
                  onChange={onNNChange("groceries")}
                />
                <Row
                  icon={Phone}
                  label="Phone"
                  value={nonNegotiables.phone}
                  onChange={onNNChange("phone")}
                />
              </div>

              {/* live totals */}
              <div className="mt-4 grid gap-2">
                <div className="flex justify-between text-sm text-gray-700">
                  <span>Non-Negotiables total</span>
                  <strong>{money(nnTotal)}</strong>
                </div>
                <div
                  className={`flex justify-between items-center px-3 py-2 rounded text-white ${
                    play >= 0 ? "bg-green-600" : "bg-red-600"
                  }`}
                >
                  <span className="font-semibold">
                    You’ve got {money(Math.max(play, 0))}/mo to play with
                  </span>
                  {play < 0 && (
                    <span className="text-white/90 text-sm">
                      Over by {money(Math.abs(play))}/mo
                    </span>
                  )}
                </div>
              </div>
            </section>
          </div>
        )}

        {activeTab === "spending" && (
          <div className="max-w-xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">Income Split</h1>
            <p className="text-gray-600">
              (Hook up your categories/pie here next. I can wire it when you’re
              ready.)
            </p>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="max-w-xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">Settings</h1>
            <p className="text-gray-600">
              (Preferences & data reset coming later.)
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Reusable row with icon + label + input
function Row({ icon: Icon, label, value, onChange }) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="w-4 h-4 text-gray-700" />
      <span className="w-36">{label}</span>
      <input
        type="number"
        inputMode="decimal"
        value={value}
        onChange={onChange}
        placeholder="Amount / month"
        className="border px-3 py-2 rounded w-48"
      />
    </div>
  );
}
