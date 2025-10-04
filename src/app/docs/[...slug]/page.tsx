import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getDocByPath, getDocs, getDocBreadcrumb, getAdjacentDocs } from '@/lib/notion';
import { DocPageClient } from '@/components/doc-page-client';
import { Suspense } from 'react';
import "../doc-styles.css";

interface DocsPageProps {
  params: Promise<{
    slug: string[];
  }>;
}

export async function generateMetadata({ params }: DocsPageProps): Promise<Metadata> {
  const { slug } = await params;
  const path = slug.length > 0 ? `/${slug.join('/')}` : '/';

  const doc = await getDocByPath(path);
  if (!doc) {
    return {
      title: '文档未找到 | ChargeBaby',
    };
  }

  return {
    title: `${doc.title} | ChargeBaby 文档`,
    description: doc.description,
  };
}

async function DocContent({ slug }: { slug: string[] }) {
  const path = slug.length > 0 ? `/${slug.join('/')}` : '/';

  const [doc, docs, breadcrumb, adjacent] = await Promise.all([
    getDocByPath(path),
    getDocs(),
    getDocBreadcrumb(path),
    getAdjacentDocs(path)
  ]);

  if (!doc) {
    notFound();
  }

  return (
    <DocPageClient
      doc={doc}
      docs={docs}
      breadcrumb={breadcrumb}
      adjacent={adjacent}
      path={path}
    />
  );
}

export default async function DocsPage({ params }: DocsPageProps) {
  const { slug } = await params;

  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      }
    >
      <DocContent slug={slug} />
    </Suspense>
  );
}
