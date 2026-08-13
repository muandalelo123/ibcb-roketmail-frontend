// src/api/contacts.js
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export async function importContacts(file) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await axios.post(`${API_BASE}/contacts/import`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
      // Si ton endpoint est protégé, ajoute aussi :
      // "Authorization": `Bearer ${token}`,
    },
  });

  return res.data;
}


