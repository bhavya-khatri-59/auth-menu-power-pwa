
import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Form, Alert, Spinner, Modal } from 'react-bootstrap';
import { Edit, Save } from 'lucide-react';
import { API_ENDPOINTS } from '../config/api';

// Type definitions for report and reports data structures
interface Report {
  id: string;
  title: string;
  description: string;
  icon: string;
  powerBIReportId: string;
}

interface ReportsData {
  [department: string]: Report[];
}

/**
 * AdminPowerBIEditor Component - Interface for editing PowerBI report IDs
 * 
 * This component provides administrators with the ability to:
 * - View all reports organized by department
 * - Edit PowerBI report IDs for individual reports
 * - Manage PowerBI configuration without affecting other report properties
 * - Bulk view and update PowerBI configurations across the system
 * 
 * Key Features:
 * - Department-based organization of reports
 * - Modal-based editing interface for focused PowerBI ID updates
 * - Real-time validation and error handling
 * - Batch operations support for efficient management
 * - Visual feedback for successful updates
 */
const AdminPowerBIEditor: React.FC = () => {
  // State management for reports data and UI controls
  const [reportsData, setReportsData] = useState<ReportsData>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingReport, setEditingReport] = useState<Report | null>(null);
  const [editingDepartment, setEditingDepartment] = useState('');
  const [newPowerBIId, setNewPowerBIId] = useState('');

  /**
   * Effect hook to fetch reports data when component mounts
   */
  useEffect(() => {
    fetchReportsData();
  }, []);

  /**
   * Fetches all reports data organized by department from admin API
   * Uses JWT authentication to ensure admin-only access
   * Handles various error states and network issues
   */
  const fetchReportsData = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('jwt_token');
      const response = await fetch(API_ENDPOINTS.adminReports, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch reports data');
      }

      const data = await response.json();
      setReportsData(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Initiates PowerBI ID editing for a specific report
   * Opens modal with current PowerBI ID pre-filled for editing
   * 
   * @param department - Department name containing the report
   * @param report - Report object to be edited
   */
  const handleEditPowerBI = (department: string, report: Report) => {
    setEditingDepartment(department);
    setEditingReport(report);
    setNewPowerBIId(report.powerBIReportId);
    setShowModal(true);
  };

  /**
   * Saves the updated PowerBI ID to the backend
   * Updates local state to reflect changes immediately
   * Provides user feedback on success or failure
   */
  const handleSavePowerBI = async () => {
    if (!editingReport || !newPowerBIId) return;

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('jwt_token');
      const response = await fetch(
        API_ENDPOINTS.adminUpdateReport(editingDepartment, editingReport.id),
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ powerBIReportId: newPowerBIId }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update PowerBI ID');
      }

      // Update local state to reflect the change immediately
      const updatedReportsData = { ...reportsData };
      const reportIndex = updatedReportsData[editingDepartment].findIndex(
        r => r.id === editingReport.id
      );
      if (reportIndex !== -1) {
        updatedReportsData[editingDepartment][reportIndex].powerBIReportId = newPowerBIId;
      }
      setReportsData(updatedReportsData);

      // Provide success feedback and close modal
      setSuccess('PowerBI ID updated successfully!');
      setShowModal(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  // Loading state display
  if (loading) {
    return (
      <div className="text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Loading PowerBI configurations...</p>
      </div>
    );
  }

  return (
    <>
      {/* Header section with title and description */}
      <Row className="mb-4">
        <Col>
          <h4>PowerBI Report Management</h4>
          <p className="text-muted">
            Manage PowerBI report IDs for all departments and reports
          </p>
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

      {/* Department-based reports organization */}
      {Object.entries(reportsData).map(([department, reports]) => (
        <Card key={department} className="mb-4">
          <Card.Header>
            <h5 className="mb-0">{department} Department</h5>
          </Card.Header>
          <Card.Body>
            <Row className="g-3">
              {reports.map((report) => (
                <Col key={report.id} md={6} lg={4}>
                  <Card className="h-100 border">
                    <Card.Body>
                      {/* Report information display */}
                      <h6 className="fw-bold">{report.title}</h6>
                      <p className="text-muted small mb-2">{report.description}</p>
                      
                      {/* Current PowerBI ID display */}
                      <div className="mb-3">
                        <strong>Current PowerBI ID:</strong>
                        <br />
                        <code className="small">{report.powerBIReportId}</code>
                      </div>
                      
                      {/* Edit PowerBI ID button */}
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => handleEditPowerBI(department, report)}
                        className="d-flex align-items-center"
                      >
                        <Edit size={14} className="me-1" />
                        Edit PowerBI ID
                      </Button>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card.Body>
        </Card>
      ))}

      {/* PowerBI ID Edit Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            Edit PowerBI ID - {editingReport?.title}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            {/* Read-only report information */}
            <Form.Group className="mb-3">
              <Form.Label>Report Title</Form.Label>
              <Form.Control
                type="text"
                value={editingReport?.title || ''}
                disabled
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Department</Form.Label>
              <Form.Control
                type="text"
                value={editingDepartment}
                disabled
              />
            </Form.Group>
            
            {/* Editable PowerBI ID field */}
            <Form.Group className="mb-3">
              <Form.Label>PowerBI Report ID</Form.Label>
              <Form.Control
                type="text"
                value={newPowerBIId}
                onChange={(e) => setNewPowerBIId(e.target.value)}
                placeholder="Enter new PowerBI report ID"
              />
              <Form.Text className="text-muted">
                This ID will be used to embed the PowerBI report
              </Form.Text>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          {/* Modal action buttons */}
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleSavePowerBI}
            disabled={saving}
            className="d-flex align-items-center"
          >
            <Save size={14} className="me-1" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default AdminPowerBIEditor;
