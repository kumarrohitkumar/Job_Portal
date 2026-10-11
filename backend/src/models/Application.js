import mongoose from 'mongoose';

export const APPLICATION_STATUSES = ['pending', 'accepted', 'rejected'];

const applicationSchema = new mongoose.Schema(
  {
    job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true, index: true },
    applicant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    status: { type: String, enum: APPLICATION_STATUSES, default: 'pending' },
  },
  { timestamps: true },
);
// One application per student per job, even if two requests race.
applicationSchema.index({ job: 1, applicant: 1 }, { unique: true });

export const Application = mongoose.model('Application', applicationSchema);
