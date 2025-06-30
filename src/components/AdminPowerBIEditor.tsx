
import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Form, Alert, Spinner, Modal } from 'react-bootstrap';
import { Edit, Save } from 'lucide-react';
import { API_ENDPOINTS } from '../config/api';

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

const AdminPowerBIEditor: React.FC = () => {
  const [reportsData, setReportsData] = useState<ReportsData>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingReport, setEditingReport] = useState<Report | null>(null);
  const [editingDepartment, setEditingDepartment] = useState('');
  const [newPowerBIId, setNewPowerBIId] = useState('');

  useEffect(() => {
    fetchReportsData();
  }, []);

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

  const handleEditPowerBI = (department: string, report: Report) => {
    setEditingDepartment(department);
    setEditingReport(report);
    setNewPowerBIId(report.powerBIReportId);
    setShowModal(true);
  };

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

      // Update local state
      const updatedReportsData = { ...reportsData };
      const reportIndex = updatedReportsData[editingDepartment].findIndex(
        r => r.id === editingReport.id
      );
      if (reportIndex !== -1) {
        updatedReportsData[editingDepartment][reportIndex].powerBIReportId = newPowerBIId;
      }
      setReportsData(updatedReportsData);

      setSuccess('PowerBI ID updated successfully!');
      setShowModal(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

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
      <Row className="mb-4">
        <Col>
          <h4>PowerBI Report Management</h4>
          <p className="text-muted">
            Manage PowerBI report IDs for all departments and reports
          </p>
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
                      <h6 className="fw-bold">{report.title}</h6>
                      <p className="text-muted small mb-2">{report.description}</p>
                      <div className="mb-3">
                        <strong>Current PowerBI ID:</strong>
                        <br />
                        <code className="small">{report.powerBIReportId}</code>
                      </div>
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

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            Edit PowerBI ID - {editingReport?.title}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
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
