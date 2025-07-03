import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Form, Alert, Spinner, Modal, Accordion } from 'react-bootstrap';
import { Plus, Edit, Trash2, Save, ToggleLeft, ToggleRight, Eye, Wand2 } from 'lucide-react';
import { API_ENDPOINTS } from '../config/api';
import PowerBIViewer from './PowerBIViewer';

interface Report {
  id: string;
  title: string;
  description: string;
  icon: string;
  powerBIReportId: string;
  clientId: string;
  reportId: string;
  datasetId?: string;
  coreDatasetId?: string;
  embedUrl: string;
  embedToken: string;
  tenantId: string;
  isActive: boolean;
}

interface ReportsData {
  [department: string]: Report[];
}

interface AdminReportsEditorProps {
  onStatsUpdate?: () => void;
}

/**
 * AdminReportsEditor Component - Comprehensive interface for managing all report configurations
 * 
 * This is the primary administrative interface for report management, providing:
 * - Complete CRUD operations for reports across all departments
 * - PowerBI configuration management with automatic embed token generation
 * - Department-based report organization with accordion interface
 * - Real-time report status management (Active/Inactive toggle)
 * - Integrated PowerBI viewer for testing reports
 * - Bulk operations and batch updates for efficient management
 * 
 * Key Features:
 * - Accordion-based department organization for scalable report management
 * - Modal-based report editing with comprehensive form validation
 * - Automatic PowerBI embed token generation with real-time feedback
 * - Manual override options for advanced PowerBI configurations
 * - Visual status indicators and interactive report cards
 * - Integrated report preview functionality
 * - Save-all functionality for batch updates
 */

// Helper function to fetch embed details
async function fetchEmbedDetails(reportId: string, datasetId: string, coreDatasetId: string, token: string) {
  const res = await fetch(API_ENDPOINTS.adminGenerateEmbed, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ reportId, datasetId, coreDatasetId })
  });

  if (!res.ok) {
    console.error(await res.text());
    throw new Error('Failed to generate embed token');
  }

  return await res.json(); // { embedToken, embedUrl }
}

const AdminReportsEditor: React.FC<AdminReportsEditorProps> = ({ onStatsUpdate }) => {
  const [reportsData, setReportsData] = useState<ReportsData>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingReport, setEditingReport] = useState<Report | null>(null);
  const [editingDepartment, setEditingDepartment] = useState('');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generatedEmbed, setGeneratedEmbed] = useState<{embedToken: string, embedUrl: string} | null>(null);

  const [formData, setFormData] = useState({
    id: '',
    title: '',
    description: '',
    icon: '',
    powerBIReportId: '',
    clientId: '',
    reportId: '',
    datasetId: '',
    coreDatasetId: '',
    embedUrl: '',
    embedToken: '',
    tenantId: '',
    isActive: true
  });

  const [powerBIGeneratorData, setPowerBIGeneratorData] = useState({
    reportId: '',
    datasetId: '',
    coreDatasetId: ''
  });

  /**
   * Effect hook to fetch all reports data when component mounts
   */
  useEffect(() => {
    fetchReportsData();
  }, []);

  /**
   * Fetches all reports data organized by department from the admin API
   * Loads the complete report configuration including PowerBI settings
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
   * Generates PowerBI embed token and URL using the form's current configuration
   * Validates required fields and provides real-time feedback to the user
   * Auto-fills the embed URL and token fields upon successful generation
   */
  const generatePowerBIEmbed = async () => {
    if (!formData.reportId || !formData.datasetId || !formData.coreDatasetId) {
      setError('Please fill in Report ID, Dataset ID, and Core Dataset ID');
      return;
    }

    setGenerating(true);
    setError('');
    
    try {
      const token = localStorage.getItem('jwt_token');
      const data = await fetchEmbedDetails(
        formData.reportId,
        formData.datasetId,
        formData.coreDatasetId,
        token!
      );
      
      setGeneratedEmbed(data);
      
      // Auto-fill the form with generated data
      setFormData(prev => ({
        ...prev,
        embedUrl: data.embedUrl,
        embedToken: data.embedToken
      }));

    } catch (err) {
      setError((err as Error).message);
    } finally {
      setGenerating(false);
    }
  };

  /**
   * Saves all report data changes to the backend in a single operation
   * Provides batch update functionality for efficient data management
   */
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
      
      // Update stats if callback provided
      if (onStatsUpdate) {
        onStatsUpdate();
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  /**
   * Toggles the active/inactive status of a specific report
   * Updates the UI immediately for responsive user experience
   * 
   * @param department - Department containing the report
   * @param reportId - ID of the report to toggle
   */
  const toggleReportStatus = (department: string, reportId: string) => {
    const updatedReportsData = { ...reportsData };
    const reportIndex = updatedReportsData[department].findIndex(r => r.id === reportId);
    if (reportIndex !== -1) {
      updatedReportsData[department][reportIndex].isActive = !updatedReportsData[department][reportIndex].isActive;
      setReportsData(updatedReportsData);
    }
  };

  /**
   * Handles report viewing by setting up PowerBI viewer
   * Creates a temporary report object for the viewer component
   * 
   * @param report - Report object to view
   */
  const handleViewReport = (report: Report) => {
    setSelectedReport(report);
  };

  /**
   * Initiates report editing by opening the modal with pre-filled data
   * Sets up the form state with the current report configuration
   * 
   * @param department - Department containing the report
   * @param report - Report object to edit
   */
  const handleEditReport = (department: string, report: Report) => {
    setEditingDepartment(department);
    setEditingReport(report);
    setFormData({
      id: report.id,
      title: report.title,
      description: report.description,
      icon: report.icon,
      powerBIReportId: report.powerBIReportId,
      clientId: report.clientId || '',
      reportId: report.reportId || '',
      datasetId: report.datasetId || '',
      coreDatasetId: report.coreDatasetId || '',
      embedUrl: report.embedUrl || '',
      embedToken: report.embedToken || '',
      tenantId: report.tenantId || '',
      isActive: report.isActive !== false
    });
    setGeneratedEmbed(null);
    setShowModal(true);
  };

  /**
   * Initiates new report creation for a specific department
   * Opens the modal with empty form fields and department pre-selected
   * 
   * @param department - Department to add the report to
   */
  const handleAddReport = (department: string) => {
    setEditingDepartment(department);
    setEditingReport(null);
    setFormData({
      id: '',
      title: '',
      description: '',
      icon: '',
      powerBIReportId: '',
      clientId: '',
      reportId: '',
      datasetId: '',
      coreDatasetId: '',
      embedUrl: '',
      embedToken: '',
      tenantId: '',
      isActive: true
    });
    setGeneratedEmbed(null);
    setShowModal(true);
  };

  /**
   * Saves report changes (both new and edited reports)
   * Handles PowerBI embed token generation automatically
   * Updates local state and provides user feedback
   */
  const handleSaveReport = async () => {
    if (!formData.id || !formData.title) return;

    try {
      setSaving(true);
      setError('');
      
      const reportData = { ...formData };
      
      // Auto-generate embed details if all required fields are present
      if (reportData.reportId && reportData.datasetId && reportData.coreDatasetId) {
        try {
          const token = localStorage.getItem('jwt_token');
          const { embedToken, embedUrl } = await fetchEmbedDetails(
            reportData.reportId,
            reportData.datasetId,
            reportData.coreDatasetId,
            token!
          );
          reportData.embedToken = embedToken;
          reportData.embedUrl = embedUrl;
        } catch (embedError) {
          console.error('Failed to generate embed details:', embedError);
          setError('Failed to generate PowerBI embed details. Report will be saved without embed info.');
        }
      }

      const updatedReportsData = { ...reportsData };
      
      if (editingReport) {
        // Edit existing report
        const reportIndex = updatedReportsData[editingDepartment].findIndex(r => r.id === editingReport.id);
        if (reportIndex !== -1) {
          updatedReportsData[editingDepartment][reportIndex] = { ...reportData };
        }
      } else {
        // Add new report
        if (!updatedReportsData[editingDepartment]) {
          updatedReportsData[editingDepartment] = [];
        }
        updatedReportsData[editingDepartment].push({ ...reportData });
      }

      setReportsData(updatedReportsData);
      setShowModal(false);
      setSuccess('Report saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  /**
   * Removes a report from the specified department
   * Updates local state immediately for responsive UI
   * 
   * @param department - Department containing the report
   * @param reportId - ID of the report to delete
   */
  const handleDeleteReport = (department: string, reportId: string) => {
    const updatedReportsData = { ...reportsData };
    updatedReportsData[department] = updatedReportsData[department].filter(r => r.id !== reportId);
    setReportsData(updatedReportsData);
  };

  if (selectedReport) {
    return (
      <PowerBIViewer
        menu={{
          id: selectedReport.id,
          title: selectedReport.title,
          description: selectedReport.description,
          icon: <span>{selectedReport.icon}</span>,
          powerBIReportId: selectedReport.powerBIReportId,
          reportId: selectedReport.reportId,
          embedUrl: selectedReport.embedUrl,
          embedToken: selectedReport.embedToken,
          tenantId: selectedReport.tenantId,
          clientId: selectedReport.clientId
        }}
        onBack={() => setSelectedReport(null)}
      />
    );
  }

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
      {/* Header section with save functionality */}
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <h5>Manage Reports & PowerBI Configuration</h5>
            {/* Global save button for batch updates */}
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

      {/* Status message displays */}
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

      {/* Department-based accordion organization */}
      <Accordion>
        {Object.entries(reportsData).map(([department, reports]) => (
          <Accordion.Item key={department} eventKey={department}>
            {/* Accordion header with department stats */}
            <Accordion.Header>
              {department} Department ({reports.length} reports, {reports.filter(r => r.isActive !== false).length} active)
            </Accordion.Header>
            <Accordion.Body>
              {/* Add new report button */}
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
              
              {/* Reports grid for the department */}
              <Row className="g-3">
                {reports.map((report) => (
                  <Col key={report.id} md={6} lg={4}>
                    <Card className={`h-100 ${report.isActive === false ? 'opacity-50' : ''}`}>
                      <Card.Body>
                        {/* Report card header with status toggle */}
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <h6 className="fw-bold">{report.title}</h6>
                          {/* Active/Inactive toggle button */}
                          <Button
                            variant="link"
                            size="sm"
                            className="p-0"
                            onClick={() => toggleReportStatus(department, report.id)}
                          >
                            {report.isActive !== false ? 
                              <ToggleRight size={20} className="text-success" /> : 
                              <ToggleLeft size={20} className="text-muted" />
                            }
                          </Button>
                        </div>
                        
                        {/* Report information display */}
                        <p className="text-muted small mb-2">{report.description}</p>
                        <p className="text-muted small mb-2">
                          <strong>Status:</strong> {report.isActive !== false ? 'Active' : 'Inactive'}<br/>
                          <strong>Icon:</strong> {report.icon}<br/>
                          <strong>PowerBI ID:</strong> {report.powerBIReportId}<br/>
                          <strong>Report ID:</strong> {report.reportId?.substring(0, 8) || 'Not set'}...<br/>
                          <strong>Has Embed:</strong> {report.embedUrl ? 'Yes' : 'No'}
                        </p>
                        
                        {/* Report action buttons */}
                        <div className="d-flex gap-2 flex-wrap">
                          {/* View report button */}
                          <Button
                            variant="outline-success"
                            size="sm"
                            onClick={() => handleViewReport(report)}
                            disabled={!report.isActive}
                            title="View Report"
                          >
                            <Eye size={14} />
                          </Button>
                          {/* Edit report button */}
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => handleEditReport(department, report)}
                          >
                            <Edit size={14} />
                          </Button>
                          {/* Delete report button */}
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

      {/* Report editing/creation modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingReport ? 'Edit Report' : 'Add New Report'} - {editingDepartment}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            {/* Basic report information fields */}
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Report ID</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.id}
                    onChange={(e) => setFormData({...formData, id: e.target.value})}
                    placeholder="unique-report-id"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Status</Form.Label>
                  <Form.Select
                    value={formData.isActive ? 'active' : 'inactive'}
                    onChange={(e) => setFormData({...formData, isActive: e.target.value === 'active'})}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            
            {/* Report title and description */}
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
            
            {/* Icon and PowerBI ID fields */}
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Icon</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.icon}
                    onChange={(e) => setFormData({...formData, icon: e.target.value})}
                    placeholder="DollarSign, BarChart3, TrendingUp, etc."
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>PowerBI Report ID</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.powerBIReportId}
                    onChange={(e) => setFormData({...formData, powerBIReportId: e.target.value})}
                    placeholder="powerbi-report-id"
                  />
                </Form.Group>
              </Col>
            </Row>

            {/* PowerBI Generator Section */}
            <Card className="mb-3">
              <Card.Header className="d-flex align-items-center">
                <Wand2 size={16} className="me-2" />
                <strong>PowerBI Configuration</strong>
              </Card.Header>
              <Card.Body>
                <p className="text-muted small mb-3">
                  Enter PowerBI IDs to automatically generate embed details
                </p>
                
                {/* PowerBI configuration input fields */}
                <Row>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Report ID</Form.Label>
                      <Form.Control
                        type="text"
                        value={formData.reportId}
                        onChange={(e) => setFormData({...formData, reportId: e.target.value})}
                        placeholder="PowerBI Report ID"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Dataset ID</Form.Label>
                      <Form.Control
                        type="text"
                        value={formData.datasetId}
                        onChange={(e) => setFormData({...formData, datasetId: e.target.value})}
                        placeholder="Primary Dataset ID"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Shared Dataset ID</Form.Label>
                      <Form.Control
                        type="text"
                        value={formData.coreDatasetId}
                        onChange={(e) => setFormData({...formData, coreDatasetId: e.target.value})}
                        placeholder="Core/Shared Dataset ID"
                      />
                    </Form.Group>
                  </Col>
                </Row>
                
                {/* Generate embed details button */}
                <div className="d-flex gap-2 mb-3">
                  <Button
                    variant="success"
                    onClick={generatePowerBIEmbed}
                    disabled={generating}
                    className="d-flex align-items-center"
                  >
                    <Wand2 size={16} className="me-1" />
                    {generating ? 'Generating...' : 'Generate Embed Details'}
                  </Button>
                </div>

                {/* Generated embed details display */}
                {generatedEmbed && (
                  <div>
                    <Alert variant="success">
                      <strong>✅ Embed details generated successfully!</strong>
                    </Alert>
                    <Form.Group className="mb-2">
                      <Form.Label>Generated Embed URL</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={2}
                        value={generatedEmbed.embedUrl}
                        readOnly
                        className="bg-light"
                      />
                    </Form.Group>
                    <Form.Group className="mb-2">
                      <Form.Label>Generated Embed Token</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        value={generatedEmbed.embedToken}
                        readOnly
                        className="bg-light"
                      />
                    </Form.Group>
                  </div>
                )}
              </Card.Body>
            </Card>

            {/* Manual Override Section for advanced users */}
            <Card>
              <Card.Header>
                <strong>Manual Override (Optional)</strong>
              </Card.Header>
              <Card.Body>
                <Form.Group className="mb-3">
                  <Form.Label>Embed URL</Form.Label>
                  <Form.Control
                    type="url"
                    value={formData.embedUrl}
                    onChange={(e) => setFormData({...formData, embedUrl: e.target.value})}
                    placeholder="https://app.powerbi.com/reportEmbed?reportId=..."
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Embed Token</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={formData.embedToken}
                    onChange={(e) => setFormData({...formData, embedToken: e.target.value})}
                    placeholder="PowerBI Embed Token"
                  />
                </Form.Group>
              </Card.Body>
            </Card>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          {/* Modal action buttons */}
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleSaveReport}
            disabled={saving}
          >
            {saving ? 'Saving...' : (editingReport ? 'Update Report' : 'Add Report')}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default AdminReportsEditor;
