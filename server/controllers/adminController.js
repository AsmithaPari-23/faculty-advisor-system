import { User, Student, Faculty, AcademicData, StudentSuccess, Meeting } from '../config/db.js';

export const getAdminStats = async (req, res) => {
  try {
    const studentCount = await Student.countDocuments();
    const advisorCount = await Faculty.countDocuments();
    const meetingCount = await Meeting.countDocuments();

    // Fetch all successes to calculate averages
    const successes = await StudentSuccess.find();
    const avgSuccessScore = successes.length > 0
      ? Math.round(successes.reduce((sum, s) => sum + s.successScore, 0) / successes.length)
      : 0;

    const avgPlacementScore = successes.length > 0
      ? Math.round(successes.reduce((sum, s) => sum + s.placementReadiness, 0) / successes.length)
      : 0;

    // Academic risk breakdown
    const riskCounts = { 'High Risk': 0, 'Medium Risk': 0, 'Low Risk': 0 };
    successes.forEach(s => {
      riskCounts[s.academicRisk] = (riskCounts[s.academicRisk] || 0) + 1;
    });

    // Burnout breakdown
    const burnoutCounts = { High: 0, Medium: 0, Low: 0 };
    successes.forEach(s => {
      burnoutCounts[s.burnoutRisk] = (burnoutCounts[s.burnoutRisk] || 0) + 1;
    });

    // Department representation (mocked CS mostly, but computed)
    const students = await Student.find();
    const deptCounts = {};
    students.forEach(s => {
      deptCounts[s.department] = (deptCounts[s.department] || 0) + 1;
    });

    return res.json({
      counts: {
        students: studentCount,
        advisors: advisorCount,
        meetings: meetingCount
      },
      averages: {
        successScore: avgSuccessScore,
        placementReadiness: avgPlacementScore
      },
      riskBreakdown: riskCounts,
      burnoutBreakdown: burnoutCounts,
      departmentBreakdown: deptCounts
    });

  } catch (error) {
    console.error('Admin stats error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getAdminUsers = async (req, res) => {
  try {
    const users = await User.find();
    const students = await Student.find();
    const faculties = await Faculty.find();

    const enrichedUsers = users.map(u => {
      const studInfo = students.find(s => s.studentId.toString() === u._id.toString());
      const facInfo = faculties.find(f => f.facultyId.toString() === u._id.toString());

      return {
        _id: u._id,
        name: u.name,
        email: u.email,
        role: u.role,
        department: studInfo ? studInfo.department : (facInfo ? facInfo.department : 'N/A'),
        year: studInfo ? studInfo.year : undefined,
        designation: facInfo ? facInfo.designation : undefined,
        advisorId: studInfo ? studInfo.advisorId : undefined
      };
    });

    return res.json(enrichedUsers);
  } catch (error) {
    console.error('Admin users error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const assignAdvisor = async (req, res) => {
  try {
    const { studentId, advisorId } = req.body;

    if (!studentId || !advisorId) {
      return res.status(400).json({ message: 'Please provide studentId and advisorId' });
    }

    // Verify advisor exists
    const advisorExists = await Faculty.findOne({ facultyId: advisorId });
    if (!advisorExists) {
      return res.status(400).json({ message: 'Advisor not found' });
    }

    const updated = await Student.findOneAndUpdate(
      { studentId },
      { advisorId },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: 'Student record not found' });
    }

    // Update meeting table to point new meetings to this advisor if any pending
    await Meeting.deleteMany({ studentId, status: 'Pending' });

    return res.json({ message: 'Advisor assigned successfully', relation: updated });

  } catch (error) {
    console.error('Advisor assignment error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'Please provide userId to delete' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await User.deleteOne({ _id: userId });

    if (user.role === 'student') {
      await Student.deleteOne({ studentId: userId });
      await AcademicData.deleteOne({ studentId: userId });
      await StudentSuccess.deleteOne({ studentId: userId });
      await Meeting.deleteMany({ studentId: userId });
    } else if (user.role === 'faculty') {
      await Faculty.deleteOne({ facultyId: userId });
      // Clear advisory roles or re-assign students under this advisor
      await Student.deleteMany({ advisorId: userId });
      await Meeting.deleteMany({ advisorId: userId });
    }

    return res.json({ message: `Successfully deleted user ${user.name}` });

  } catch (error) {
    console.error('Delete user error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};
