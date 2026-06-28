import mongoose from 'mongoose';
import { fallbackDb } from './fallbackDb.js';

let useFallback = true;

// Define Schemas for MongoDB compatibility if MONGODB_URI is provided
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'faculty', 'admin'], required: true }
}, { timestamps: true });

const studentSchema = new mongoose.Schema({
  studentId: { type: String, required: true, unique: true }, // Links to User._id or custom ID
  department: { type: String, required: true },
  year: { type: Number, required: true },
  advisorId: { type: String, required: true } // Links to FacultyUser._id
}, { timestamps: true });

const facultySchema = new mongoose.Schema({
  facultyId: { type: String, required: true, unique: true }, // Links to User._id
  department: { type: String, required: true },
  designation: { type: String, required: true }
}, { timestamps: true });

const academicDataSchema = new mongoose.Schema({
  studentId: { type: String, required: true },
  attendance: [
    {
      subject: { type: String, required: true },
      percentage: { type: Number, required: true }
    }
  ],
  marks: [
    {
      subject: { type: String, required: true },
      score: { type: Number, required: true } // Out of 100
    }
  ],
  assignments: {
    completed: { type: Number, default: 0 },
    pending: { type: Number, default: 0 }
  },
  projects: [
    {
      title: { type: String, required: true },
      status: { type: String, enum: ['Not Started', 'In Progress', 'Completed'], default: 'In Progress' }
    }
  ],
  certifications: [
    {
      certificateName: { type: String, required: true },
      date: { type: Date, default: Date.now }
    }
  ],
  aptitudeScore: { type: Number, default: 70 }, // for Placement Readiness
  codingPracticeHours: { type: Number, default: 40 }, // for Placement Readiness
  communicationScore: { type: Number, default: 75 } // for Placement Readiness
}, { timestamps: true });

const meetingSchema = new mongoose.Schema({
  studentId: { type: String, required: true },
  advisorId: { type: String, required: true },
  date: { type: Date, required: true },
  status: { type: String, enum: ['Pending', 'Approved', 'Completed', 'Cancelled'], default: 'Pending' },
  notes: { type: String, default: '' }
}, { timestamps: true });

const studentSuccessSchema = new mongoose.Schema({
  studentId: { type: String, required: true, unique: true },
  successScore: { type: Number, required: true },
  academicRisk: { type: String, enum: ['Low Risk', 'Medium Risk', 'High Risk'], required: true },
  burnoutRisk: { type: String, enum: ['Low', 'Medium', 'High'], required: true },
  placementReadiness: { type: Number, required: true },
  placementStatus: { type: String, enum: ['Not Ready', 'Preparing', 'Placement Ready'], required: true },
  careerDNA: [
    {
      role: { type: String, required: true },
      match: { type: Number, required: true } // percentage
    }
  ],
  recommendations: [{ type: String }],
  generatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Register models with mongoose
mongoose.model('User', userSchema);
mongoose.model('Student', studentSchema);
mongoose.model('Faculty', facultySchema);
mongoose.model('AcademicData', academicDataSchema);
mongoose.model('Meeting', meetingSchema);
mongoose.model('StudentSuccess', studentSuccessSchema);

export const connectDB = async () => {
  if (process.env.MONGODB_URI) {
    try {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('--- MongoDB connected successfully ---');
      useFallback = false;
    } catch (e) {
      console.error('--- MongoDB connection failed. Falling back to local JSON database. ---', e.message);
      useFallback = true;
    }
  } else {
    console.log('--- No MONGODB_URI found. Running in local JSON database mode. ---');
    useFallback = true;
  }
};

class DatabaseModel {
  constructor(mongooseModelName, fallbackCollectionName) {
    this.mongooseModelName = mongooseModelName;
    this.fallbackCollectionName = fallbackCollectionName;
  }

  get model() {
    if (useFallback) {
      return fallbackDb[this.fallbackCollectionName];
    } else {
      return mongoose.model(this.mongooseModelName);
    }
  }

  async find(query) { return this.model.find(query); }
  async findOne(query) { return this.model.findOne(query); }
  async findById(id) { return this.model.findById(id); }
  async create(data) { return this.model.create(data); }
  async insertMany(docs) { return this.model.insertMany(docs); }
  async findByIdAndUpdate(id, update, options) { return this.model.findByIdAndUpdate(id, update, options); }
  async findOneAndUpdate(query, update, options) { return this.model.findOneAndUpdate(query, update, options); }
  async deleteOne(query) { return this.model.deleteOne(query); }
  async deleteMany(query) { return this.model.deleteMany(query); }
  async countDocuments(query) { return this.model.countDocuments(query); }
}

export const User = new DatabaseModel('User', 'users');
export const Student = new DatabaseModel('Student', 'students');
export const Faculty = new DatabaseModel('Faculty', 'faculty');
export const AcademicData = new DatabaseModel('AcademicData', 'attendance'); // shared config mapped to attendance
export const Meeting = new DatabaseModel('Meeting', 'meetings');
export const StudentSuccess = new DatabaseModel('StudentSuccess', 'studentSuccess');

export const getDbMode = () => useFallback ? 'JSON-Fallback' : 'MongoDB';
