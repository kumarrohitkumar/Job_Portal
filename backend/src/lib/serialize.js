/** Shapes documents for the API. File keys become short-lived links; passwords never leave. */
export function makeSerializers(storage) {
  const id = (doc) => String(doc._id ?? doc);

  async function user(u) {
    return {
      id: id(u),
      fullname: u.fullname,
      email: u.email,
      phoneNumber: u.phoneNumber,
      role: u.role,
      profile: {
        bio: u.profile?.bio ?? '',
        skills: u.profile?.skills ?? [],
        resumeUrl: await storage.url(u.profile?.resumeKey, u.profile?.resumeOriginalName),
        resumeOriginalName: u.profile?.resumeOriginalName ?? null,
        photoUrl: await storage.url(u.profile?.photoKey),
      },
      createdAt: u.createdAt,
    };
  }

  async function company(c) {
    if (!c || !c._id) return c ? { id: id(c) } : null;
    return {
      id: id(c),
      name: c.name,
      description: c.description,
      website: c.website,
      location: c.location,
      logoUrl: await storage.url(c.logoKey),
      createdAt: c.createdAt,
    };
  }

  async function job(j, extra = {}) {
    return {
      id: id(j),
      title: j.title,
      description: j.description,
      requirements: j.requirements,
      salary: j.salary,
      experienceLevel: j.experienceLevel,
      location: j.location,
      jobType: j.jobType,
      position: j.position,
      company: await company(j.company),
      createdAt: j.createdAt,
      ...extra,
    };
  }

  async function application(a, { withApplicant = false, withJob = false } = {}) {
    return {
      id: id(a),
      status: a.status,
      appliedAt: a.createdAt,
      ...(withJob && { job: await job(a.job) }),
      ...(withApplicant && { applicant: await user(a.applicant) }),
    };
  }

  return { user, company, job, application };
}
