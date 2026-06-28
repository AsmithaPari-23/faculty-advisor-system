import { User, Student, Faculty, AcademicData, Meeting } from '../config/db.js';

export const getStudentProfile = async (req, res) => {
  try {
    const studentId = req.user._id;

    const studentDetails = await Student.findOne({ studentId });
    if (!studentDetails) {
      return res.status(404).json({ message: 'Student details not found' });
    }

    let advisorName = 'Not Assigned';
    let advisorEmail = '';
    if (studentDetails.advisorId) {
      const advisorUser = await User.findById(studentDetails.advisorId);
      if (advisorUser) {
        advisorName = advisorUser.name;
        advisorEmail = advisorUser.email;
      }
    }

    return res.json({
      name: req.user.name,
      email: req.user.email,
      department: studentDetails.department,
      year: studentDetails.year,
      advisor: {
        id: studentDetails.advisorId,
        name: advisorName,
        email: advisorEmail
      }
    });

  } catch (error) {
    console.error('Error fetching profile:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getStudentAttendance = async (req, res) => {
  try {
    const studentId = req.user._id;
    const academic = await AcademicData.findOne({ studentId });
    if (!academic) {
      return res.status(404).json({ message: 'Academic records not found' });
    }
    return res.json(academic.attendance || []);
  } catch (error) {
    console.error('Error fetching attendance:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getStudentMarks = async (req, res) => {
  try {
    const studentId = req.user._id;
    const academic = await AcademicData.findOne({ studentId });
    if (!academic) {
      return res.status(404).json({ message: 'Academic records not found' });
    }
    return res.json(academic.marks || []);
  } catch (error) {
    console.error('Error fetching marks:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getFullAcademicData = async (req, res) => {
  try {
    const studentId = req.user._id;
    const academic = await AcademicData.findOne({ studentId });
    if (!academic) {
      return res.status(404).json({ message: 'Academic records not found' });
    }
    return res.json(academic);
  } catch (error) {
    console.error('Error fetching academic data:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const requestMeeting = async (req, res) => {
  try {
    const studentId = req.user._id;
    const { date, notes } = req.body;

    if (!date) {
      return res.status(400).json({ message: 'Please provide a date and time for the meeting' });
    }

    const studentDetails = await Student.findOne({ studentId });
    if (!studentDetails || !studentDetails.advisorId) {
      return res.status(400).json({ message: 'No faculty advisor assigned. Cannot request meeting.' });
    }

    const meeting = await Meeting.create({
      studentId,
      advisorId: studentDetails.advisorId,
      date: new Date(date),
      notes: notes || '',
      status: 'Pending'
    });

    // Notify advisor via Socket.io if handler is available
    if (global.io) {
      global.io.to(studentDetails.advisorId.toString()).emit('new_meeting_request', {
        meetingId: meeting._id,
        studentName: req.user.name,
        date: meeting.date
      });
    }

    return res.status(201).json({ message: 'Meeting requested successfully', meeting });

  } catch (error) {
    console.error('Error requesting meeting:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getStudentMeetings = async (req, res) => {
  try {
    const studentId = req.user._id;
    const meetings = await Meeting.find({ studentId });

    // Join advisor name
    const enrichedMeetings = [];
    for (const m of meetings) {
      const advisorUser = await User.findById(m.advisorId);
      enrichedMeetings.push({
        ...m,
        advisorName: advisorUser ? advisorUser.name : 'Unknown Advisor'
      });
    }

    return res.json(enrichedMeetings);
  } catch (error) {
    console.error('Error fetching meetings:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};
