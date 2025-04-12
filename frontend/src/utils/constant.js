// You need to define the mode correctly, for example, from environment variables

let USER_API_END_POINT,
  JOB_API_END_POINT,
  APPLICATION_API_END_POINT,
  COMPANY_API_END_POINT;

  USER_API_END_POINT = "http://localhost:8000/api/v1/user"; // Assuming local dev API
  JOB_API_END_POINT = "http://localhost:8000/api/v1/job";
  APPLICATION_API_END_POINT = "http://localhost:8000/api/v1/application";
  COMPANY_API_END_POINT = "http://localhost:8000/api/v1/company";


// Export the variables
export {
  USER_API_END_POINT,
  JOB_API_END_POINT,
  APPLICATION_API_END_POINT,
  COMPANY_API_END_POINT,
};
