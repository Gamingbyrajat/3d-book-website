import type { Page } from '../../content/pages';

interface PageContentProps {
  page?: Page;
  side: 'left' | 'right';
}

export function PageContent({ page, side }: PageContentProps) {
  if (!page) return null;

  const isCover = page.isCover;

  return (
    <div
      className={`page-content ${side} ${isCover ? 'cover' : ''}`}
      style={{
        color: isCover ? '#e8dcc5' : '#333',
      }}
    >
      {page.title && <h2 className="page-title">{page.title}</h2>}
      {page.body && <p className="page-body">{page.body}</p>}
    </div>
  );
}
