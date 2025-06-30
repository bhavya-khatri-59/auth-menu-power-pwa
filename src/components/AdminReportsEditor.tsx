
import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Form, Alert, Spinner, Modal, Accordion } from 'react-bootstrap';
import { Plus, Edit, Trash2, Save } from 'lucide-react';
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

const AdminReportsEditor: React.FC = () => {
  const [reportsData, setReportsData] = useState<ReportsData>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingReport, setEditingReport] = useState<Report | null>(null);
  const [editingDepartment, setEditingDepartment] = useState('');

  const [formData, setFormData] = useState({
    id: '',
    title: '',
    description: '',
    icon: '',
    powerBIReportId: ''
  });

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

  const saveReportsData = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const token = localStorage.getItem('jwt_token');
      const response = await fetch(API_ENDPOINTS.adminUpdateReports, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reportsData }),
      });

      if (!response.ok) {
        throw new Error('Failed to save reports data');
      }

      setSuccess('Reports data saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleEditReport = (department: string, report: Report) => {
    setEditingDepartment(department);
    setEditingReport(report);
    setFormData({
      id: report.id,
      title: report.title,
      description: report.description,
      icon: report.icon,
      powerBIReportId: report.powerBIReportId
    });
    setShowModal(true);
  };

  const handleAddReport = (department: string) => {
    setEditingDepartment(department);
    setEditingReport(null);
    setFormData({
      id: '',
      title: '',
      description: '',
      icon: '',
      powerBIReportId: ''
    });
    setShowModal(true);
  };

  const handleSaveReport = () => {
    if (!formData.id || !formData.title) return;

    const updatedReportsData = { ...reportsData };
    
    if (editingReport) {
      // Edit existing report
      const reportIndex = updatedReportsData[editingDepartment].findIndex(r => r.id === editingReport.id);
      if (reportIndex !== -1) {
        updatedReportsData[editingDepartment][reportIndex] = { ...formData };
      }
    } else {
      // Add new report
      if (!updatedReportsData[editingDepartment]) {
        updatedReportsData[editingDepartment] = [];
      }
      updatedReportsData[editingDepartment].push({ ...formData });
    }

    setReportsData(updatedReportsData);
    setShowModal(false);
  };

  const handleDeleteReport = (department: string, reportId: string) => {
    const updatedReportsData = { ...reportsData };
    updatedReportsData[department] = updatedReportsData[department].filter(r => r.id !== reportId);
    setReportsData(updatedReportsData);
  };

  if (loading) {
    return (
      <div className="text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Loading reports data...</p>
      </div>
    );
  }

  return (
    <>
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <h4>Reports Management</h4>
            <Button
              variant="primary"
              onClick={saveReportsData}
              disabled={saving}
              className="d-flex align-items-center"
            >
              <Save size={16} className="me-1" />
              {saving ? 'Saving...' : 'Save All Changes'}
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

      <Accordion>
        {Object.entries(reportsData).map(([department, reports]) => (
          <Accordion.Item key={department} eventKey={department}>
            <Accordion.Header>{department} Department ({reports.length} reports)</Accordion.Header>
            <Accordion.Body>
              <div className="mb-3">
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={() => handleAddReport(department)}
                  className="d-flex align-items-center"
                >
                  <Plus size={16} className="me-1" />
                  Add Report
                </Button>
              </div>
              
              <Row className="g-3">
                {reports.map((report) => (
                  <Col key={report.id} md={6} lg={4}>
                    <Card className="h-100">
                      <Card.Body>
                        <h6 className="fw-bold">{report.title}</h6>
                        <p className="text-muted small mb-2">{report.description}</p>
                        <p className="text-muted small mb-2">
                          <strong>Icon:</strong> {report.icon}<br/>
                          <strong>PowerBI ID:</strong> {report.powerBIReportId}
                        </p>
                        <div className="d-flex gap-2">
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => handleEditReport(department, report)}
                          >
                            <Edit size={14} />
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleDeleteReport(department, report.id)}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            </Accordion.Body>
          </Accordion.Item>
        ))}
      </Accordion>

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            {editingReport ? 'Edit Report' : 'Add New Report'} - {editingDepartment}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Report ID</Form.Label>
              <Form.Control
                type="text"
                value={formData.id}
                onChange={(e) => setFormData({...formData, id: e.target.value})}
                placeholder="unique-report-id"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Title</Form.Label>
              <Form.Control
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder="Report Title"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Report description"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Icon</Form.Label>
              <Form.Control
                type="text"
                value={formData.icon}
                onChange={(e) => setFormData({...formData, icon: e.target.value})}
                placeholder="DollarSign, BarChart3, TrendingUp, etc."
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>PowerBI Report ID</Form.Label>
              <Form.Control
                type="text"
                value={formData.powerBIReportId}
                onChange={(e) => setFormData({...formData, powerBIReportId: e.target.value})}
                placeholder="powerbi-report-id"
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSaveReport}>
            {editingReport ? 'Update Report' : 'Add Report'}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default AdminReportsEditor;
