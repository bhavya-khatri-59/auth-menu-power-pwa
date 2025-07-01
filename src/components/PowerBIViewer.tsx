
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
