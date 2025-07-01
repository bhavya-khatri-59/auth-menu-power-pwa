
import React, { useState } from 'react';
import { Row, Col, Card, Button, Form, Alert, Spinner } from 'react-bootstrap';
import { Wand2, Copy } from 'lucide-react';
import { API_ENDPOINTS } from '../config/api';

const AdminPowerBIGenerator: React.FC = () => {
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

  const handleGenerate = async () => {
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

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setSuccess(`${label} copied to clipboard!`);
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
          <Col md={6}>
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Report ID</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.reportId}
                  onChange={(e) => setFormData({...formData, reportId: e.target.value})}
                  placeholder="Enter PowerBI Report ID"
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Dataset ID</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.datasetId}
                  onChange={(e) => setFormData({...formData, datasetId: e.target.value})}
                  placeholder="Enter Dataset ID"
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Core Dataset ID</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.coreDatasetId}
                  onChange={(e) => setFormData({...formData, coreDatasetId: e.target.value})}
                  placeholder="Enter Core Dataset ID"
                />
              </Form.Group>
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
          <Col md={6}>
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
            {loading && (
              <div className="text-center">
                <Spinner animation="border" variant="primary" />
                <p className="mt-2">Generating embed details...</p>
              </div>
            )}
            {embedDetails && (
              <div>
                <h6>Generated Embed Details:</h6>
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
