import { User, Student, AcademicData, StudentSuccess, Meeting } from '../config/db.js';

export const getAdvisorStudents = async (req, res) => {
  try {
    const advisorId = req.user._id;

    // Find all student link records
    const studentRelations = await Student.find({ advisorId });
    if (studentRelations.length === 0) {
      return res.json([]);
    }

    const studentIds = studentRelations.map(r => r.studentId);

    // Fetch details for these students
    const users = await User.find({ _id: { $in: studentIds } });
    const successProfiles = await StudentSuccess.find({ studentId: { $in: studentIds } });
    const academics = await AcademicData.find({ studentId: { $in: studentIds } });

    const enrichedStudents = studentRelations.map(rel => {
      const u = users.find(user => user._id.toString() === rel.studentId.toString()) || {};
      const success = successProfiles.find(s => s.studentId.toString() === rel.studentId.toString()) || {};
      const acad = academics.find(a => a.studentId.toString() === rel.studentId.toString()) || {};

      return {
        _id: rel.studentId,
        name: u.name,
        email: u.email,
        department: rel.department,
        year: rel.year,
        successScore: success.successScore || 0,
        academicRisk: success.academicRisk || 'Low Risk',
        burnoutRisk: success.burnoutRisk || 'Low',
        placementReadiness: success.placementReadiness || 0,
        placementStatus: success.placementStatus || 'Not Ready',
        academicRecord: {
          attendanceCount: acad.attendance?.length || 0,
          marksCount: acad.marks?.length || 0,
          assignments: acad.assignments || { completed: 0, pending: 0 },
          projectsCount: acad.projects?.length || 0,
          certificationsCount: acad.certifications?.length || 0
        }
      };
    });

    return res.json(enrichedStudents);

  } catch (error) {
    console.error('Advisor students retrieval error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getAdvisorMeetings = async (req, res) => {
  try {
    const advisorId = req.user._id;
    const meetings = await Meeting.find({ advisorId });

    const enrichedMeetings = [];
    for (const m of meetings) {
      const studentUser = await User.findById(m.studentId);
      enrichedMeetings.push({
        ...m,
        studentName: studentUser ? studentUser.name : 'Unknown Student'
      });
    }

    return res.json(enrichedMeetings);

  } catch (error) {
    console.error('Advisor meetings retrieval error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const updateMeetingStatus = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { status, notes } = req.body;

    if (!status) {
      return res.status(400).json({ message: 'Please provide status' });
    }

    const meeting = await Meeting.findById(meetingId);
    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    // Verify advisor owns this meeting
    if (meeting.advisorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Forbidden: You cannot modify this meeting request' });
    }

    meeting.status = status;
    if (notes !== undefined) {
      meeting.notes = notes;
    }

    const updated = await Meeting.findByIdAndUpdate(meetingId, meeting, { new: true });

    // Notify student via Socket.io
    if (global.io) {
      global.io.to(meeting.studentId.toString()).emit('meeting_status_updated', {
        meetingId: meeting._id,
        status: meeting.status,
        notes: meeting.notes
      });
    }

    return res.json({ message: 'Meeting updated successfully', meeting: updated });

  } catch (error) {
    console.error('Meeting status update error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const postAdvisorRecommendation = async (req, res) => {
  try {
    const { studentId, recommendation } = req.body;

    if (!studentId || !recommendation) {
      return res.status(400).json({ message: 'Please provide studentId and recommendation text' });
    }

    const successData = await StudentSuccess.findOne({ studentId });
    if (!successData) {
      return res.status(404).json({ message: 'Student success profile not found' });
    }

    // Add manual advisor recommendation
    const recs = successData.recommendations || [];
    recs.unshift(`Faculty Alert: ${recommendation}`);

    await StudentSuccess.findOneAndUpdate(
      { studentId },
      { recommendations: recs }
    );

    // Notify student via Socket.io
    if (global.io) {
      global.io.to(studentId.toString()).emit('new_recommendation', {
        recommendation: `Faculty Alert: ${recommendation}`
      });
    }

    return res.json({ message: 'Recommendation added successfully', recommendations: recs });

  } catch (error) {
    console.error('Post recommendation error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};
