import { getAssignments, getCourses } from '@/utils/canvasApi';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Assignment data from Canvas API
interface Assignment {
  id: number;
  name: string;
  due_at: string;
  course_id: number;
  html_url: string;
}

// Interface for course data from Canvas API
interface Course {
  id: number;
  name: string;
  enrollment_term_id?: number;
}

// Displays assignments due within the next week
export default function HomeScreen() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const insets = useSafeAreaInsets();

  /**
   * Gets course name by ID
   * 
   * @param courseId - The ID of the course
   * @returns The name of the course or a fallback string if not found
   */
  const getCourseName = useCallback((courseId: number) => {
    const course = courses.find((c: Course) => c.id === courseId);
    return course ? course.name : `Course ${courseId}`;
  }, [courses]);

  /**
   * Fetches assignments due within the next week
   */
  const fetchAssignmentsDueThisWeek = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch courses for the current term
      const allCourses = await getCourses();
      const currentTermCourses = allCourses.filter((course: Course) => course.enrollment_term_id === 29);
      setCourses(currentTermCourses);

      // Fetch assignments for all courses concurrently
      const assignmentPromises = currentTermCourses.map(async (course: Course) => {
        try {
          const courseAssignments = await getAssignments(course.id);
          // Filter for unsubmitted assignments with submission data
          return courseAssignments
            .filter((assignment: any) => {
              if (assignment.submission) {
                const workflowState = assignment.submission.workflow_state;
                return workflowState !== "submitted" && workflowState !== "graded";
              }
              return true; // Include if no submission data
            })
            .map((assignment: any) => ({
              ...assignment,
              course_id: course.id
            }));
        } catch (courseError) {
          console.warn(`Failed to fetch assignments for course ${course.id}:`, courseError);
          return [];
        }
      });

      const assignmentResults = await Promise.all(assignmentPromises);
      const allAssignments = assignmentResults.flat();

      // Filter assignments due within the next week
      const now = new Date();
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      const upcomingAssignments = allAssignments.filter(assignment => {
        if (!assignment.due_at) return false;
        const dueDate = new Date(assignment.due_at);
        return dueDate >= now && dueDate <= nextWeek;
      });

      // Sort by due date (soonest first)
      upcomingAssignments.sort((a, b) => {
        const dateA = new Date(a.due_at);
        const dateB = new Date(b.due_at);
        return dateA.getTime() - dateB.getTime();
      });

      setAssignments(upcomingAssignments);
    } catch (err) {
      console.error('Error fetching assignments:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch assignments';
      setError(`Network Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAssignmentsDueThisWeek();
  }, [fetchAssignmentsDueThisWeek]);

  /**
   * Formats due date for display with urgency indicators
   * 
   * @param dueDateString - The due date string from the API
   * @returns A formatted string indicating how soon the assignment is due
   */
  const formatDueDate = (dueDateString: string) => {
    const dueDate = new Date(dueDateString);
    const now = new Date();
    const diffTime = dueDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 2) {
      if (diffDays === 0) return 'Due today!!!';
      if (diffDays === 1) return 'Due tomorrow!!';
      return 'Due in 2 days!';
    }
    return `Due in ${diffDays} days`;
  };

  if (loading) {
    return (
      <View style={[styles.centerContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading assignments...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.centerContainer, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>Error: {error}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Text style={styles.header}>Assignments Due This Week</Text>
      
      {assignments.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.noAssignmentsText}>No assignments due this week! 🎉</Text>
        </View>
      ) : (
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollViewContent, { paddingBottom: insets.bottom + 20 }]}
          showsVerticalScrollIndicator={false}
        >
          {assignments.map((assignment) => (
            <View key={`${assignment.course_id}-${assignment.id}`} style={styles.assignmentCard}>
              <Text style={styles.assignmentName}>{assignment.name}</Text>
              <Text style={styles.courseName}>{getCourseName(assignment.course_id)}</Text>
              <Text style={styles.dueDate}>{formatDueDate(assignment.due_at)}</Text>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
  },
  assignmentCard: {
    backgroundColor: 'white',
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  assignmentName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  courseName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  dueDate: {
    fontSize: 14,
    color: '#e74c3c',
    fontWeight: '500',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 16,
    textAlign: 'center',
  },
  noAssignmentsText: {
    fontSize: 18,
    textAlign: 'center',
    color: '#27ae60',
  },
});
