
import { useEffect, useRef } from 'react';
import {
  models,
  Report,
  service,
  factories
} from 'powerbi-client';

interface PowerBIEmbedProps {
  reportId?: string;
  clientId?: string;
  embedUrl?: string;
  embedToken?: string;
  tenantId?: string;
  className?: string;
}

// ✅ Singleton Power BI Service instance
const powerbiService = new service.Service(
  factories.hpmFactory,
  factories.wpmpFactory,
  factories.routerFactory
);

const PowerBIEmbed = ({
  reportId,
  clientId,
  embedUrl,
  embedToken,
  tenantId,
  className = ''
}: PowerBIEmbedProps) => {
  const reportContainer = useRef<HTMLDivElement>(null);
  const reportRef = useRef<Report | null>(null);

  useEffect(() => {
    if (!reportContainer.current || !reportId || !embedUrl || !embedToken) return;

    const embedConfig = {
      type: 'report',
      id: reportId,
      embedUrl,
      accessToken: embedToken,
      tokenType: models.TokenType.Embed,
      settings: {
        panes: {
          filters: { expanded: false, visible: true },
          pageNavigation: { visible: true }
        },
        background: models.BackgroundType.Transparent
      }
    };

    try {
      // Cleanup any previous embeds
      powerbiService.reset(reportContainer.current);

      reportRef.current = powerbiService.embed(
        reportContainer.current,
        embedConfig
      ) as Report;

      reportRef.current.on('loaded', () => {
        console.log('✅ Power BI report loaded');
      });

      reportRef.current.on('error', (event) => {
        console.error('❌ Power BI embed error:', event.detail);
      });

    } catch (error) {
      console.error('❌ Power BI embed exception:', error);
    }

    return () => {
      if (reportRef.current) {
        try {
          reportRef.current.off('loaded');
          reportRef.current.off('error');
        } catch (e) {
          console.warn('⚠️ Cleanup failed:', e);
        }
      }
    };
  }, [reportId, embedUrl, embedToken]);

  if (!embedToken) {
    return (
      <div className={`text-center p-4 ${className}`}>
        <p className="text-yellow-700 font-bold">⚠️ Authentication Required</p>
        <p className="text-sm">Embed token not provided.</p>
        <div className="mt-3 text-sm text-left space-y-1">
          <p><strong>Report ID:</strong> {reportId}</p>
          <p><strong>Client ID:</strong> {clientId}</p>
          <p><strong>Tenant ID:</strong> {tenantId}</p>
          <p><strong>Embed URL:</strong> {embedUrl}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={reportContainer}
      className={`w-full h-full ${className}`}
      style={{ minHeight: '400px' }}
    />
  );
};

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
  console.log('PowerBI Viewer menu data:', menu);

  return (
    <div className="h-full">
      <div className="mb-4 d-flex justify-content-between align-items-center">
        <div>
          <button
            onClick={onBack}
            className="btn btn-outline-secondary btn-sm mb-2"
          >
            ← Back to Reports
          </button>
          <h3 className="mb-0">{menu.title}</h3>
          <p className="text-muted mb-0">{menu.description}</p>
        </div>
      </div>

      <div className="card">
        <div className="card-body p-0" style={{ height: '600px' }}>
          <PowerBIEmbed
            reportId={menu.reportId}
            clientId={menu.clientId}
            embedUrl={menu.embedUrl}
            embedToken={menu.embedToken}
            tenantId={menu.tenantId}
            className="h-100"
          />
        </div>
      </div>
    </div>
  );
};

export default PowerBIViewer;
