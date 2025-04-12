// You need to define the mode correctly, for example, from environment variables
const mode =  "development"; // Defaulting to development

let USER_API_END_POINT,
  JOB_API_END_POINT,
  APPLICATION_API_END_POINT,
  COMPANY_API_END_POINT;

if (mode === "production") {
  USER_API_END_POINT = "https://job-portal-ckeu.onrender.com/api/v1/user";
  JOB_API_END_POINT = "https://job-portal-ckeu.onrender.com/api/v1/job";
  APPLICATION_API_END_POINT =
    "https://job-portal-ckeu.onrender.com/api/v1/application";
  COMPANY_API_END_POINT = "https://job-portal-ckeu.onrender.com/api/v1/company";
} else {
  USER_API_END_POINT = "http://localhost:8000/api/v1/user"; // Assuming local dev API
  JOB_API_END_POINT = "http://localhost:8000/api/v1/job";
  APPLICATION_API_END_POINT = "http://localhost:8000/api/v1/application";
  COMPANY_API_END_POINT = "http://localhost:8000/api/v1/company";
}

// Export the variables
export {
  USER_API_END_POINT,
  JOB_API_END_POINT,
  APPLICATION_API_END_POINT,
  COMPANY_API_END_POINT,
};
