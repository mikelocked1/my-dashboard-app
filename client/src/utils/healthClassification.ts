export type HealthClassification = "normal" | "good" | "high" | "low" | "critical";

export const classifyHeartRate = (heartRate: number): HealthClassification => {
  if (heartRate < 50) return "critical";
  if (heartRate < 60) return "low";
  if (heartRate <= 100) return "normal";
  if (heartRate <= 120) return "high";
  return "critical";
};

export const classifyBloodPressure = (bloodPressureStr: string): HealthClassification => {
  // Parse blood pressure string like "120/80"
  const parts = bloodPressureStr.split('/');
  if (parts.length !== 2) return "normal";
  
  const systolic = parseInt(parts[0]);
  const diastolic = parseInt(parts[1]);
  
  if (isNaN(systolic) || isNaN(diastolic)) return "normal";
  
  // Critical conditions
  if (systolic >= 180 || diastolic >= 120) return "critical";
  if (systolic < 90 || diastolic < 60) return "critical";
  
  // High blood pressure
  if (systolic >= 140 || diastolic >= 90) return "high";
  
  // Elevated
  if (systolic >= 120 && systolic <= 129 && diastolic < 80) return "high";
  
  // Normal
  if (systolic < 120 && diastolic < 80) return "normal";
  
  return "normal";
};

export const classifyWeight = (weight: number, height: number): HealthClassification => {
  // Calculate BMI
  const heightInMeters = height / 100;
  const bmi = weight / (heightInMeters * heightInMeters);
  
  if (bmi < 18.5) return "low";
  if (bmi >= 18.5 && bmi < 25) return "normal";
  if (bmi >= 25 && bmi < 30) return "high";
  return "critical";
};

export const classifyBloodSugar = (bloodSugar: number, context: "fasting" | "random" = "random"): HealthClassification => {
  if (context === "fasting") {
    if (bloodSugar < 70) return "low";
    if (bloodSugar <= 99) return "normal";
    if (bloodSugar <= 125) return "high";
    return "critical";
  } else {
    // Random blood sugar
    if (bloodSugar < 70) return "low";
    if (bloodSugar <= 140) return "normal";
    if (bloodSugar <= 199) return "high";
    return "critical";
  }
};

export const classifyTemperature = (temperature: number): HealthClassification => {
  if (temperature < 35.0) return "critical";
  if (temperature < 36.0) return "low";
  if (temperature <= 37.2) return "normal";
  if (temperature <= 38.0) return "high";
  return "critical";
};

export const classifySteps = (steps: number): HealthClassification => {
  if (steps < 5000) return "low";
  if (steps < 8000) return "normal";
  if (steps >= 10000) return "good";
  return "normal";
};

export const classifySleep = (hours: number): HealthClassification => {
  if (hours < 5) return "critical";
  if (hours < 6) return "low";
  if (hours >= 7 && hours <= 9) return "good";
  if (hours >= 6 && hours < 7) return "normal";
  if (hours > 9) return "high";
  return "normal";
};

export const getClassificationColor = (classification: HealthClassification): string => {
  switch (classification) {
    case "good":
    case "normal":
      return "text-success bg-success/10 border-success/20";
    case "high":
      return "text-orange-600 bg-orange-100 border-orange-200 dark:bg-orange-900/30 dark:border-orange-800";
    case "low":
      return "text-blue-600 bg-blue-100 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800";
    case "critical":
      return "text-accent bg-accent/10 border-accent/20";
    default:
      return "text-gray-600 bg-gray-100 border-gray-200 dark:bg-gray-700 dark:border-gray-600";
  }
};

export const getClassificationText = (classification: HealthClassification): string => {
  switch (classification) {
    case "good": return "Good";
    case "normal": return "Normal";
    case "high": return "High";
    case "low": return "Low";
    case "critical": return "Critical";
    default: return "Unknown";
  }
};

export const getHealthAdvice = (type: string, classification: HealthClassification): string => {
  const advice: { [key: string]: { [key in HealthClassification]?: string } } = {
    heart_rate: {
      low: "Consider consulting your doctor about your low heart rate. Light exercise may help improve circulation.",
      high: "Your heart rate is elevated. Avoid caffeine and practice relaxation techniques. Consult your doctor if persistent.",
      critical: "Seek immediate medical attention for your heart rate readings.",
      normal: "Your heart rate is within the normal range. Keep up your current lifestyle.",
      good: "Excellent heart rate! Continue your healthy habits."
    },
    blood_pressure: {
      low: "Stay hydrated and avoid sudden position changes. Consult your doctor about low blood pressure.",
      high: "Monitor your blood pressure regularly. Reduce sodium intake and increase physical activity.",
      critical: "Seek immediate medical attention for your blood pressure readings.",
      normal: "Your blood pressure is healthy. Maintain your current lifestyle.",
      good: "Excellent blood pressure control! Keep following your current routine."
    },
    steps: {
      low: "Try to increase your daily activity. Start with short walks and gradually increase duration.",
      normal: "Good activity level! Try to reach 10,000 steps for optimal health benefits.",
      good: "Excellent daily activity! You're meeting recommended exercise guidelines.",
    },
    sleep: {
      low: "Prioritize getting more sleep. Aim for 7-9 hours per night for optimal health.",
      high: "You may be getting too much sleep. Consider consulting a sleep specialist.",
      critical: "Seek medical advice about your sleep patterns.",
      normal: "Good sleep duration. Focus on sleep quality and consistency.",
      good: "Excellent sleep habits! Maintain your current sleep schedule."
    }
  };

  return advice[type]?.[classification] || "Continue monitoring your health metrics regularly.";
};

export const isHealthMetricCritical = (type: string, value: string): boolean => {
  switch (type) {
    case "heart_rate":
      const hr = parseInt(value);
      return hr < 50 || hr > 120;
    case "blood_pressure":
      const classification = classifyBloodPressure(value);
      return classification === "critical";
    case "temperature":
      const temp = parseFloat(value);
      return temp < 35.0 || temp > 38.0;
    case "blood_sugar":
      const bs = parseFloat(value);
      return bs < 70 || bs > 200;
    default:
      return false;
  }
};
