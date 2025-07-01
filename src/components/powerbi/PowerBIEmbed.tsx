
import { useEffect, useRef } from 'react';
import {
  models,
  service,
  factories,
  Report
} from 'powerbi-client';

interface PowerBIEmbedProps {
  embedToken: string;
  embedUrl: string;
  reportId: string;
  tokenType?: '0' | '1'; // 0 for AAD, 1 for Embed
  className?: string;
}

const powerbiService = new service.Service(
  factories.hpmFactory,
  factories.wpmpFactory,
  factories.routerFactory
);

const PowerBIEmbed = ({
  embedToken,
  embedUrl,
  reportId,
  tokenType = '1',
  className = ''
}: PowerBIEmbedProps) => {
  const embedContainerRef = useRef<HTMLDivElement>(null);
  const reportRef = useRef<Report | null>(null);

  useEffect(() => {
    if (!embedToken || !embedUrl || !reportId || !embedContainerRef.current) {
      console.log('Missing required props:', { embedToken: !!embedToken, embedUrl: !!embedUrl, reportId: !!reportId });
      return;
    }

    console.log('Embedding PowerBI with:', { reportId, embedUrl: embedUrl.substring(0, 50) + '...', tokenType });

    const config = {
      type: 'report',
      tokenType: tokenType === '0' ? models.TokenType.Aad : models.TokenType.Embed,
      accessToken: embedToken,
      embedUrl: embedUrl,
      id: reportId,
      permissions: models.Permissions.All,
      settings: {
        panes: {
          filters: { visible: true },
          pageNavigation: { visible: true }
        },
        bars: {
          statusBar: { visible: true }
        }
      }
    };

    powerbiService.reset(embedContainerRef.current); // clear old embeds

    const report = powerbiService.embed(embedContainerRef.current, config) as Report;
    reportRef.current = report;

    const reportLoaded = new Promise<void>((resolve) => {
      report.off('loaded');
      report.on('loaded', () => {
        console.log('✅ Report Loaded');
        resolve();
      });
    });

    const reportRendered = new Promise<void>((resolve) => {
      report.off('rendered');
      report.on('rendered', () => {
        console.log('✅ Report Rendered');
        resolve();
      });
    });

    report.off('error');
    report.on('error', (event) => {
      console.error('❌ Embed error:', event.detail);
    });

    // Handle async loading
    (async () => {
      try {
        await reportLoaded;
        console.log('✅ Report loaded successfully');
        await reportRendered;
        console.log('✅ Report rendered successfully');
      } catch (error) {
        console.error('❌ Error during report loading/rendering:', error);
      }
    })();

    return () => {
      if (reportRef.current) {
        reportRef.current.off('loaded');
        reportRef.current.off('rendered');
        reportRef.current.off('error');
      }
    };
  }, [embedToken, embedUrl, reportId, tokenType]);

  if (!embedToken || !embedUrl || !reportId) {
    return (
      <div className={`text-center p-4 ${className}`} style={{ width: '100%', height: '600px' }}>
        <p className="text-yellow-700 font-bold">⚠️ Missing PowerBI Configuration</p>
        <p className="text-sm">
          Missing: {!embedToken && 'Embed Token'} {!embedUrl && 'Embed URL'} {!reportId && 'Report ID'}
        </p>
      </div>
    );
  }

  return (
    <div
      ref={embedContainerRef}
      className={className}
      style={{ width: '100%', height: '600px' }}
    />
  );
};

export default PowerBIEmbed;
