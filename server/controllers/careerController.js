import { StudentSuccess, AcademicData } from '../config/db.js';
import { calculateCareerDNA } from '../services/aiService.js';

export const getCareerDNA = async (req, res) => {
  try {
    const studentId = req.params.studentId || req.user._id;

    if (req.user.role === 'student' && req.user._id.toString() !== studentId.toString()) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const successData = await StudentSuccess.findOne({ studentId });
    if (successData && successData.careerDNA && successData.careerDNA.length > 0) {
      return res.json(successData.careerDNA);
    }

    // Fallback: calculate on the fly
    const academic = await AcademicData.findOne({ studentId });
    if (!academic) {
      return res.status(404).json({ message: 'Academic records not found to calculate DNA' });
    }

    const dna = calculateCareerDNA(academic);
    return res.json(dna);

  } catch (error) {
    console.error('Error fetching career DNA:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};
