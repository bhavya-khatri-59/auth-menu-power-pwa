
import React, { useState, useEffect, useRef } from 'react';
import { Row, Col, Card, Button, Spinner, Alert } from 'react-bootstrap';
import { ArrowLeft, RefreshCw } from 'lucide-react';

interface MenuOption {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  powerBIReportId: string;
}

interface PowerBIViewerProps {
  menu: MenuOption;
  onBack: () => void;
}

const PowerBIViewer: React.FC<PowerBIViewerProps> = ({ menu, onBack }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reportData, setReportData] = useState<any>(null);
  const powerBIContainerRef = useRef<HTMLDivElement>(null);

  // Demo Power BI configuration
  const DEMO_CONFIG = {
    tenantId: '66ce1791-d8b3-40c2-ad54-4f01cd3c882d',
    embedToken: 'H4sIAAAAAAAEACWUxw606BFF3-XfYonUJEuzIOfQQJN2xI8cm2j53d2e2ZauSlfnlOo_f5z07qe0-PPvP6-4o5fojg9O06ggWchO9V2stlyP_xaTzheKtyDneYhUKO-q0I5GA1sYAZX7oROSbIxJa_uhyy0I2VPT562Hx-fR9Bg9FaZxS3xc4QZG8KrNPQolqzEShJ1uoJQRAd0wEJIn_bQPFg4YhquASp1zAY9UUpqcycgATQD7LNMeJ2UkttC6V8nzigjo029vXdCb29DQtmi3wm_sO7nwtl4s8SPpuJ7ivu4ZWMCfFW6hjnULgiPsBDS_udl77y1EF272IaemaameduS5iKWvJflWMH6mdFI-Sp6JdrI2hF8es7d3fU7JHJ4HL7frIW6djh3iy9Y3Wke5GKBOl58S5CMr3Ye6jfvdmNKvAWPyc7VbZ27Dz0h4HRrri3RIiDbrboR_y2jzq8A4c2m4yIIPVuejGouhuDlZZPRHWoy0ZAmHk7nxzPAzg08UgWB0W6rV8OQouKtGAReOf94JLqo1dn2l6MFz5_nAAPOZulqRbrrAfAqZspYMIPWTR1X7YCJSjHXfs2-QpLkpd3zSd07cfstM0LBo6uz2oWZ_rOsHtYIwHjb_aoOWEFWUFdvHWKScSQT6hJ1mcu1U515WAasws73Urnz8XdZui2S_jubsNEAWRMTVx-R3XA_O0MbCLQw6twspUjIdFWjHh4pFVyEYJRohcauzrnojocSWt0u57DQV9qsZOHD1Bqjt6f4JQKJjdlWqLxYkvA0XFQLxrXs9QW1KyF73Bojoi5TvROlz_aE_JV0mZ5gmNkWaFFY5RP2J38TveBSDUupL8yRJ1OR34rn11RfRWQlxVmVnu55AilggAC1JKYU7C98g2gqHw3RviHtQRYbCFnbs-49OJzpIHN9J-aKStqpmJ3sfPVUNM7NcAOJpqhUlbCIGYbRGC9bIXzs-PIp6gEB6q59Y2nxSEliRjJJS8nosQTe9DJJowirrnMtHdxA7WRvo6-jJ3_B1dzviE9zUYVyFhA83vM4ATy9PAAAR63UuJO2emw0Cu_58C2Y_m8SUEqv0B5OEx_TIyKeC9qOP381Ekq5PDeBpWwfKSFYjwF9__fnXH3695--kl_fvTcwgfLb3i4Exu77yg1TdEpGBXqESl2etr5jtEIlxg08TITSkTuJY5PotqXX5gGGmbGlkncuNJKKZSBGJxfaKYYiXG1YR2PwJbhj6vWIvcG4kvL9Xb-pVLouxE63oGj1nEei8L73kL-m-i_4wI0hj7QbvScI9RbEcALun0csX-n1RsAgOFvvbsYpYfmlwZdWc9t3JiehZqAiPxuk8ss_UZaFpiHwxxXhPzAtkOyXtOqbHetsr0-lfl8wk94uCrbhnmYLJb8O_itms-GXahhSrQKqutLjmilZafJa5fFGDwnJBxu3c3nz0dz4tmUx6AQyAX3H8rqHZBtnCRKbJ6iMXbYXnP5jvuS5XNfhRxi1ZNPINxYSPYG32T0sguu-_U14DxvS7r-Uv9oFpDOvvuLxSFDwdPidbYzir_9SVdI-t7SJOuLxWk_wty2anVeb-KJTwe8HUt_3xrq6luZyIKsevZozSINEtiS4XL0u6tza-kwibJwymKaA_7VFWeQZykZJCXhr8muJ9qLq5N_LwfvYrLzAfoPO3hLAyejHRiOXc85VmS9ZkkZfh9sInGRzmsG-vNITx4eIP-9mFKT-5gnwXOpenZvAMN8qjVkI5ThwuIoPWDZ9Ag28BL4MDTa4tpEaTL8vYtTiSmm671dDFguqLx2FMJy7qG08MSu6MRL04Hy24gwaxC-RqkH5VQkrg_C5Lz5rLoAE9VlFF3OmlynJhBynhG4pJ9Mv_Zfz3f_olcYEaBwAA.eyJjbHVzdGVyVXJsIjoiaHR0cHM6Ly9XQUJJLUlORElBLVdFU1QtcmVkaXJlY3QuYW5hbHlzaXMud2luZG93cy5uZXQiLCJleHAiOjE3NTEzNTEyMzIsImFsbG93QWNjZXNzT3ZlclB1YmxpY0ludGVybmV0Ijp0cnVlfQ==',
    embedUrl: 'https://app.powerbi.com/reportEmbed?reportId=ee1ec360-de3b-4aa9-9e3d-cab4f315a6da&groupId=a4069c5c-2e87-40df-b42b-83e854612614&w=2&config=eyJjbHVzdGVyVXJsIjoiaHR0cHM6Ly9XQUJJLUlORElBLVdFU1QtcmVkaXJlY3QuYW5hbHlzaXMud2luZG93cy5uZXQiLCJlbWJlZEZlYXR1cmVzIjp7InVzYWdlTWV0cmljc1ZOZXh0Ijp0cnVlfX0%3d',
    reportId: 'ee1ec360-de3b-4aa9-9e3d-cab4f315a6da'
  };

  const embedPowerBIReport = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // For demo purposes, we'll create an iframe with the embed URL
      const reportData = {
        reportId: DEMO_CONFIG.reportId,
        title: menu.title,
        embedUrl: DEMO_CONFIG.embedUrl,
        accessToken: DEMO_CONFIG.embedToken,
        lastUpdated: new Date().toISOString(),
        tenantId: DEMO_CONFIG.tenantId
      };
      
      setReportData(reportData);
      
      // Create and embed the iframe
      if (powerBIContainerRef.current) {
        powerBIContainerRef.current.innerHTML = `
          <iframe 
            src="${DEMO_CONFIG.embedUrl}" 
            width="100%" 
            height="600px" 
            frameborder="0" 
            allowfullscreen="true"
            style="border: 1px solid #ccc; border-radius: 8px;"
            title="Power BI Report - ${menu.title}"
          ></iframe>
        `;
      }
      
    } catch (err) {
      setError('Failed to load Power BI report. Please try again.');
      console.error('Power BI Embed Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    embedPowerBIReport();
  }, [menu.powerBIReportId]);

  const handleRefresh = () => {
    embedPowerBIReport();
  };

  const renderPowerBIReport = () => {
    if (!reportData) return null;

    return (
      <div className="mt-4">
        <Row>
          <Col>
            <Card className="p-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="fw-bold mb-0">Live Power BI Report</h5>
                <div className="text-muted small">
                  Last Updated: {new Date(reportData.lastUpdated).toLocaleString()}
                </div>
              </div>
              <div 
                ref={powerBIContainerRef}
                className="powerbi-embed-container"
                style={{ minHeight: '600px' }}
              >
                {/* Power BI iframe will be inserted here */}
              </div>
              <div className="mt-3 text-muted small">
                <strong>Report Details:</strong><br/>
                Report ID: {reportData.reportId}<br/>
                Tenant ID: {reportData.tenantId}<br/>
                Status: Connected & Live
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    );
  };

  return (
    <>
      <Row className="mb-4">
        <Col>
          <div className="d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center">
              <Button
                variant="outline-primary"
                size="sm"
                onClick={onBack}
                className="me-3"
              >
                <ArrowLeft size={16} className="me-1" />
                Back to Menu
              </Button>
              <div>
                <h3 className="fw-bold mb-1">{menu.title}</h3>
                <p className="text-muted mb-0">{menu.description}</p>
              </div>
            </div>
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={handleRefresh}
              disabled={loading}
            >
              <RefreshCw size={16} className="me-1" />
              Refresh
            </Button>
          </div>
        </Col>
      </Row>

      {loading ? (
        <Row>
          <Col>
            <Card className="powerbi-container">
              <Card.Body className="d-flex align-items-center justify-content-center" style={{ minHeight: '400px' }}>
                <div className="text-center">
                  <Spinner animation="border" variant="primary" className="mb-3" />
                  <h5>Loading Power BI Report...</h5>
                  <p className="text-muted">Establishing secure connection...</p>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      ) : error ? (
        <Row>
          <Col>
            <Alert variant="danger">
              <h6>Error Loading Report</h6>
              {error}
              <div className="mt-2">
                <Button variant="danger" size="sm" onClick={handleRefresh}>
                  Try Again
                </Button>
              </div>
            </Alert>
          </Col>
        </Row>
      ) : (
        renderPowerBIReport()
      )}
    </>
  );
};

export default PowerBIViewer;
