// Canvas LMS API configuration and utilities

// Environment variables for Canvas API access
const BASE_URL = process.env.EXPO_PUBLIC_CANVAS_BASE_URL;
const TOKEN = process.env.EXPO_PUBLIC_CANVAS_TOKEN;

/**
 * Generic Canvas API fetch function with error handling
 * @param endpoint - Canvas API endpoint (without base URL)
 * @returns JSON response from Canvas API
 * @throws Error if API call fails or configuration is missing
 */
async function canvasFetch(endpoint: string) {    
    if (!BASE_URL || !TOKEN) {
      throw new Error('Canvas API configuration missing. Check your environment variables.');
    }

    const res = await fetch(`${BASE_URL}${endpoint}`, {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
      },
    });
  
    if (!res.ok) {
      const errorText = await res.text();
      console.error(`Canvas API error ${res.status}:`, errorText);
      throw new Error(`Canvas API error: ${res.status} - ${errorText || res.statusText}`);
    }
  
    return res.json(); 
  }
  
/**
 * Fetches all courses the user has access to
 * @returns Array of course objects with term information
 */
export async function getCourses() {
  return canvasFetch('/courses?include[]=term&per_page=100');
}
  
/**
 * Fetches assignments for a specific course with submission data
 * @param courseId - The Canvas course ID
 * @returns Array of assignment objects with submission information
 */
export async function getAssignments(courseId: number | string) {
  // Fetch all assignments with submission data included
  return canvasFetch(`/courses/${courseId}/assignments?per_page=100&include[]=submission&order_by=due_at`);
}