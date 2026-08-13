import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export async function getJob(jobId) {
  const res = await axios.get(`${API_BASE}/jobs/${jobId}`);
  return res.data;
}

export async function retryFailedJobs(campaignId) {
  const res = await axios.post(`${API_BASE}/jobs/retry-failed/${campaignId}`);
  return res.data;
}
