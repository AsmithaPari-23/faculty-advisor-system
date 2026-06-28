import { AcademicData, StudentSuccess } from '../config/db.js';
import {
  calculateSuccessScore,
  calculatePlacementReadiness,
  calculateCareerDNA
} from '../services/aiService.js';

export const simulateFutureMe = async (req, res) => {
  try {
    const studentId = req.user._id;
    const { attendance, marks, projects, certifications, assignments } = req.body;

    // Validate inputs
    if (attendance === undefined || marks === undefined || projects === undefined || certifications === undefined || assignments === undefined) {
      return res.status(400).json({ message: 'Please provide attendance, marks, projects, certifications, and assignments values' });
    }

    // 1. Fetch current (actual) academic data & precalculated success metrics
    const actualAcademic = await AcademicData.findOne({ studentId });
    if (!actualAcademic) {
      return res.status(404).json({ message: 'Current academic data not found' });
    }

    const successData = await StudentSuccess.findOne({ studentId });
    const currentScore = successData ? successData.successScore : calculateSuccessScore(actualAcademic);
    const currentPlacement = successData ? successData.placementReadiness : calculatePlacementReadiness(actualAcademic).score;
    const currentCareerDNA = successData ? successData.careerDNA : calculateCareerDNA(actualAcademic);

    // 2. Build mock academic data object representing simulated parameters
    // We map subject counts or keep database structure matching
    const simAcademic = {
      // Mock averages map back directly to the calculations
      attendance: Array.from({ length: 4 }, () => ({ percentage: parseFloat(attendance) })),
      marks: Array.from({ length: 4 }, () => ({ score: parseFloat(marks) })),
      assignments: {
        completed: Math.round((parseFloat(assignments) / 100) * 10),
        pending: Math.round(((100 - parseFloat(assignments)) / 100) * 10)
      },
      // Array of dummy projects to meet the count
      projects: Array.from({ length: parseInt(projects) }, (_, i) => ({
        title: `Simulated Project ${i + 1}`,
        status: 'Completed'
      })),
      // Array of dummy certs
      certifications: Array.from({ length: parseInt(certifications) }, (_, i) => ({
        certificateName: `Simulated Certification ${i + 1}`,
        date: new Date()
      })),
      // Baseline adjustments for simulation
      aptitudeScore: Math.min(100, Math.round(parseFloat(marks) * 1.05)),
      codingPracticeHours: Math.min(150, 20 + parseInt(projects) * 25 + parseInt(certifications) * 15),
      communicationScore: Math.min(100, 70 + parseInt(projects) * 5)
    };

    // Calculate predictions
    const predictedScore = calculateSuccessScore(simAcademic);
    const predictedPlacementData = calculatePlacementReadiness(simAcademic);
    const predictedPlacement = predictedPlacementData.score;
    const predictedCareerDNA = calculateCareerDNA(simAcademic);

    // Formulate personalized recommendation message
    const scoreDiff = predictedScore - currentScore;
    const placementDiff = predictedPlacement - currentPlacement;

    let recommendationMsg = '';
    if (scoreDiff <= 0 && placementDiff <= 0) {
      recommendationMsg = 'Increasing your marks, completing more projects, and earning certifications will boost your performance score.';
    } else {
      recommendationMsg = `By increasing your attendance to ${attendance}%, obtaining ${projects} completed project(s), and completing ${certifications} certification(s), your success score could increase by ${scoreDiff > 0 ? scoreDiff : 0} points, and your placement readiness score will surge by ${placementDiff > 0 ? placementDiff : 0}%!`;
    }

    // Include detailed analysis of the role shifting
    return res.json({
      currentScore,
      predictedScore,
      currentPlacement,
      predictedPlacement,
      currentCareerDNA,
      predictedCareerDNA,
      recommendations: recommendationMsg
    });

  } catch (error) {
    console.error('Future Me Simulation error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};
