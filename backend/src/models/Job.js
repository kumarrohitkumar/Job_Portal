import mongoose from 'mongoose';

export const JOB_TYPES = ['Full-time', 'Part-time', 'Internship', 'Contract', 'Remote'];

const jobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    requirements: { type: [String], default: [] },
    /** Annual CTC in lakh rupees (LPA). */
    salary: { type: Number, required: true, min: 0 },
    /** Years of experience asked for. */
    experienceLevel: { type: Number, required: true, min: 0 },
    location: { type: String, required: true, trim: true },
    jobType: { type: String, enum: JOB_TYPES, required: true },
    position: { type: Number, required: true, min: 1 },
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  },
  { timestamps: true },
);
jobSchema.index({ createdAt: -1 });

export const Job = mongoose.model('Job', jobSchema);
