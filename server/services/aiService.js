// AI Student Success Platform Analytics Service

export const calculateSuccessScore = (academicData) => {
  if (!academicData) return 0;

  // 1. Marks: Average of all subject scores
  const subjectScores = academicData.marks || [];
  const avgMarks = subjectScores.length > 0
    ? subjectScores.reduce((sum, item) => sum + item.score, 0) / subjectScores.length
    : 0;

  // 2. Attendance: Average of subject percentages
  const attendanceRecords = academicData.attendance || [];
  const avgAttendance = attendanceRecords.length > 0
    ? attendanceRecords.reduce((sum, item) => sum + item.percentage, 0) / attendanceRecords.length
    : 0;

  // 3. Assignments Completion Rate
  const assignments = academicData.assignments || { completed: 0, pending: 0 };
  const totalAssignments = (assignments.completed || 0) + (assignments.pending || 0);
  const assignmentRate = totalAssignments > 0
    ? ((assignments.completed || 0) / totalAssignments) * 100
    : 0;

  // 4. Projects Score (completed projects = 100, in progress = 50, not started = 0)
  const projects = academicData.projects || [];
  const projectPoints = projects.reduce((sum, p) => {
    if (p.status === 'Completed') return sum + 100;
    if (p.status === 'In Progress') return sum + 50;
    return sum;
  }, 0);
  const projectScore = projects.length > 0 ? Math.min(100, projectPoints / projects.length) : 0;

  // 5. Certifications Score (each certificate is 35 points, max 100)
  const certs = academicData.certifications || [];
  const certsScore = Math.min(100, certs.length * 35);

  // Apply weights
  // 40% Marks + 25% Attendance + 15% Assignments + 10% Projects + 10% Certifications
  const score = (0.40 * avgMarks) +
                (0.25 * avgAttendance) +
                (0.15 * assignmentRate) +
                (0.10 * projectScore) +
                (0.10 * certsScore);

  return Math.round(score);
};

export const calculateAcademicRisk = (academicData) => {
  if (!academicData) return 'Low Risk';

  const subjectScores = academicData.marks || [];
  const avgMarks = subjectScores.length > 0
    ? subjectScores.reduce((sum, item) => sum + item.score, 0) / subjectScores.length
    : 0;

  const attendanceRecords = academicData.attendance || [];
  const avgAttendance = attendanceRecords.length > 0
    ? attendanceRecords.reduce((sum, item) => sum + item.percentage, 0) / attendanceRecords.length
    : 0;

  const assignments = academicData.assignments || { completed: 0, pending: 0 };
  const pendingCount = assignments.pending || 0;

  if (avgMarks < 50 || avgAttendance < 70 || pendingCount > 6) {
    return 'High Risk';
  } else if ((avgMarks >= 50 && avgMarks < 70) || (avgAttendance >= 70 && avgAttendance < 80) || pendingCount > 3) {
    return 'Medium Risk';
  }
  return 'Low Risk';
};

export const calculateBurnoutRisk = (academicData) => {
  if (!academicData) return 'Low';

  const attendanceRecords = academicData.attendance || [];
  const avgAttendance = attendanceRecords.length > 0
    ? attendanceRecords.reduce((sum, item) => sum + item.percentage, 0) / attendanceRecords.length
    : 0;

  const assignments = academicData.assignments || { completed: 0, pending: 0 };
  const total = assignments.completed + assignments.pending;
  const pendingRate = total > 0 ? (assignments.pending / total) : 0;

  const subjectScores = academicData.marks || [];
  const avgMarks = subjectScores.length > 0
    ? subjectScores.reduce((sum, item) => sum + item.score, 0) / subjectScores.length
    : 0;

  // Let's mock a drop trend (students with high pending assignments & attendance dropping < 75% display higher burnout)
  if (avgAttendance < 70 && pendingRate > 0.5) {
    return 'High';
  } else if (avgAttendance < 80 || pendingRate > 0.3 || avgMarks < 60) {
    return 'Medium';
  }
  return 'Low';
};

export const calculatePlacementReadiness = (academicData) => {
  if (!academicData) return { score: 0, status: 'Not Ready' };

  const aptitude = academicData.aptitudeScore || 70;
  const hours = academicData.codingPracticeHours || 40;
  const codingScore = Math.min(100, (hours / 120) * 100);

  const projectsCount = (academicData.projects || []).length;
  const projectScore = Math.min(100, projectsCount * 35);

  const certsCount = (academicData.certifications || []).length;
  const certsScore = Math.min(100, certsCount * 40);

  const communication = academicData.communicationScore || 75;

  // 30% Aptitude + 25% Coding + 20% Projects + 15% Certs + 10% Communication
  const score = Math.round(
    (0.30 * aptitude) +
    (0.25 * codingScore) +
    (0.20 * projectScore) +
    (0.15 * certsScore) +
    (0.10 * communication)
  );

  let status = 'Not Ready';
  if (score >= 80) status = 'Placement Ready';
  else if (score >= 50) status = 'Preparing';

  return { score, status };
};

export const calculateCareerDNA = (academicData) => {
  if (!academicData) return [];

  // Determine strengths based on subject performance and projects
  const subjectScores = academicData.marks || [];
  const getSubjectScore = (name) => {
    const s = subjectScores.find(item => item && item.subject && item.subject.toLowerCase().includes(name.toLowerCase()));
    return s ? s.score : 70; // baseline
  };

  const programmingScore = Math.max(getSubjectScore('cs101'), getSubjectScore('programming'), getSubjectScore('cs103'));
  const databaseScore = Math.max(getSubjectScore('cs102'), getSubjectScore('database'), getSubjectScore('data'));
  const systemsScore = Math.max(getSubjectScore('cs104'), getSubjectScore('network'), getSubjectScore('security'));

  const certsCount = (academicData.certifications || []).length;
  const projectsCount = (academicData.projects || []).length;

  // Calculate percentage match for each career track
  const tracks = [
    {
      role: 'Full Stack Developer',
      match: Math.round((programmingScore * 0.4) + (databaseScore * 0.3) + (Math.min(100, projectsCount * 30) * 0.2) + 10)
    },
    {
      role: 'Data Analyst',
      match: Math.round((databaseScore * 0.5) + (programmingScore * 0.3) + (certsCount > 0 ? 15 : 5) + 5)
    },
    {
      role: 'Cloud Engineer',
      match: Math.round((systemsScore * 0.4) + (programmingScore * 0.3) + (certsCount * 15) + 10)
    },
    {
      role: 'Cybersecurity Analyst',
      match: Math.round((systemsScore * 0.5) + (databaseScore * 0.2) + (certsCount * 20) + 5)
    },
    {
      role: 'AI Engineer',
      match: Math.round((programmingScore * 0.5) + (databaseScore * 0.2) + (Math.min(100, projectsCount * 20) * 0.2) + 10)
    },
    {
      role: 'UI/UX Designer',
      match: Math.round((programmingScore * 0.3) + (academicData.communicationScore || 75) * 0.4 + (projectsCount * 15) + 10)
    }
  ];

  // Cap values to 100
  return tracks.map(t => ({
    role: t.role,
    match: Math.min(100, Math.max(30, t.match))
  })).sort((a, b) => b.match - a.match);
};

export const generateRecommendations = (academicData, score, risk, burnout, placement) => {
  const recommendations = [];

  const subjectScores = academicData.marks || [];
  const lowSubjects = subjectScores.filter(s => s.score < 65).map(s => s.subject);

  if (lowSubjects.length > 0) {
    recommendations.push(`Request peer mentoring or additional faculty sessions for: ${lowSubjects.join(', ')}.`);
  }

  const attendanceRecords = academicData.attendance || [];
  const lowAttendance = attendanceRecords.filter(a => a.percentage < 75).map(a => a.subject);
  if (lowAttendance.length > 0) {
    recommendations.push(`Improve class presence immediately in ${lowAttendance.join(', ')} to cross the mandatory 75% threshold.`);
  }

  const pendingAssignments = academicData.assignments?.pending || 0;
  if (pendingAssignments > 3) {
    recommendations.push(`Clear the ${pendingAssignments} pending assignments before the next weekly review to avoid performance degradation.`);
  }

  if ((academicData.projects || []).length < 2) {
    recommendations.push('Initiate at least one practical capstone project to boost placement readiness.');
  }

  if ((academicData.certifications || []).length === 0) {
    recommendations.push('Complete an industry certification (AWS, Google Cloud, or Cisco) to validate your professional developer profile.');
  }

  if (burnout === 'High') {
    recommendations.push('Advisor Alert: Take a break from extracurricular workloads. Scheduled stress management counseling recommended.');
  }

  if (placement.score < 70) {
    recommendations.push(`Practice coding problems daily. Aiming for 60+ practice hours will significantly boost placement index.`);
  } else if (placement.score >= 80) {
    recommendations.push('Ready for placements! Recommended to register for elite hackathons and prepare mock coding interviews.');
  }

  if (recommendations.length === 0) {
    recommendations.push('Continue maintaining excellent performance across all modules.');
  }

  return recommendations;
};
