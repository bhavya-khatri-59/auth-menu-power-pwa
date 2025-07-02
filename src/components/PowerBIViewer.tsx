
import React, { useState, useEffect } from 'react';
import { Button } from 'react-bootstrap';
import { ArrowLeft, Maximize, Minimize } from 'lucide-react';
import PowerBIEmbed from './powerbi/PowerBIEmbed';

/**
 * PowerBIViewer Component - Wrapper for PowerBI report embedding with controls
 * 
 * Features:
 * - Responsive PowerBI report embedding
 * - Fullscreen functionality using browser APIs
 * - Navigation controls and report metadata display
 * - Automatic fullscreen state management
 */

// Props interface for PowerBI viewer
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
  
  // Debug logging for troubleshooting
  console.log('PowerBI Viewer menu data:', menu);

  /**
   * Handles fullscreen mode toggle using browser's Fullscreen API
   * Provides true fullscreen experience across the entire screen
   */
  const toggleFullscreen = async () => {
    try {
      if (!isFullscreen) {
        // Enter fullscreen mode
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        }
      } else {
        // Exit fullscreen mode
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
      }
    } catch (error) {
      console.error('Fullscreen operation failed:', error);
    }
  };

  /**
   * Listen for fullscreen changes to sync state
   * Handles cases where user exits fullscreen via ESC key
   */
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    // Add event listeners for fullscreen changes
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);

    // Cleanup event listeners
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Dynamic styling based on fullscreen state
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
      {/* Report controls and navigation */}
      <div className={`mb-3 ${isFullscreen ? 'p-3' : ''}`}>
        <div className="d-flex justify-content-between align-items-center">
          <div>
            {/* Back button */}
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={onBack}
              className="me-3"
            >
              <ArrowLeft size={16} className="me-1" />
              Back
            </Button>
            {/* Report title */}
            <span className="fw-bold">{menu.title}</span>
          </div>
          {/* Fullscreen toggle button */}
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
        {/* Report description (hidden in fullscreen for space) */}
        {!isFullscreen && (
          <p className="text-muted mb-0 mt-2">{menu.description}</p>
        )}
      </div>

      {/* PowerBI report container */}
      <div className="card" style={cardStyle}>
        <div className="card-body p-0 h-100">
          {/* PowerBI embed component with report configuration */}
          <PowerBIEmbed
            reportId={menu.reportId || menu.powerBIReportId}
            embedUrl={menu.embedUrl || ''}
            embedToken={menu.embedToken || ''}
            tokenType="1" // Embed token type
            className="h-100"
          />
        </div>
      </div>
    </div>
  );
};

export default PowerBIViewer;
