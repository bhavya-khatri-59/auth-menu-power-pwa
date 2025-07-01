
import { useEffect, useRef, useState } from 'react';
import { models, Report, service, factories } from 'powerbi-client';

interface PowerBIEmbedProps {
  reportId?: string;
  embedUrl?: string;
  embedToken?: string;
  className?: string;
}

const powerbiService = new service.Service(
  factories.hpmFactory,
  factories.wpmpFactory,
  factories.routerFactory
);

const PowerBIEmbed = ({
  reportId,
  embedUrl,
  embedToken,
  className = '',
}: PowerBIEmbedProps) => {
  const reportContainer = useRef<HTMLDivElement>(null);
  const reportRef = useRef<Report | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!reportContainer.current || !reportId || !embedUrl || !embedToken) {
      if (!embedToken) setError('Embed token is not provided.');
      return;
    }

    const embedConfig = {
      type: 'report',
      id: reportId,
      embedUrl,
      accessToken: embedToken,
      tokenType: models.TokenType.Embed,
      settings: {
        panes: {
          filters: { expanded: false, visible: true },
          pageNavigation: { visible: true },
        },
        background: models.BackgroundType.Transparent,
      },
    };

    try {
      powerbiService.reset(reportContainer.current);
      reportRef.current = powerbiService.embed(
        reportContainer.current,
        embedConfig
      ) as Report;

      reportRef.current.on('loaded', () => {
        console.log('✅ Power BI report loaded');
      });

      reportRef.current.on('error', (event) => {
        const errorDetail = event.detail;
        console.error('❌ Power BI embed error:', errorDetail);
        setError(`Error embedding report: ${JSON.stringify(errorDetail, null, 2)}`);
      });
    } catch (err) {
      console.error('❌ Power BI embed exception:', err);
      setError(`Exception caught while embedding: ${err}`);
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

  if (error) {
    return (
      <div className={`text-center p-4 ${className}`}>
        <p className="text-red-700 font-bold">⚠️ Error Embedding Report</p>
        <p className="text-sm mb-2">{error}</p>
        <div className="mt-3 text-xs text-left bg-gray-100 p-2 rounded">
          <p><strong>Report ID:</strong> {reportId || 'Not provided'}</p>
          <p><strong>Embed URL:</strong> {embedUrl || 'Not provided'}</p>
        </div>
      </div>
    );
  }

  if (!embedToken) {
    return (
      <div className={`text-center p-4 ${className}`}>
        <p className="text-yellow-700 font-bold">⚠️ Authentication Required</p>
        <p className="text-sm">Embed token not provided.</p>
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

export default PowerBIEmbed;
