import { StudentSuccess, AcademicData, Student } from '../config/db.js';
import {
  calculateSuccessScore,
  calculateAcademicRisk,
  calculateBurnoutRisk,
  calculatePlacementReadiness,
  calculateCareerDNA,
  generateRecommendations
} from '../services/aiService.js';

export const getStudentSuccessData = async (req, res) => {
  try {
    const studentId = req.params.studentId || req.user._id;

    // Check authorization: if role is student, they can only view their own success profile
    if (req.user.role === 'student' && req.user._id.toString() !== studentId.toString()) {
      return res.status(403).json({ message: 'Forbidden: You can only view your own success details' });
    }

    // If faculty, verify they advise this student
    if (req.user.role === 'faculty') {
      const relationship = await Student.findOne({ studentId, advisorId: req.user._id });
      if (!relationship) {
        return res.status(403).json({ message: 'Forbidden: This student is not assigned to you' });
      }
    }

    let successData = await StudentSuccess.findOne({ studentId });
    if (!successData) {
      // If not computed yet, compute it now
      const academic = await AcademicData.findOne({ studentId });
      if (!academic) {
        return res.status(404).json({ message: 'Academic records not found for this student' });
      }

      const score = calculateSuccessScore(academic);
      const risk = calculateAcademicRisk(academic);
      const burnout = calculateBurnoutRisk(academic);
      const placement = calculatePlacementReadiness(academic);
      const careerDNA = calculateCareerDNA(academic);
      const recs = generateRecommendations(academic, score, risk, burnout, placement);

      successData = await StudentSuccess.create({
        studentId,
        successScore: score,
        academicRisk: risk,
        burnoutRisk: burnout,
        placementReadiness: placement.score,
        placementStatus: placement.status,
        careerDNA,
        recommendations: recs,
        generatedAt: new Date()
      });
    }

    return res.json(successData);

  } catch (error) {
    console.error('Error fetching success metrics:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const generateSuccessData = async (req, res) => {
  try {
    const studentId = req.user._id;

    const academic = await AcademicData.findOne({ studentId });
    if (!academic) {
      return res.status(404).json({ message: 'Academic records not found' });
    }

    const score = calculateSuccessScore(academic);
    const risk = calculateAcademicRisk(academic);
    const burnout = calculateBurnoutRisk(academic);
    const placement = calculatePlacementReadiness(academic);
    const careerDNA = calculateCareerDNA(academic);
    const recs = generateRecommendations(academic, score, risk, burnout, placement);

    const successData = await StudentSuccess.findOneAndUpdate(
      { studentId },
      {
        successScore: score,
        academicRisk: risk,
        burnoutRisk: burnout,
        placementReadiness: placement.score,
        placementStatus: placement.status,
        careerDNA,
        recommendations: recs,
        generatedAt: new Date()
      },
      { new: true, upsert: true }
    );

    // Notify advisor of risk change if high risk
    if (risk === 'High Risk' && global.io) {
      const studentInfo = await Student.findOne({ studentId });
      if (studentInfo && studentInfo.advisorId) {
        global.io.to(studentInfo.advisorId.toString()).emit('academic_risk_alert', {
          studentId,
          studentName: req.user.name,
          risk
        });
      }
    }

    return res.json({ message: 'Success profile generated successfully', successData });

  } catch (error) {
    console.error('Error generating success data:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getRecommendations = async (req, res) => {
  try {
    const studentId = req.params.studentId || req.user._id;

    if (req.user.role === 'student' && req.user._id.toString() !== studentId.toString()) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const successData = await StudentSuccess.findOne({ studentId });
    if (!successData) {
      return res.status(404).json({ message: 'Success data not generated yet' });
    }

    return res.json(successData.recommendations || []);

  } catch (error) {
    console.error('Error fetching recommendations:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};
