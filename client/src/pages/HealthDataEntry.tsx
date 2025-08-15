import React from "react";
import HealthDataEntry from "@/components/Health/HealthDataEntry";

const HealthDataEntryPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Health Data Entry
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Record your health metrics easily and securely.
        </p>
      </div>
      
      <HealthDataEntry />
    </div>
  );
};

export default HealthDataEntryPage;