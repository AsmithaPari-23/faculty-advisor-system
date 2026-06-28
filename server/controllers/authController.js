import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User, Student, Faculty, AcademicData, StudentSuccess } from '../config/db.js';
import {
  calculateSuccessScore,
  calculateAcademicRisk,
  calculateBurnoutRisk,
  calculatePlacementReadiness,
  calculateCareerDNA,
  generateRecommendations
} from '../services/aiService.js';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecurecyberkey';

const generateToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, { expiresIn: '30d' });
};

export const registerUser = async (req, res) => {
  try {
    const { name, email, password, role, department, year, designation, advisorId } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Please provide name, email, password, and role' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Hash Password
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);

    // Create User
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role
    });

    if (role === 'student') {
      // Find a default faculty advisor if none provided
      let finalAdvisorId = advisorId;
      if (!finalAdvisorId) {
        const defaultAdvisor = await Faculty.findOne({});
        finalAdvisorId = defaultAdvisor ? defaultAdvisor.facultyId : 'system_admin';
      }

      // Create Student details record
      await Student.create({
        studentId: user._id,
        department: department || 'Computer Science',
        year: parseInt(year) || 1,
        advisorId: finalAdvisorId
      });

      // Create initial academic records
      const initialAcademic = await AcademicData.create({
        studentId: user._id,
        attendance: [
          { subject: 'Introduction to Programming (CS101)', percentage: 80 },
          { subject: 'Database Management (CS102)', percentage: 80 },
          { subject: 'Web Architecture (CS103)', percentage: 80 }
        ],
        marks: [
          { subject: 'Introduction to Programming (CS101)', score: 75 },
          { subject: 'Database Management (CS102)', score: 70 },
          { subject: 'Web Architecture (CS103)', score: 78 }
        ],
        assignments: { completed: 5, pending: 1 },
        projects: [
          { title: 'Personal Static Website', status: 'Completed' }
        ],
        certifications: [],
        aptitudeScore: 65,
        codingPracticeHours: 20,
        communicationScore: 70
      });

      // Compute success metrics
      const successScore = calculateSuccessScore(initialAcademic);
      const academicRisk = calculateAcademicRisk(initialAcademic);
      const burnoutRisk = calculateBurnoutRisk(initialAcademic);
      const readinessData = calculatePlacementReadiness(initialAcademic);
      const careerDNA = calculateCareerDNA(initialAcademic);
      const recommendations = generateRecommendations(
        initialAcademic,
        successScore,
        academicRisk,
        burnoutRisk,
        readinessData
      );

      await StudentSuccess.create({
        studentId: user._id,
        successScore,
        academicRisk,
        burnoutRisk,
        placementReadiness: readinessData.score,
        placementStatus: readinessData.status,
        careerDNA,
        recommendations,
        generatedAt: new Date()
      });

    } else if (role === 'faculty') {
      // Create Faculty details record
      await Faculty.create({
        facultyId: user._id,
        department: department || 'Computer Science',
        designation: designation || 'Assistant Professor'
      });
    }

    return res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id)
    });

  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ message: 'Server error during registration', error: error.message });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    return res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id)
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Server error during login', error: error.message });
  }
};
