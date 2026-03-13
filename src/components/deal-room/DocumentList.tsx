import type { DealDocument, DocType } from '@/lib/types';
import { FileText, ExternalLink, CheckCircle2, Clock } from 'lucide-react';

const DOC_ICONS: Record<DocType, string> = {
  transcript: '🎙️', proposal: '📋', contract: '📝', presentation: '📊',
  sow: '📜', email_thread: '📧', drive_file: '📁', meeting_notes: '📓', other: '📄',
};

const SOURCE_COLORS: Record<string, string> = {
  drive: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  gmail: 'bg-blue-500/15 text-blue-700 dark:text-blue-400',
  manual: 'bg-muted text-muted-foreground',
  agent: 'bg-teal-500/15 text-teal-700 dark:text-teal-400',
};

interface Props {
  documents: DealDocument[];
}

export function DocumentList({ documents }: Props) {
  if (!documents.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <FileText className="h-10 w-10 mb-3 opacity-40" />
        <p className="text-sm">No documents linked yet.</p>
        <p className="text-xs mt-1">Transcripts from Google Meet and documents from Drive are automatically detected by the ATLAS sync agent.</p>
      </div>
    );
  }

  const grouped = documents.reduce<Record<string, DealDocument[]>>((acc, doc) => {
    const type = doc.doc_type || 'other';
    (acc[type] = acc[type] || []).push(doc);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([type, docs]) => (
        <div key={type}>
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <span>{DOC_ICONS[type as DocType] || '📄'}</span>
            {type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())} ({docs.length})
          </h3>
          <div className="space-y-3">
            {docs.map((doc) => (
              <div key={doc.id} className="rounded-xl border border-border bg-card p-4 space-y-2 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{DOC_ICONS[doc.doc_type] || '📄'}</span>
                    <p className="text-sm font-semibold text-foreground">{doc.title}</p>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {new Date(doc.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-medium rounded-full px-2 py-0.5 ${SOURCE_COLORS[doc.source] || SOURCE_COLORS.manual}`}>
                    {doc.source}
                  </span>
                  <span className={`inline-flex items-center gap-1 text-[10px] font-medium rounded-full px-2 py-0.5 ${doc.processed ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' : 'bg-muted text-muted-foreground'}`}>
                    {doc.processed ? <><CheckCircle2 className="h-3 w-3" /> Processed</> : <><Clock className="h-3 w-3" /> Pending</>}
                  </span>
                </div>

                {doc.content_summary && <p className="text-xs text-muted-foreground">{doc.content_summary}</p>}

                {doc.key_points && doc.key_points.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Key Points:</p>
                    <ul className="space-y-0.5">
                      {doc.key_points.slice(0, 5).map((p, i) => (
                        <li key={i} className="text-xs text-foreground/80 flex items-start gap-1.5">
                          <span className="text-primary mt-0.5">•</span> {p}
                        </li>
                      ))}
                      {doc.key_points.length > 5 && (
                        <li className="text-xs text-muted-foreground">...and {doc.key_points.length - 5} more</li>
                      )}
                    </ul>
                  </div>
                )}

                {doc.stakeholders_mentioned && doc.stakeholders_mentioned.length > 0 && (
                  <p className="text-xs text-muted-foreground">Stakeholders: {doc.stakeholders_mentioned.join(', ')}</p>
                )}

                {doc.action_items && doc.action_items.length > 0 && (
                  <div className="bg-amber-500/10 rounded-lg p-2.5">
                    <p className="text-xs font-medium text-amber-800 dark:text-amber-300 mb-1">Action Items:</p>
                    {doc.action_items.map((a, i) => (
                      <div key={i} className="flex items-start gap-1.5 text-xs text-amber-800 dark:text-amber-300">
                        <div className="h-3.5 w-3.5 rounded border border-amber-400 shrink-0 mt-0.5" />
                        {a}
                      </div>
                    ))}
                  </div>
                )}

                {doc.external_url && (
                  <a href={doc.external_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                    Open <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
