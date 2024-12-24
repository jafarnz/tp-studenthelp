export const schools = [
  {
    name: 'School of Applied Science',
    diplomas: [
      'Chemical Engineering',
      'Food, Nutrition & Culinary Science',
      'Medical Biotechnology',
      'Pharmaceutical Science',
      'Veterinary Technology',
      'Common Science Programme'
    ]
  },
  {
    name: 'School of Business',
    diplomas: [
      'Accountancy & Finance',
      'Business',
      'Communications & Media Management',
      'Culinary & Catering Management',
      'Hospitality & Tourism Management',
      'International Trade & Logistics',
      'Law & Management',
      'Marketing',
      'Common Business Programme'
    ]
  },
  {
    name: 'School of Design',
    diplomas: [
      'Communication Design',
      'Digital Film & Television',
      'Interior Architecture & Design',
      'Product Experience & Design',
      'Common Design Programme'
    ]
  },
  {
    name: 'School of Engineering',
    diplomas: [
      'Aerospace Electronics',
      'Aerospace Engineering',
      'Aviation Management',
      'Biomedical Engineering',
      'Business Process & Systems Engineering',
      'Computer Engineering',
      'Electronics Engineering',
      'Mechatronics',
      'Architectural Technology & Building Services',
      'Integrated Facility Management',
      'Common Engineering Programme'
    ]
  },
  {
    name: 'School of Humanities & Social Sciences',
    diplomas: [
      'Early Childhood Development & Education',
      'Psychology Studies',
      'Social Sciences in Gerontology'
    ]
  },
  {
    name: 'School of Informatics & IT',
    diplomas: [
      'Big Data & Analytics',
      'Cybersecurity & Digital Forensics',
      'Immersive Media & Game Development',
      'Information Technology',
      'Applied Artificial Intelligence',
      'Common ICT Programme'
    ]
  }
];

export type School = typeof schools[number];
export type Diploma = School['diplomas'][number];
