import React, { useState, useEffect } from "react";
import { PieChart, Pie, Cell, Tooltip } from "recharts";
import jsPDF from "jspdf";

const diseaseFields = {
  heart: [
    { name: "age", label: "Age", type: "number" },
    { name: "sex", label: "Sex", type: "select", options: [{ label: "Male", value: 1 }, { label: "Female", value: 0 }] },
    { name: "cp", label: "Chest Pain Type", type: "select", options: [{ label: "0", value: 0 }, { label: "1", value: 1 }, { label: "2", value: 2 }, { label: "3", value: 3 }] },
    { name: "trestbps", label: "Resting Blood Pressure (mm Hg)", type: "number" },
    { name: "chol", label: "Cholesterol (mg/dL)", type: "number" },
    { name: "fbs", label: "Fasting Blood Sugar > 120 mg/dL", type: "select", options: [{ label: "Yes", value: 1 }, { label: "No", value: 0 }] },
    { name: "restecg", label: "Resting ECG Results", type: "select", options: [{ label: "0", value: 0 }, { label: "1", value: 1 }, { label: "2", value: 2 }] },
    { name: "thalach", label: "Max Heart Rate Achieved", type: "number" },
    { name: "exang", label: "Exercise Induced Angina", type: "select", options: [{ label: "Yes", value: 1 }, { label: "No", value: 0 }] },
    { name: "oldpeak", label: "ST Depression (Oldpeak)", type: "number" },
    { name: "slope", label: "Slope of Peak Exercise ST Segment", type: "select", options: [{ label: "0", value: 0 }, { label: "1", value: 1 }, { label: "2", value: 2 }] },
    { name: "ca", label: "Number of Major Vessels (0-3)", type: "select", options: [{ label: "0", value: 0 }, { label: "1", value: 1 }, { label: "2", value: 2 }, { label: "3", value: 3 }] },
    { name: "thal", label: "Thal", type: "select", options: [{ label: "Normal", value: 1 }, { label: "Fixed Defect", value: 2 }, { label: "Reversible Defect", value: 3 }] },
  ],
  diabetes: [
    { name: "pregnancies", label: "Number of Pregnancies", type: "number" },
    { name: "glucose", label: "Glucose Level", type: "number" },
    { name: "blood_pressure", label: "Blood Pressure", type: "number" },
    { name: "skin_thickness", label: "Skin Thickness", type: "number" },
    { name: "insulin", label: "Insulin Level", type: "number" },
    { name: "bmi", label: "BMI", type: "number" },
    { name: "dpf", label: "Diabetes Pedigree Function", type: "number" },
    { name: "age", label: "Age", type: "number" },
  ],
  pcos: [
    { name: "age", label: "Age (in years)", type: "number" },
    { name: "bmi", label: "BMI", type: "number" },
    { name: "amh", label: "AMH (ng/mL)", type: "number" },
    { name: "lh", label: "LH (mIU/mL)", type: "number" },
    { name: "fsh_lh", label: "FSH/LH Ratio", type: "number" },
    { name: "weight_gain", label: "Weight Gain", type: "select", options: [{ label: "No", value: 0 }, { label: "Yes", value: 1 }] },
    { name: "hair_growth", label: "Hair Growth", type: "select", options: [{ label: "No", value: 0 }, { label: "Yes", value: 1 }] },
    { name: "skin_darkening", label: "Skin Darkening", type: "select", options: [{ label: "No", value: 0 }, { label: "Yes", value: 1 }] },
    { name: "hair_loss", label: "Hair Loss", type: "select", options: [{ label: "No", value: 0 }, { label: "Yes", value: 1 }] },
    { name: "pimples", label: "Pimples", type: "select", options: [{ label: "No", value: 0 }, { label: "Yes", value: 1 }] },
    { name: "cycle_length", label: "Cycle Length (days)", type: "number" },
    { name: "follicle_L", label: "Follicle No. (Left)", type: "number" },
    { name: "follicle_R", label: "Follicle No. (Right)", type: "number" },
    { name: "tsh", label: "TSH (mIU/L)", type: "number" },
    { name: "endometrium", label: "Endometrium Thickness (mm)", type: "number" },
  ],
  stroke: [
    { name: "gender", label: "Gender", type: "select", options: [{ label: "Female", value: 0 }, { label: "Male", value: 1 }] },
    { name: "age", label: "Age (in years)", type: "number" },
    { name: "hypertension", label: "Hypertension", type: "select", options: [{ label: "No", value: 0 }, { label: "Yes", value: 1 }] },
    { name: "heart_disease", label: "Heart Disease", type: "select", options: [{ label: "No", value: 0 }, { label: "Yes", value: 1 }] },
    { name: "ever_married", label: "Ever Married", type: "select", options: [{ label: "No", value: 0 }, { label: "Yes", value: 1 }] },
    {
      name: "work_type", label: "Work Type", type: "select", options: [
        { label: "Private", value: 0 },
        { label: "Self-employed", value: 1 },
        { label: "Govt job", value: 2 },
        { label: "Children", value: 3 },
        { label: "Never worked", value: 4 }
      ]
    },
    { name: "residence_type", label: "Residence Type", type: "select", options: [{ label: "Rural", value: 0 }, { label: "Urban", value: 1 }] },
    { name: "avg_glucose_level", label: "Average Glucose Level", type: "number" },
    { name: "bmi", label: "BMI", type: "number" },
    {
      name: "smoking_status", label: "Smoking Status", type: "select", options: [
        { label: "Never smoked", value: 0 },
        { label: "Formerly smoked", value: 1 },
        { label: "Smokes", value: 2 },
        { label: "Unknown", value: 3 }
      ]
    },
  ],
};

const getRiskColor = (percentage) => {
  if (percentage <= 30) return "#10B981"; // Green (Low Risk)
  if (percentage <= 70) return "#F59E0B"; // Orange (Moderate Risk)
  return "#EF4444"; // Red (High Risk)
};

const Prediction = () => {
  const [disease, setDisease] = useState("");
  const [formData, setFormData] = useState({});
  const [riskPercentage, setRiskPercentage] = useState("0%");
  const [riskLevel, setRiskLevel] = useState("Low Risk");
  const [riskMessage, setRiskMessage] = useState("Please fill out the form to get your disease risk prediction.");
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState(null);

  useEffect(() => {
    setFormData({});
    setPrediction(null);
  }, [disease]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handlePrediction = async () => {
    if (!disease) {
      alert("Please select a disease");
      return;
    }

    const requiredFields = diseaseFields[disease].map((field) => field.name);
    for (let field of requiredFields) {
      if (!formData[field] && formData[field] !== 0) {
        alert(`Please fill the field: ${field}`);
        return;
      }
    }

    setLoading(true);

    try {
      const response = await fetch(`http://127.0.0.1:5000/predict/${disease}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch prediction");
      }

      const result = await response.json();
      setRiskPercentage(`${result.probability}%`);
      setRiskLevel(result.risk === "YES" ? "High Risk" : "Low Risk");
      setRiskMessage(
        result.risk === "YES"
          ? "Consult a doctor for further evaluation."
          : "Your health condition seems fine."
      );
      setPrediction(result.probability);
    } catch (error) {
      console.error("Error fetching prediction:", error);
      setRiskMessage("Failed to get prediction. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCertificate = () => {
    if (!disease || prediction === null) {
      alert("Please complete the prediction first.");
      return;
    }

    const doc = new jsPDF();

    // Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(40, 40, 40);
    doc.text("PredictaCare Prediction Certificate", 105, 30, null, null, "center");

    // Disease Name
    doc.setFontSize(14);
    doc.setTextColor(60, 60, 60);
    doc.text(`Disease: ${disease.toUpperCase()}`, 105, 45, null, null, "center");

    // Date
    doc.setFontSize(12);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 15, 55);

    // Line Separator
    doc.line(15, 60, 195, 60);

    // Patient Details Section
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Patient Details", 15, 70);

    let yPos = 80;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);

    diseaseFields[disease].forEach((field) => {
      let value = formData[field.name];

      // Convert values to user-friendly labels
      if (field.type === "select") {
        const selectedOption = field.options.find((opt) => opt.value == value); // Loose equality to match number & string
        value = selectedOption ? selectedOption.label : value;
      }

      doc.text(`${field.label}: ${value}`, 20, yPos);
      yPos += 10;
    });

    // Prediction Result Section
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Prediction Result", 15, yPos + 10);

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");

    // Risk Level with Color Coding
    const riskColor = prediction >= 50 ? [200, 0, 0] : [0, 150, 0]; // Red for High Risk, Green for Low Risk
    doc.setTextColor(...riskColor);
    doc.text(`Risk Level: ${riskLevel}`, 20, yPos + 25);
    doc.text(`Probability: ${riskPercentage}`, 20, yPos + 35);

    // Footer Disclaimer
    doc.setTextColor(40, 40, 40);
    doc.line(15, yPos + 40, 195, yPos + 40);
    doc.setFontSize(10);
    doc.text(
      "This is a computer-generated report. Please consult a doctor for further evaluation.",
      15,
      yPos + 50
    );

    // Save PDF
    doc.save(`Prediction_${disease}_certificate.pdf`);
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-indigo-50 to-indigo-100 flex flex-col items-center p-6">
      <header className="w-full max-w-7xl flex justify-between items-center mb-12">
        <h1 className="text-4xl font-extrabold text-indigo-700">DiagnoAI</h1>
        <p className="text-lg text-gray-600">Your AI Health Companion</p>
      </header>

      <div className="flex flex-col md:flex-row gap-8 max-w-7xl w-full bg-white rounded-3xl shadow-2xl p-10">
        <div className="w-full md:w-1/2">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Enter Patient Details</h2>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Select Disease</label>
            <select
              className="block w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              onChange={(e) => setDisease(e.target.value)}
            >
              <option value="">Select</option>
              <option value="heart">Heart Disease</option>
              <option value="pcos">PCOS</option>
              <option value="diabetes">Diabetes</option>
              <option value="stroke">Stroke</option>
            </select>
          </div>

          {disease && (
            <form className="grid grid-cols-1 gap-4">
              {diseaseFields[disease].map((field) => (
                <div key={field.name} className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                  {field.type === "select" ? (
                    <select
                      name={field.name}
                      value={formData[field.name] || ""}
                      onChange={handleInputChange}
                      className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Select</option>
                      {field.options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="number"
                      name={field.name}
                      value={formData[field.name] || ""}
                      onChange={handleInputChange}
                      placeholder={field.label}
                      className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  )}
                </div>
              ))}
              <button
                type="button"
                className={`mt-4 py-3 px-6 text-white text-lg font-semibold rounded-lg shadow-md transition ${loading ? "bg-gray-500 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-600"
                  }`}
                onClick={handlePrediction}
                disabled={loading}
              >
                {loading ? "Predicting..." : "Predict Disease Risk"}
              </button>
            </form>
          )}
        </div>

        <div className="w-full md:w-1/2 flex flex-col items-center justify-center">
          <h3 className="text-xl font-semibold text-gray-700 mb-6">Prediction Result</h3>

          <div className="w-64 h-64 flex items-center justify-center relative rounded-full shadow-lg bg-white">
            {prediction !== null ? (
              <>
                <PieChart width={250} height={250}>
                  <Pie
                    data={[
                      { name: "Risk", value: prediction },
                      { name: "Safe", value: 100 - prediction },
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    <Cell fill={getRiskColor(prediction)} />  {/* Risk color based on percentage */}
                    <Cell fill="#D1D5DB" />  {/* Gray for safe area */}
                  </Pie>
                  <Tooltip />
                </PieChart>
                <div className="absolute flex flex-col items-center">
                  <span
                    className="text-4xl font-bold"
                    style={{ color: getRiskColor(prediction) }}>
                    {riskPercentage}
                  </span>
                  <span className="text-sm" style={{ color: getRiskColor(prediction) }}>{riskLevel}</span>
                </div>
              </>
            ) : (
              <div className="text-gray-400 text-center animate-pulse">
                <p className="text-4xl mb-2">🤖</p>
                <p>Waiting for prediction...</p>
              </div>
            )}
          </div>

          <button
            onClick={handleDownloadCertificate}
            className={`mt-6 py-3 px-6 text-white text-lg font-semibold rounded-lg shadow-md bg-green-500 hover:bg-green-600 transition ${!prediction && "cursor-not-allowed opacity-50"
              }`}
            disabled={!prediction}
          >
            Download Prediction Certificate
          </button>

          <p className="mt-6 text-gray-500 text-sm text-center">{riskMessage}</p>
        </div>
      </div>
    </div>
  );
};

export default Prediction;
