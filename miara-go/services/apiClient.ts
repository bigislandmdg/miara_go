import { API_URL } from "../config/backendConfig";

export async function apiPost(endpoint: string, data: any) {
  try {
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const json = await res.json();
    return json;
  } catch (error) {
    console.log("API ERROR:", error);
    throw error;
  }
}
