
import React, { useState } from 'react';
import { Button } from 'react-bootstrap';
import { ArrowLeft, Maximize, Minimize } from 'lucide-react';
import PowerBIEmbed from './powerbi/PowerBIEmbed';

// PowerBI Viewer component that wraps the embed
interface PowerBIViewerProps {
  menu: {
    id: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    powerBIReportId: string;
    reportId?: string;
    embedUrl?: string;
    embedToken?: string;
    tenantId?: string;
    clientId?: string;
  };
  onBack: () => void;
}

const PowerBIViewer = ({ menu, onBack }: PowerBIViewerProps) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  console.log('PowerBI Viewer menu data:', menu);

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      // Enter fullscreen
      document.documentElement.requestFullscreen?.();
    } else {
      // Exit fullscreen
      document.exitFullscreen?.();
    }
    setIsFullscreen(!isFullscreen);
  };

  const containerStyle = isFullscreen ? {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    zIndex: 9999,
    backgroundColor: 'white'
  } : {};

  const cardStyle = isFullscreen ? {
    height: '100vh',
    border: 'none',
    borderRadius: 0
  } : {
    height: 'calc(100vh - 200px)'
  };

  return (
    <div style={containerStyle}>
      <div className={`mb-3 ${isFullscreen ? 'p-3' : ''}`}>
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={onBack}
              className="me-3"
            >
              <ArrowLeft size={16} className="me-1" />
              Back
            </Button>
            <span className="fw-bold">{menu.title}</span>
          </div>
          <Button
            variant="outline-primary"
            size="sm"
            onClick={toggleFullscreen}
          >
            {isFullscreen ? (
              <>
                <Minimize size={16} className="me-1" />
                Exit Fullscreen
              </>
            ) : (
              <>
                <Maximize size={16} className="me-1" />
                Fullscreen
              </>
            )}
          </Button>
        </div>
        {!isFullscreen && (
          <p className="text-muted mb-0 mt-2">{menu.description}</p>
        )}
      </div>

      <div className="card" style={cardStyle}>
        <div className="card-body p-0 h-100">
          <PowerBIEmbed
            reportId={menu.reportId || menu.powerBIReportId}
            embedUrl={menu.embedUrl || ''}
            embedToken={menu.embedToken || ''}
            tokenType="1"
            className="h-100"
          />
        </div>
      </div>
    </div>
  );
};

export default PowerBIViewer;
