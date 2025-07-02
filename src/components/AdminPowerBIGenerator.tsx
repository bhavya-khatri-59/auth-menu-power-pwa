
import React, { useState } from 'react';
import { Row, Col, Card, Button, Form, Alert, Spinner } from 'react-bootstrap';
import { Wand2, Copy } from 'lucide-react';
import { API_ENDPOINTS } from '../config/api';

/**
 * AdminPowerBIGenerator Component - Utility for generating PowerBI embed tokens and URLs
 * 
 * This component provides administrators with a standalone tool to:
 * - Generate PowerBI embed tokens for testing and development
 * - Create embed URLs for specific reports, datasets, and core datasets
 * - Test PowerBI authentication and configuration
 * - Copy generated tokens and URLs for use in other systems
 * 
 * Key Features:
 * - Form-based input for PowerBI configuration parameters
 * - Real-time generation of embed tokens and URLs
 * - Copy-to-clipboard functionality for easy integration
 * - Error handling for authentication and PowerBI API issues
 * - Visual feedback for successful token generation
 */
const AdminPowerBIGenerator: React.FC = () => {
  // State management for form data and generated embed details
  const [formData, setFormData] = useState({
    reportId: '',
    datasetId: '',
    coreDatasetId: ''
  });
  const [embedDetails, setEmbedDetails] = useState<{
    embedToken: string;
    embedUrl: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  /**
   * Handles the generation of PowerBI embed tokens and URLs
   * Validates form input, communicates with backend API, and processes response
   * Updates state with generated embed details for display and copying
   */
  const handleGenerate = async () => {
    // Validate all required fields are present
    if (!formData.reportId || !formData.datasetId || !formData.coreDatasetId) {
      setError('All fields are required');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('jwt_token');
      const response = await fetch(API_ENDPOINTS.adminGenerateEmbed, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate embed details');
      }

      const data = await response.json();
      setEmbedDetails(data);
      setSuccess('Embed details generated successfully!');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Copies specified text to clipboard and provides user feedback
   * Uses the modern Clipboard API for secure copying operation
   * 
   * @param text - Text content to copy to clipboard
   * @param label - Label for user feedback message
   */
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setSuccess(`${label} copied to clipboard!`);
    // Auto-clear success message after short delay
    setTimeout(() => setSuccess(''), 2000);
  };

  return (
    <Card>
      <Card.Header>
        <h5 className="mb-0 d-flex align-items-center">
          <Wand2 size={20} className="me-2" />
          PowerBI Embed Generator
        </h5>
      </Card.Header>
      <Card.Body>
        <Row>
          {/* Left column: Input form for PowerBI parameters */}
          <Col md={6}>
            <Form>
              {/* Report ID input field */}
              <Form.Group className="mb-3">
                <Form.Label>Report ID</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.reportId}
                  onChange={(e) => setFormData({...formData, reportId: e.target.value})}
                  placeholder="Enter PowerBI Report ID"
                />
              </Form.Group>
              
              {/* Dataset ID input field */}
              <Form.Group className="mb-3">
                <Form.Label>Dataset ID</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.datasetId}
                  onChange={(e) => setFormData({...formData, datasetId: e.target.value})}
                  placeholder="Enter Dataset ID"
                />
              </Form.Group>
              
              {/* Core Dataset ID input field */}
              <Form.Group className="mb-3">
                <Form.Label>Core Dataset ID</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.coreDatasetId}
                  onChange={(e) => setFormData({...formData, coreDatasetId: e.target.value})}
                  placeholder="Enter Core Dataset ID"
                />
              </Form.Group>
              
              {/* Generate button */}
              <Button
                variant="primary"
                onClick={handleGenerate}
                disabled={loading}
                className="d-flex align-items-center"
              >
                <Wand2 size={16} className="me-1" />
                {loading ? 'Generating...' : 'Generate Embed Details'}
              </Button>
            </Form>
          </Col>
          
          {/* Right column: Results display and status messages */}
          <Col md={6}>
            {/* Error message display */}
            {error && (
              <Alert variant="danger" className="mb-3">
                {error}
              </Alert>
            )}
            
            {/* Success message display */}
            {success && (
              <Alert variant="success" className="mb-3">
                {success}
              </Alert>
            )}
            
            {/* Loading state display */}
            {loading && (
              <div className="text-center">
                <Spinner animation="border" variant="primary" />
                <p className="mt-2">Generating embed details...</p>
              </div>
            )}
            
            {/* Generated embed details display */}
            {embedDetails && (
              <div>
                <h6>Generated Embed Details:</h6>
                
                {/* Embed Token display with copy button */}
                <Form.Group className="mb-3">
                  <Form.Label>Embed Token</Form.Label>
                  <div className="input-group">
                    <Form.Control
                      as="textarea"
                      rows={3}
                      value={embedDetails.embedToken}
                      readOnly
                      className="bg-light"
                    />
                    <Button
                      variant="outline-secondary"
                      onClick={() => copyToClipboard(embedDetails.embedToken, 'Embed Token')}
                    >
                      <Copy size={16} />
                    </Button>
                  </div>
                </Form.Group>
                
                {/* Embed URL display with copy button */}
                <Form.Group className="mb-3">
                  <Form.Label>Embed URL</Form.Label>
                  <div className="input-group">
                    <Form.Control
                      type="text"
                      value={embedDetails.embedUrl}
                      readOnly
                      className="bg-light"
                    />
                    <Button
                      variant="outline-secondary"
                      onClick={() => copyToClipboard(embedDetails.embedUrl, 'Embed URL')}
                    >
                      <Copy size={16} />
                    </Button>
                  </div>
                </Form.Group>
              </div>
            )}
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
};

export default AdminPowerBIGenerator;
