
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

const PowerBIViewer = ({ menu }: PowerBIViewerProps) => {
  console.log('PowerBI Viewer menu data:', menu);

  return (
    <div className="h-100">
      <div className="mb-3">
        <p className="text-muted mb-0">{menu.description}</p>
      </div>

      <div className="card h-100">
        <div className="card-body p-0" style={{ height: 'calc(100vh - 200px)' }}>
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
