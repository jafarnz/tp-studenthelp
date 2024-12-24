interface Module {
  id: string;
  name: string;
}

interface ModuleCategory {
  name: string;
  modules: Module[];
}

interface DiplomaModules {
  [key: string]: ModuleCategory[];
}

export const diplomaModules: DiplomaModules = {
  "Information Technology": [
    {
      name: "Core Modules",
      modules: [
        { id: "IT1234", name: "Web Development" },
        { id: "IT2345", name: "Database Systems" },
        { id: "IT3456", name: "Cybersecurity" },
        { id: "IT4567", name: "Mobile App Development" },
        { id: "IT5678", name: "Cloud Computing" }
      ]
    }
  ],
  "Big Data & Analytics": [
    {
      name: "Analytics Modules",
      modules: [
        { id: "BDA1234", name: "Data Mining" },
        { id: "BDA2345", name: "Statistical Analysis" },
        { id: "BDA3456", name: "Machine Learning" },
        { id: "BDA4567", name: "Data Visualization" }
      ]
    }
  ],
  "Cybersecurity & Digital Forensics": [
    {
      name: "Security Modules",
      modules: [
        { id: "CDF1234", name: "Network Security" },
        { id: "CDF2345", name: "Digital Forensics" },
        { id: "CDF3456", name: "Ethical Hacking" },
        { id: "CDF4567", name: "Security Operations" }
      ]
    }
  ],
  "Business": [
    {
      name: "Core Modules",
      modules: [
        { id: "BA1234", name: "Business Analytics" },
        { id: "BA2345", name: "Digital Marketing" },
        { id: "BA3456", name: "Finance" },
        { id: "BA4567", name: "Project Management" },
        { id: "BA5678", name: "International Business" }
      ]
    }
  ],
  "Engineering": [
    {
      name: "Core Modules",
      modules: [
        { id: "EN1234", name: "Engineering Mathematics" },
        { id: "EN2345", name: "Circuit Analysis" },
        { id: "EN3456", name: "Mechanics" },
        { id: "EN4567", name: "Thermodynamics" },
        { id: "EN5678", name: "Control Systems" }
      ]
    }
  ]
};

// Helper function to get modules for a specific diploma
export function getModulesForDiploma(diploma: string): ModuleCategory[] {
  return diplomaModules[diploma] || [];
}

// Get all module categories (for validation)
export const moduleCategories = Object.values(diplomaModules).flat();
