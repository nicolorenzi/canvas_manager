import { getAssignments } from '@/utils/canvasApi';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Assignment {
  id: number;
  name: string;
  due_at: string;
  course_id: number;
  html_url: string;
}

export default function CourseDetailScreen() {
  const { id, name } = useLocalSearchParams<{ id: string; name: string }>();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const insets = useSafeAreaInsets();
  const router = useRouter();

  useEffect(() => {
    if (id) {
      fetchCourseAssignments();
    }
  }, [id]);

  const fetchCourseAssignments = async () => {
    try {
      setLoading(true);
      setError(null);

      const courseAssignments = await getAssignments(id!);
      
      const allAssignments = courseAssignments.map((assignment: any) => ({
        ...assignment,
        course_id: parseInt(id!)
      }));

      // Sort by due date (upcoming first, expired at bottom)
      const now = new Date();
      allAssignments.sort((a: Assignment, b: Assignment) => {
        if (!a.due_at && !b.due_at) return 0;
        if (!a.due_at) return 1;
        if (!b.due_at) return -1;
        
        const dateA = new Date(a.due_at);
        const dateB = new Date(b.due_at);
        const isAExpired = dateA < now;
        const isBExpired = dateB < now;
        
        // If one is expired and one isn't, put expired at bottom
        if (isAExpired && !isBExpired) return 1;
        if (!isAExpired && isBExpired) return -1;
        
        // If both are expired or both are upcoming, sort by date
        return dateA.getTime() - dateB.getTime();
      });

      setAssignments(allAssignments);
    } catch (err) {
      console.error('Error fetching course assignments:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch assignments';
      setError(`Network Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const formatDueDate = (dueDateString: string) => {
    if (!dueDateString) return 'No due date';
    
    const dueDate = new Date(dueDateString);
    const now = new Date();
    const diffTime = dueDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Check if assignment is expired (past due)
    if (diffDays < 0) {
      return 'Expired';
    }
    
    if (diffDays <= 2) {
      if (diffDays === 0) return 'Due today!!!';
      else if (diffDays === 1) return 'Due tomorrow!!';
      else return 'Due in 2 days!';
    }
    return `Due in ${diffDays} days`;
  };

  const getAssignmentStatus = (assignment: any) => {
    if (assignment.submission) {
      const workflowState = assignment.submission.workflow_state;
      if (workflowState === "graded") return "graded";
      if (workflowState === "submitted") return "submitted";
    }
    return "no_submission";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "graded": return "#27ae60"; // Green
      case "submitted": return "#f39c12"; // Yellow/Orange
      case "no_submission": return "#e74c3c"; // Red
      default: return "#e74c3c";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "graded": return "Graded";
      case "submitted": return "Submitted";
      case "no_submission": return "Not Submitted";
      default: return "Not Submitted";
    }
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
    <View style={[styles.container, { paddingTop: insets.top - 20 }]}>
      <Text style={styles.header}>{name || `Course ${id}`}</Text>
      <Text style={styles.subHeader}>All Assignments</Text>
      
      {assignments.length === 0 ? (
        <View style={styles.noAssignmentsContainer}>
          <Text style={styles.noAssignmentsText}>No assignments found! 🎉</Text>
        </View>
      ) : (
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollViewContent, { paddingBottom: insets.bottom + 20 }]}
          showsVerticalScrollIndicator={false}
        >
          {(() => {
            // Check if all assignments are expired
            const now = new Date();
            const hasCurrentAssignments = assignments.some(assignment => 
              !assignment.due_at || new Date(assignment.due_at) >= now
            );
            
            return (
              <>
                {!hasCurrentAssignments && assignments.length > 0 && (
                  <>
                    <View style={styles.noCurrentAssignmentsContainer}>
                      <Text style={styles.noCurrentAssignmentsText}>No current assignments</Text>
                    </View>
                    <View style={styles.expiredSeparator}>
                      <Text style={styles.expiredSeparatorText}>Expired Assignments</Text>
                    </View>
                  </>
                )}
                {assignments.map((assignment, index) => {
                  const status = getAssignmentStatus(assignment);
                  const statusColor = getStatusColor(status);
                  
                  // Check if this is the first expired assignment
                  const isExpired = assignment.due_at && new Date(assignment.due_at) < new Date();
                  const prevAssignment = index > 0 ? assignments[index - 1] : null;
                  const prevIsExpired = prevAssignment?.due_at && new Date(prevAssignment.due_at) < new Date();
                  const showExpiredSeparator = isExpired && !prevIsExpired && hasCurrentAssignments;
                  
                  const shouldGreyOut = isExpired || (!assignment.due_at && index > 0 && assignments.slice(0, index).some(a => a.due_at && new Date(a.due_at) < new Date()));
                  
                  const borderColor = shouldGreyOut ? '#6c757d' : statusColor;
                  
                  return (
                    <View key={assignment.id}>
                      {showExpiredSeparator && (
                        <View style={styles.expiredSeparator}>
                          <Text style={styles.expiredSeparatorText}>Expired Assignments</Text>
                        </View>
                      )}
                      <View style={[styles.assignmentCard, { borderLeftColor: borderColor, borderLeftWidth: 5 }]}>
                        <Text style={styles.assignmentName}>{assignment.name}</Text>
                        <Text style={styles.dueDate}>{formatDueDate(assignment.due_at)}</Text>
                        <Text style={[styles.statusText, { color: statusColor }]}>{getStatusText(status)}</Text>
                      </View>
                    </View>
                  );
                })}
              </>
            );
          })()}
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
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 10,
    padding: 10,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
    marginTop: -20,
    textAlign: 'center',
  },
  subHeader: {
    fontSize: 18,
    color: '#666',
    marginBottom: 15,
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
  assignmentName: {
    fontSize: 16,
    fontWeight: 'bold',
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
  noAssignmentsContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginTop: 120,
  },
  noAssignmentsText: {
    fontSize: 18,
    textAlign: 'center',
    color: '#27ae60',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 5,
  },
  expiredSeparator: {
    backgroundColor: '#f8f9fa',
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginVertical: 10,
    borderRadius: 5,
    borderLeftWidth: 3,
    borderLeftColor: '#6c757d',
  },
  expiredSeparatorText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6c757d',
    textAlign: 'center',
  },
  noCurrentAssignmentsContainer: {
    paddingVertical: 20,
    paddingHorizontal: 15,
    marginBottom: 10,
    alignItems: 'center',
  },
  noCurrentAssignmentsText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#666',
    textAlign: 'center',
  },
});
