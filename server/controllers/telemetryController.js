import { AcademicData, StudentSuccess, Student, User, Faculty, Meeting } from '../config/db.js';
import {
  calculateSuccessScore,
  calculateAcademicRisk,
  calculateBurnoutRisk,
  calculatePlacementReadiness,
  calculateCareerDNA,
  generateRecommendations
} from '../services/aiService.js';

// In-memory simulation activity logs
const telemetryLogs = [
  {
    id: 'init_1',
    timestamp: new Date(Date.now() - 300000),
    studentName: 'System Core',
    action: 'Telemetry Init',
    message: 'Real-time telemetry stream synchronized with data layer.',
    type: 'success'
  },
  {
    id: 'init_2',
    timestamp: new Date(Date.now() - 120000),
    studentName: 'Database Broker',
    action: 'Status Ping',
    message: 'JSON JSON-Fallback / MongoDB databases monitored. Performance index stable.',
    type: 'info'
  }
];

let autoTelemetryInterval = null;
let isAutoRunning = false;

// Action definitions for simulated updates
const SIMULATION_ACTIONS = {
  study_coding: {
    name: 'Practice Coding',
    description: 'Increments student coding hours, boosting placement readiness.',
    execute: async (academic) => {
      const addedHours = Math.floor(Math.random() * 4) + 3; // +3 to +6 hours
      academic.codingPracticeHours = (academic.codingPracticeHours || 0) + addedHours;
      return `practiced coding on HackerRank for ${addedHours} hours. Total coding time: ${academic.codingPracticeHours} hrs.`;
    }
  },
  complete_assignment: {
    name: 'Submit Assignment',
    description: 'Submits a pending assignment, reducing academic risk.',
    execute: async (academic) => {
      const assignments = academic.assignments || { completed: 0, pending: 0 };
      if (assignments.pending > 0) {
        assignments.pending -= 1;
        assignments.completed += 1;
        academic.assignments = assignments;
        return `submitted a pending assignment on Git classroom. Pending: ${assignments.pending}.`;
      } else {
        assignments.completed += 1;
        academic.assignments = assignments;
        return `submitted an extra credit paper. Completed assignments: ${assignments.completed}.`;
      }
    }
  },
  miss_assignment: {
    name: 'Miss Assignment',
    description: 'Adds a pending assignment, raising academic risk.',
    execute: async (academic) => {
      const assignments = academic.assignments || { completed: 0, pending: 0 };
      assignments.pending += 1;
      academic.assignments = assignments;
      return `missed assignment deadline. Pending tasks: ${assignments.pending}.`;
    }
  },
  submit_project: {
    name: 'Complete Project',
    description: 'Completes a project currently in progress.',
    execute: async (academic) => {
      const projects = academic.projects || [];
      const inProgress = projects.find(p => p.status === 'In Progress');
      if (inProgress) {
        inProgress.status = 'Completed';
        academic.projects = projects;
        return `successfully completed their capstone project: "${inProgress.title}"!`;
      } else {
        const newTitle = `Advanced Project #${projects.length + 1}`;
        projects.push({ title: newTitle, status: 'Completed' });
        academic.projects = projects;
        return `developed and completed a new capstone research project: "${newTitle}".`;
      }
    }
  },
  earn_certification: {
    name: 'Obtain Certification',
    description: 'Completes an industry certification (AWS, Azure, etc.)',
    execute: async (academic) => {
      const certNames = [
        'AWS Solutions Architect',
        'Google Cloud Digital Leader',
        'Azure Fundamentals (AZ-900)',
        'Kubernetes Certified Application Developer (CKAD)',
        'HackerRank Problem Solving (Gold)',
        'CompTIA Security+'
      ];
      const existing = (academic.certifications || []).map(c => c.certificateName);
      const newCert = certNames.find(c => !existing.includes(c)) || 'Technical Certificate Badge';
      
      if (!academic.certifications) {
        academic.certifications = [];
      }
      academic.certifications.push({
        certificateName: newCert,
        date: new Date()
      });
      return `earned industry credential: "${newCert}"!`;
    }
  },
  attend_class: {
    name: 'Attend Lectures',
    description: 'Boosts class attendance.',
    execute: async (academic) => {
      const attendance = academic.attendance || [];
      academic.attendance = attendance.map(a => {
        const boost = Math.floor(Math.random() * 4) + 2; // +2 to +5%
        return {
          ...a,
          percentage: Math.min(100, a.percentage + boost)
        };
      });
      return `attended all lectures. Average attendance index increased.`;
    }
  },
  skip_class: {
    name: 'Skip Class',
    description: 'Reduces class attendance, triggering warnings.',
    execute: async (academic) => {
      const attendance = academic.attendance || [];
      academic.attendance = attendance.map(a => {
        const drop = Math.floor(Math.random() * 4) + 3; // -3 to -6%
        return {
          ...a,
          percentage: Math.max(0, a.percentage - drop)
        };
      });
      return `missed multiple lectures. Attendance warnings triggered.`;
    }
  },
  improve_grades: {
    name: 'Improve Grades',
    description: 'Raises test scores.',
    execute: async (academic) => {
      const marks = academic.marks || [];
      academic.marks = marks.map(m => {
        const boost = Math.floor(Math.random() * 5) + 3; // +3 to +7%
        return {
          ...m,
          score: Math.min(100, m.score + boost)
        };
      });
      return `scored high on weekly evaluations. Grade index boosted.`;
    }
  },
  grade_drop: {
    name: 'Fail Evaluation',
    description: 'Reduces test scores.',
    execute: async (academic) => {
      const marks = academic.marks || [];
      academic.marks = marks.map(m => {
        const drop = Math.floor(Math.random() * 5) + 4; // -4 to -8%
        return {
          ...m,
          score: Math.max(0, m.score - drop)
        };
      });
      return `performed poorly in midterm tests. Grade index dropped.`;
    }
  }
};

// Log color code mapping helper
const getLogType = (actionKey, risk, burnout) => {
  if (risk === 'High Risk' || burnout === 'High') return 'danger';
  if (risk === 'Medium Risk') return 'warning';
  if (['skip_class', 'grade_drop', 'miss_assignment'].includes(actionKey)) return 'warning';
  if (['submit_project', 'earn_certification'].includes(actionKey)) return 'success';
  return 'info';
};

// Core Execution Utility
const executeSimulation = async (studentId, actionKey) => {
  const student = await Student.findOne({ studentId });
  if (!student) throw new Error('Student record not found');

  const user = await User.findById(studentId);
  const studentName = user ? user.name : 'Unknown Student';

  const academic = await AcademicData.findOne({ studentId });
  if (!academic) throw new Error('Student academic profile not found');

  const action = SIMULATION_ACTIONS[actionKey];
  if (!action) throw new Error('Invalid simulation action');

  // Mutate local object
  const detailLog = await action.execute(academic);

  // Write changes to db
  const updatedAcademic = await AcademicData.findOneAndUpdate(
    { studentId },
    academic,
    { new: true }
  );

  // Recalculate AI metrics
  const successScore = calculateSuccessScore(updatedAcademic);
  const academicRisk = calculateAcademicRisk(updatedAcademic);
  const burnoutRisk = calculateBurnoutRisk(updatedAcademic);
  const readinessData = calculatePlacementReadiness(updatedAcademic);
  const careerDNA = calculateCareerDNA(updatedAcademic);
  const recommendations = generateRecommendations(updatedAcademic, successScore, academicRisk, burnoutRisk, readinessData);

  const updatedSuccess = await StudentSuccess.findOneAndUpdate(
    { studentId },
    {
      successScore,
      academicRisk,
      burnoutRisk,
      placementReadiness: readinessData.score,
      placementStatus: readinessData.status,
      careerDNA,
      recommendations,
      generatedAt: new Date()
    },
    { new: true, upsert: true }
  );

  const logMessage = `${studentName} ${detailLog}`;
  const logEntry = {
    id: 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
    timestamp: new Date(),
    studentId,
    studentName,
    action: action.name,
    message: logMessage,
    type: getLogType(actionKey, academicRisk, burnoutRisk)
  };

  telemetryLogs.unshift(logEntry);
  if (telemetryLogs.length > 100) telemetryLogs.pop();

  // Emits events via Socket.io
  if (global.io) {
    // 1. Global console stream
    global.io.emit('telemetry_log', logEntry);

    // 2. Direct Student channel
    global.io.to(studentId.toString()).emit('telemetry_update', {
      studentId,
      academicData: updatedAcademic,
      successData: updatedSuccess
    });

    // 3. Direct Advisor channel
    if (student.advisorId) {
      const enrichedStudent = {
        _id: studentId,
        name: studentName,
        email: user ? user.email : '',
        department: student.department,
        year: student.year,
        successScore,
        academicRisk,
        burnoutRisk,
        placementReadiness: readinessData.score,
        placementStatus: readinessData.status,
        academicRecord: {
          attendanceCount: updatedAcademic.attendance?.length || 0,
          marksCount: updatedAcademic.marks?.length || 0,
          assignments: updatedAcademic.assignments || { completed: 0, pending: 0 },
          projectsCount: updatedAcademic.projects?.length || 0,
          certificationsCount: updatedAcademic.certifications?.length || 0
        }
      };
      
      global.io.to(student.advisorId.toString()).emit('advisor_student_update', enrichedStudent);

      // Trigger standard risk alerts
      if (academicRisk === 'High Risk') {
        global.io.to(student.advisorId.toString()).emit('academic_risk_alert', {
          studentId,
          studentName,
          risk: academicRisk
        });
      }
    }

    // 4. Admin stats channel
    const studentCount = await Student.countDocuments();
    const advisorCount = await Faculty.countDocuments();
    const meetingCount = await Meeting.countDocuments();
    const successes = await StudentSuccess.find();
    
    const avgSuccessScore = successes.length > 0
      ? Math.round(successes.reduce((sum, s) => sum + s.successScore, 0) / successes.length)
      : 0;

    const avgPlacementScore = successes.length > 0
      ? Math.round(successes.reduce((sum, s) => sum + s.placementReadiness, 0) / successes.length)
      : 0;

    const riskCounts = { 'High Risk': 0, 'Medium Risk': 0, 'Low Risk': 0 };
    successes.forEach(s => { riskCounts[s.academicRisk] = (riskCounts[s.academicRisk] || 0) + 1; });

    const burnoutCounts = { High: 0, Medium: 0, Low: 0 };
    successes.forEach(s => { burnoutCounts[s.burnoutRisk] = (burnoutCounts[s.burnoutRisk] || 0) + 1; });

    const studentsList = await Student.find();
    const deptCounts = {};
    studentsList.forEach(s => { deptCounts[s.department] = (deptCounts[s.department] || 0) + 1; });

    const updatedStats = {
      counts: { students: studentCount, advisors: advisorCount, meetings: meetingCount },
      averages: { successScore: avgSuccessScore, placementReadiness: avgPlacementScore },
      riskBreakdown: riskCounts,
      burnoutBreakdown: burnoutCounts,
      departmentBreakdown: deptCounts
    };

    global.io.to('admin').emit('admin_stats_update', updatedStats);
  }

  return { logEntry, academicData: updatedAcademic, successData: updatedSuccess };
};

// API Endpoint Handlers
export const simulateTelemetryAction = async (req, res) => {
  try {
    const { studentId, actionKey } = req.body;

    if (!studentId || !actionKey) {
      return res.status(400).json({ message: 'Missing studentId or actionKey' });
    }

    const result = await executeSimulation(studentId, actionKey);
    return res.json({ message: 'Telemetry event pushed successfully', ...result });

  } catch (error) {
    console.error('Manual telemetry simulation error:', error);
    return res.status(500).json({ message: 'Simulation error', error: error.message });
  }
};

export const getTelemetryStatus = async (req, res) => {
  return res.json({
    isAutoRunning,
    availableActions: Object.keys(SIMULATION_ACTIONS).map(key => ({
      key,
      name: SIMULATION_ACTIONS[key].name,
      description: SIMULATION_ACTIONS[key].description
    }))
  });
};

export const getTelemetryLogs = async (req, res) => {
  return res.json(telemetryLogs);
};

export const toggleAutoTelemetry = async (req, res) => {
  try {
    const { enabled } = req.body;

    if (enabled === true && !isAutoRunning) {
      isAutoRunning = true;
      
      autoTelemetryInterval = setInterval(async () => {
        try {
          const students = await Student.find();
          if (students.length === 0) return;

          const randomStudent = students[Math.floor(Math.random() * students.length)];
          const actionKeys = Object.keys(SIMULATION_ACTIONS);
          const randomAction = actionKeys[Math.floor(Math.random() * actionKeys.length)];

          await executeSimulation(randomStudent.studentId, randomAction);
        } catch (e) {
          console.error('Background automated simulation execution failure:', e);
        }
      }, 6000); // Trigger every 6 seconds

      console.log('--- Automated Telemetry Generator Started ---');
    } else if (enabled === false && isAutoRunning) {
      isAutoRunning = false;
      clearInterval(autoTelemetryInterval);
      autoTelemetryInterval = null;
      console.log('--- Automated Telemetry Generator Terminated ---');
    }

    return res.json({ isAutoRunning });

  } catch (error) {
    console.error('Toggle automated telemetry failure:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getStudentsForSimulation = async (req, res) => {
  try {
    const students = await Student.find();
    const studentIds = students.map(s => s.studentId);
    const users = await User.find({ _id: { $in: studentIds } });
    
    const list = students.map(s => {
      const u = users.find(user => user._id.toString() === s.studentId.toString()) || {};
      return {
        _id: s.studentId,
        name: u.name || 'Unknown Student',
        email: u.email || '',
        department: s.department,
        year: s.year
      };
    });
    return res.json(list);
  } catch (error) {
    console.error('getStudentsForSimulation error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};
