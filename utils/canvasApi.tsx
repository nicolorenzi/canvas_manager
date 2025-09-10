// Canvas API configuration
const BASE_URL = process.env.EXPO_PUBLIC_CANVAS_BASE_URL;
const TOKEN = process.env.EXPO_PUBLIC_CANVAS_TOKEN;

// Helper function to make API calls
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
  
  // Returns all courses
  export async function getCourses() {
    return canvasFetch('/courses?include[]=term&per_page=100');
  }
  
  // Returns assignments for a given course with optimized filtering
  export async function getAssignments(courseId: number | string) {
    // Fetch all assignments with submission data
    return canvasFetch(`/courses/${courseId}/assignments?per_page=100&include[]=submission&order_by=due_at`);
  }