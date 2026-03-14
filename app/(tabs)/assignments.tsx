import { getCourses } from '@/utils/canvasApi';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Course data from Canvas API
interface Course {
  id: number;
  name: string;
  enrollment_term_id?: number;
}

// Displays all courses for navigation
export default function AssignmentsScreen() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const insets = useSafeAreaInsets();
  const router = useRouter();

  useEffect(() => {
    fetchCourses();
  }, []);

  // Auto-refresh courses every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      fetchCourses();
    }, 300000); // 5 minutes

    return () => clearInterval(interval);
  }, []);

  // Fetches courses for the current term
  const fetchCourses = async () => {
    try {
      setLoading(true);
      setError(null);

      const allCourses = await getCourses();
      // Filter for current term courses
      const currentTermCourses = allCourses.filter((course: Course) => course.enrollment_term_id === 29);
      setCourses(currentTermCourses);
    } catch (err) {
      console.error('Error fetching courses:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch courses';
      setError(`Network Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // Navigates to course detail screen
  const handleCoursePress = (course: Course) => {
    router.push({
      pathname: '/course/[id]',
      params: { id: course.id.toString(), name: course.name }
    });
  };

  if (loading) {
    return (
      <View style={[styles.centerContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading courses...</Text>
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
      <Text style={styles.header}>All Courses</Text>
      
      {courses.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.noCoursesText}>No courses found! 📚</Text>
        </View>
      ) : (
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollViewContent, { paddingBottom: insets.bottom + 20 }]}
          showsVerticalScrollIndicator={false}
        >
          {courses.map((course) => (
            <TouchableOpacity 
              key={course.id} 
              style={styles.courseCard}
              onPress={() => handleCoursePress(course)}
              activeOpacity={0.7}
            >
              <Text style={styles.courseName}>{course.name}</Text>
              <Text style={styles.courseId}>Course ID: {course.id}</Text>
            </TouchableOpacity>
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
  courseCard: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 15,
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
  courseName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  courseId: {
    fontSize: 14,
    color: '#666',
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
  noCoursesText: {
    fontSize: 18,
    textAlign: 'center',
    color: '#27ae60',
  },
});