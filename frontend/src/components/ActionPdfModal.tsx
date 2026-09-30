import React, { useRef } from 'react';
import { WeatherAlert } from '../api/types';
import { ShieldCheck, Download, Printer, X, FileText, CheckCircle2 } from 'lucide-react';

interface ActionPdfModalProps {
  alerts: WeatherAlert[];
  region: string;
  onClose: () => void;
}

export const ActionPdfModal: React.FC<ActionPdfModalProps> = ({ alerts, region, onClose }) => {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const win = window.open('', '_blank');
    if (!win) return;

    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>ForeCombine Official Civil Defense Bulletin - ${region || 'All Regions'}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; color: #1e293b; line-height: 1.5; }
            .header { border-bottom: 3px solid #0d9488; padding-bottom: 15px; margin-bottom: 25px; display: flex; justify-content: space-between; }
            .title { font-size: 24px; font-weight: bold; color: #0f172a; }
            .subtitle { font-size: 13px; color: #0d9488; font-weight: bold; text-transform: uppercase; margin-top: 4px; }
            .meta-grid { display: grid; grid-template-cols: 1fr 1fr 1fr; gap: 15px; margin-bottom: 25px; background: #f8fafc; padding: 15px; border-radius: 8px; border: 1fr solid #e2e8f0; }
            .meta-label { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: bold; }
            .meta-val { font-size: 14px; font-weight: bold; color: #0f172a; }
            .alert-card { border: 1px solid #cbd5e1; border-radius: 8px; padding: 15px; margin-bottom: 15px; page-break-inside: avoid; }
            .alert-card.severe { border-left: 6px solid #ef4444; background: #fef2f2; }
            .alert-card.warning { border-left: 6px solid #f59e0b; background: #fffbeb; }
            .alert-title { font-size: 16px; font-weight: bold; color: #0f172a; margin-bottom: 6px; }
            .alert-msg { font-size: 13px; color: #334155; margin-bottom: 10px; }
            .protocol { background: #ffffff; padding: 10px; border-radius: 6px; border: 1px solid #e2e8f0; font-size: 12px; font-weight: bold; color: #0f172a; }
            .footer { margin-top: 40px; border-top: 1px solid #cbd5e1; pt: 15px; font-size: 11px; color: #64748b; display: flex; justify-content: space-between; }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => {
      win.print();
    }, 250);
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-3xl bg-surface border border-border rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-accent/20 text-accent border border-accent/30">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-heading font-extrabold text-text-primary tracking-tight">
                Official Civil Defense Action Bulletin
              </h2>
              <p className="text-xs text-text-secondary">
                Formatted printable PDF report for emergency deployment and dispatch desks
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* PDF Document Preview Content */}
        <div className="flex-1 overflow-y-auto my-4 pr-2 space-y-4">
          <div ref={printRef} className="p-6 bg-slate-900 rounded-2xl border border-border text-text-primary">
            <div className="header">
              <div>
                <div className="title">ForeCombine Civil Defense Directive</div>
                <div className="subtitle">Ministry of Earth Sciences • High-Resolution Blending Core</div>
              </div>
              <div className="text-right text-xs text-text-muted">
                <div>Document ID: FC-BULLET-2026</div>
                <div>Issued: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
              </div>
            </div>

            <div className="meta-grid">
              <div>
                <div className="meta-label">Target Region</div>
                <div className="meta-val">{region || 'All Operational Zones'}</div>
              </div>
              <div>
                <div className="meta-label">Active Hazards</div>
                <div className="meta-val">{alerts.length} Directives Active</div>
              </div>
              <div>
                <div className="meta-label">Verification Standard</div>
                <div className="meta-val text-accent">IMD NWP Skill Weighted</div>
              </div>
            </div>

            <div className="space-y-4">
              {alerts.map((alert, idx) => (
                <div
                  key={idx}
                  className={`alert-card ${alert.severity === 'severe' ? 'severe' : 'warning'}`}
                >
                  <div className="alert-title flex items-center justify-between">
                    <span>{alert.hazard} — {alert.region}</span>
                    <span className="text-xs font-mono uppercase">Severity: {alert.severity}</span>
                  </div>
                  <div className="alert-msg">{alert.message}</div>
                  {alert.action_protocol && (
                    <div className="protocol">
                      Mandatory Directive: {alert.action_protocol}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="footer">
              <div>Generated via ForeCombine Adaptive NWP-AI Blending Core</div>
              <div>Page 1 of 1 • Certified Operational Bulletin</div>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="pt-4 border-t border-border flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-border text-text-secondary hover:text-text-primary text-xs font-semibold"
          >
            Cancel
          </button>

          <button
            onClick={handlePrint}
            className="px-5 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-slate-950 font-bold text-xs shadow-glow-teal flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Save as PDF Document</span>
          </button>
        </div>
      </div>
    </div>
  );
};
