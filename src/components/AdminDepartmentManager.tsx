
import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Form, Alert, Spinner, Modal, ListGroup } from 'react-bootstrap';
import { Plus, Trash2, Building } from 'lucide-react';
import { API_ENDPOINTS } from '../config/api';

interface AdminDepartmentManagerProps {
  onDepartmentChange?: () => void;
}

const AdminDepartmentManager: React.FC<AdminDepartmentManagerProps> = ({ onDepartmentChange }) => {
  const [departments, setDepartments] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [newDepartmentName, setNewDepartmentName] = useState('');

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('jwt_token');
      const response = await fetch(API_ENDPOINTS.adminDepartments, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch departments');
      }

      const data = await response.json();
      setDepartments(data.departments);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDepartment = async () => {
    if (!newDepartmentName.trim()) return;

    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const token = localStorage.getItem('jwt_token');
      const response = await fetch(API_ENDPOINTS.adminDepartments, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ departmentName: newDepartmentName.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add department');
      }

      setSuccess('Department added successfully!');
      setNewDepartmentName('');
      setShowModal(false);
      fetchDepartments();
      
      if (onDepartmentChange) {
        onDepartmentChange();
      }
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDepartment = async (departmentName: string) => {
    if (!confirm(`Are you sure you want to delete the "${departmentName}" department? This will remove all reports in this department.`)) {
      return;
    }

    setError('');
    setSuccess('');
    try {
      const token = localStorage.getItem('jwt_token');
      const response = await fetch(API_ENDPOINTS.adminDeleteDepartment(departmentName), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete department');
      }

      setSuccess('Department deleted successfully!');
      fetchDepartments();
      
      if (onDepartmentChange) {
        onDepartmentChange();
      }
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError((err as Error).message);
    }
  };

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

      <Card>
        <Card.Body>
          <ListGroup variant="flush">
            {departments.map((department) => (
              <ListGroup.Item key={department} className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="mb-0">{department}</h6>
                </div>
                <Button
                  variant="outline-danger"
                  size="sm"
                  onClick={() => handleDeleteDepartment(department)}
                  disabled={departments.length <= 1}
                  title={departments.length <= 1 ? "Cannot delete the last department" : "Delete department"}
                >
                  <Trash2 size={14} />
                </Button>
              </ListGroup.Item>
            ))}
          </ListGroup>
        </Card.Body>
      </Card>

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add New Department</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Department Name</Form.Label>
              <Form.Control
                type="text"
                value={newDepartmentName}
                onChange={(e) => setNewDepartmentName(e.target.value)}
                placeholder="Enter department name"
                onKeyDown={(e) => e.key === 'Enter' && handleAddDepartment()}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleAddDepartment}
            disabled={saving || !newDepartmentName.trim()}
          >
            {saving ? 'Adding...' : 'Add Department'}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default AdminDepartmentManager;
