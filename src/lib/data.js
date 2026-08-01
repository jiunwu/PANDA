import { kv } from '@vercel/kv';
import defaultData from '@/data/project.json';

const PROJECT_DATA_KEY = 'panda_project_data';

export async function getProjectData() {
  try {
    // Try to get data from KV
    const data = await kv.get(PROJECT_DATA_KEY);
    if (data) {
      return typeof data === 'string' ? JSON.parse(data) : data;
    }
  } catch (error) {
    console.error('Error fetching data from KV:', error);
  }

  // Fallback to default data if KV is empty or fails
  return defaultData;
}

export async function updateProjectData(newData) {
  try {
    await kv.set(PROJECT_DATA_KEY, JSON.stringify(newData));
    return true;
  } catch (error) {
    console.error('Error saving data to KV:', error);
    return false;
  }
}
