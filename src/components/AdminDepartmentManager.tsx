
import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Form, Alert, Spinner, Modal, ListGroup } from 'react-bootstrap';
import { Plus, Trash2, Building } from 'lucide-react';
import { API_ENDPOINTS } from '../config/api';

// Props interface for component configuration
interface AdminDepartmentManagerProps {
  onDepartmentChange?: () => void; // Callback for when departments are modified
}

/**
 * AdminDepartmentManager Component - Interface for managing organizational departments
 * 
 * This component provides administrators with the ability to:
 * - View all existing departments in the system
 * - Add new departments with validation
 * - Delete departments (with safety restrictions)
 * - Handle department-related errors and success states
 * 
 * Features:
 * - Real-time department list updates
 * - Modal-based department creation
 * - Confirmation dialogs for destructive actions
 * - Comprehensive error handling and user feedback
 * - Prevents deletion of the last remaining department
 */
const AdminDepartmentManager: React.FC<AdminDepartmentManagerProps> = ({ onDepartmentChange }) => {
  // State management for department data and UI controls
  const [departments, setDepartments] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [newDepartmentName, setNewDepartmentName] = useState('');

  /**
   * Effect hook to load departments when component mounts
   */
  useEffect(() => {
    fetchDepartments();
  }, []);

  /**
   * Fetches the list of all departments from the backend
   * Handles authentication and various error states
   * Updates the departments state with the retrieved data
   */
  const fetchDepartments = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('jwt_token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(API_ENDPOINTS.adminDepartments, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      // Handle different HTTP error status codes
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed');
        }
        if (response.status === 403) {
          throw new Error('Admin access required');
        }
        throw new Error('Failed to fetch departments');
      }

      const data = await response.json();
      setDepartments(data.departments || []);
    } catch (err) {
      console.error('Error fetching departments:', err);
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles the creation of a new department
   * Validates input, checks for duplicates, and communicates with backend
   * Updates local state and triggers parent component callbacks on success
   */
  const handleAddDepartment = async () => {
    const trimmedName = newDepartmentName.trim();
    
    // Input validation
    if (!trimmedName) {
      setError('Department name cannot be empty');
      return;
    }

    // Duplicate check
    if (departments.includes(trimmedName)) {
      setError('Department already exists');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const token = localStorage.getItem('jwt_token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(API_ENDPOINTS.adminDepartments, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ departmentName: trimmedName }),
      });

      // Handle different HTTP error responses
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 401) {
          throw new Error('Authentication failed');
        }
        if (response.status === 403) {
          throw new Error('Admin access required');
        }
        throw new Error(errorData.error || 'Failed to add department');
      }

      // Success handling - update UI and refresh data
      setSuccess('Department added successfully!');
      setNewDepartmentName('');
      setShowModal(false);
      await fetchDepartments();
      
      // Notify parent component of changes
      if (onDepartmentChange) {
        onDepartmentChange();
      }
      
      // Auto-clear success message
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error adding department:', err);
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  /**
   * Handles the deletion of an existing department
   * Includes confirmation dialog and safety checks
   * Prevents deletion of the last remaining department
   * 
   * @param departmentName - Name of the department to delete
   */
  const handleDeleteDepartment = async (departmentName: string) => {
    // User confirmation with warning about report deletion
    if (!confirm(`Are you sure you want to delete the "${departmentName}" department? This will remove all reports in this department.`)) {
      return;
    }

    setError('');
    setSuccess('');
    try {
      const token = localStorage.getItem('jwt_token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(API_ENDPOINTS.adminDeleteDepartment(departmentName), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      // Handle authentication and authorization errors
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed');
        }
        if (response.status === 403) {
          throw new Error('Admin access required');
        }
        throw new Error('Failed to delete department');
      }

      // Success handling
      setSuccess('Department deleted successfully!');
      await fetchDepartments();
      
      // Notify parent component of changes
      if (onDepartmentChange) {
        onDepartmentChange();
      }
      
      // Auto-clear success message
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error deleting department:', err);
      setError((err as Error).message);
    }
  };

  /**
   * Handles modal close event and resets form state
   * Clears any existing errors when modal is closed
   */
  const handleModalClose = () => {
    setShowModal(false);
    setNewDepartmentName('');
    setError('');
  };

  // Loading state display
  if (loading) {
    return (
      <div className="text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Loading departments...</p>
      </div>
    );
  }

  return (
    <>
      {/* Header section with title and add button */}
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="d-flex align-items-center">
              <Building size={20} className="me-2" />
              Department Management
            </h5>
            <Button
              variant="primary"
              onClick={() => setShowModal(true)}
              className="d-flex align-items-center"
            >
              <Plus size={16} className="me-1" />
              Add Department
            </Button>
          </div>
        </Col>
      </Row>

      {/* Error and success message displays */}
      {error && (
        <Alert variant="danger" className="mb-3">
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant="success" className="mb-3">
          {success}
        </Alert>
      )}

      {/* Departments list display */}
      <Card>
        <Card.Body>
          {departments.length > 0 ? (
            <ListGroup variant="flush">
              {departments.map((department) => (
                <ListGroup.Item key={department} className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="mb-0">{department}</h6>
                  </div>
                  {/* Delete button with safety restrictions */}
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => handleDeleteDepartment(department)}
                    disabled={departments.length <= 1} // Prevent deletion of last department
                    title={departments.length <= 1 ? "Cannot delete the last department" : "Delete department"}
                  >
                    <Trash2 size={14} />
                  </Button>
                </ListGroup.Item>
              ))}
            </ListGroup>
          ) : (
            // Empty state display
            <div className="text-center py-4">
              <p className="text-muted mb-0">No departments found</p>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Add Department Modal */}
      <Modal show={showModal} onHide={handleModalClose}>
        <Modal.Header closeButton>
          <Modal.Title>Add New Department</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={(e) => { e.preventDefault(); handleAddDepartment(); }}>
            <Form.Group className="mb-3">
              <Form.Label>Department Name</Form.Label>
              <Form.Control
                type="text"
                value={newDepartmentName}
                onChange={(e) => setNewDepartmentName(e.target.value)}
                placeholder="Enter department name"
                maxLength={50} // Character limit for department names
                required
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          {/* Modal action buttons */}
          <Button variant="secondary" onClick={handleModalClose}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleAddDepartment}
            disabled={saving || !newDepartmentName.trim()}
          >
            {saving ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Adding...
              </>
            ) : (
              'Add Department'
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default AdminDepartmentManager;
