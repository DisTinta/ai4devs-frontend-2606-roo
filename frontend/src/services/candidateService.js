const API_BASE_URL = "http://localhost:3010";

export const uploadCV = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  // Do not set Content-Type manually: the browser adds multipart/form-data
  // with the correct boundary when the body is a FormData instance.
  const response = await fetch(`${API_BASE_URL}/upload`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Failed to upload the CV file");
  }

  return response.json(); // Returns the file path and type
};

export const sendCandidateData = async (candidateData) => {
  const response = await fetch(`${API_BASE_URL}/candidates`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(candidateData),
  });

  if (!response.ok) {
    throw new Error("Failed to send candidate data");
  }

  return response.json();
};
