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

export const seedDatabase = async () => {
  try {
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      console.log('Database already has data. Skipping seed.');
      return;
    }

    console.log('Seeding database with demo records...');

    const salt = bcrypt.genSaltSync(10);
    const defaultPassword = bcrypt.hashSync('password123', salt);

    // 1. Create Users
    const usersToCreate = [
      {
        name: 'Dr. Evelyn Miller',
        email: 'advisor@success.edu',
        password: defaultPassword,
        role: 'faculty'
      },
      {
        name: 'Alex Mercer',
        email: 'student@success.edu',
        password: defaultPassword,
        role: 'student'
      },
      {
        name: 'John Doe',
        email: 'risk@success.edu',
        password: defaultPassword,
        role: 'student'
      },
      {
        name: 'Sarah Connor',
        email: 'burnout@success.edu',
        password: defaultPassword,
        role: 'student'
      },
      {
        name: 'Admin HOD',
        email: 'admin@success.edu',
        password: defaultPassword,
        role: 'admin'
      }
    ];

    const createdUsers = [];
    for (const u of usersToCreate) {
      const created = await User.create(u);
      createdUsers.push(created);
    }

    const advisorUser = createdUsers.find(u => u.role === 'faculty');
    const studentUser1 = createdUsers.find(u => u.email === 'student@success.edu');
    const studentUser2 = createdUsers.find(u => u.email === 'risk@success.edu');
    const studentUser3 = createdUsers.find(u => u.email === 'burnout@success.edu');

    // 2. Create Faculty record
    await Faculty.create({
      facultyId: advisorUser._id,
      department: 'Computer Science',
      designation: 'Associate Professor'
    });

    // 3. Create Student records
    const studentsData = [
      {
        studentId: studentUser1._id,
        department: 'Computer Science',
        year: 3,
        advisorId: advisorUser._id
      },
      {
        studentId: studentUser2._id,
        department: 'Computer Science',
        year: 3,
        advisorId: advisorUser._id
      },
      {
        studentId: studentUser3._id,
        department: 'Computer Science',
        year: 4,
        advisorId: advisorUser._id
      }
    ];

    for (const s of studentsData) {
      await Student.create(s);
    }

    // 4. Create Academic data
    const mockAcademicRecords = [
      {
        studentId: studentUser1._id,
        attendance: [
          { subject: 'Data Structures (CS101)', percentage: 88 },
          { subject: 'Database Systems (CS102)', percentage: 85 },
          { subject: 'Web Technologies (CS103)', percentage: 92 },
          { subject: 'Computer Networks (CS104)', percentage: 80 }
        ],
        marks: [
          { subject: 'Data Structures (CS101)', score: 82 },
          { subject: 'Database Systems (CS102)', score: 78 },
          { subject: 'Web Technologies (CS103)', score: 88 },
          { subject: 'Computer Networks (CS104)', score: 75 }
        ],
        assignments: { completed: 14, pending: 2 },
        projects: [
          { title: 'AI Portfolio Platform', status: 'Completed' },
          { title: 'E-commerce Microservices', status: 'In Progress' }
        ],
        certifications: [
          { certificateName: 'AWS Cloud Practitioner', date: new Date('2026-02-15') },
          { certificateName: 'HackerRank Problem Solving (Gold)', date: new Date('2026-05-10') }
        ],
        aptitudeScore: 82,
        codingPracticeHours: 95,
        communicationScore: 80
      },
      {
        studentId: studentUser2._id,
        attendance: [
          { subject: 'Data Structures (CS101)', percentage: 55 },
          { subject: 'Database Systems (CS102)', percentage: 60 },
          { subject: 'Web Technologies (CS103)', percentage: 62 },
          { subject: 'Computer Networks (CS104)', percentage: 50 }
        ],
        marks: [
          { subject: 'Data Structures (CS101)', score: 45 },
          { subject: 'Database Systems (CS102)', score: 42 },
          { subject: 'Web Technologies (CS103)', score: 50 },
          { subject: 'Computer Networks (CS104)', score: 38 }
        ],
        assignments: { completed: 4, pending: 8 },
        projects: [
          { title: 'Static Resume Page', status: 'In Progress' }
        ],
        certifications: [],
        aptitudeScore: 40,
        codingPracticeHours: 10,
        communicationScore: 55
      },
      {
        studentId: studentUser3._id,
        attendance: [
          { subject: 'Data Structures (CS101)', percentage: 68 },
          { subject: 'Database Systems (CS102)', percentage: 65 },
          { subject: 'Web Technologies (CS103)', percentage: 70 },
          { subject: 'Computer Networks (CS104)', percentage: 60 }
        ],
        marks: [
          { subject: 'Data Structures (CS101)', score: 58 },
          { subject: 'Database Systems (CS102)', score: 55 },
          { subject: 'Web Technologies (CS103)', score: 62 },
          { subject: 'Computer Networks (CS104)', score: 54 }
        ],
        assignments: { completed: 6, pending: 9 },
        projects: [
          { title: 'Autonomous Rover', status: 'In Progress' },
          { title: 'Cybersecurity Sandbox', status: 'Not Started' }
        ],
        certifications: [
          { certificateName: 'CompTIA Security+', date: new Date('2026-01-20') }
        ],
        aptitudeScore: 68,
        codingPracticeHours: 35,
        communicationScore: 70
      }
    ];

    for (const record of mockAcademicRecords) {
      await AcademicData.create(record);

      // Compute success metrics
      const successScore = calculateSuccessScore(record);
      const academicRisk = calculateAcademicRisk(record);
      const burnoutRisk = calculateBurnoutRisk(record);
      const readinessData = calculatePlacementReadiness(record);
      const careerDNA = calculateCareerDNA(record);
      const recommendations = generateRecommendations(
        record,
        successScore,
        academicRisk,
        burnoutRisk,
        readinessData
      );

      await StudentSuccess.create({
        studentId: record.studentId,
        successScore,
        academicRisk,
        burnoutRisk,
        placementReadiness: readinessData.score,
        placementStatus: readinessData.status,
        careerDNA,
        recommendations,
        generatedAt: new Date()
      });
    }

    console.log('Database seeded successfully.');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
};
