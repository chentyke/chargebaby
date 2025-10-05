import { ICPBeian } from './icp-beian';

export function Footer() {
  return (
    <footer className="py-3 mt-auto bg-white dark:bg-slate-950 border-t border-gray-100 dark:border-slate-800 transition-colors">
      <div className="container mx-auto px-4 text-center">
        <ICPBeian variant="footer" />
      </div>
    </footer>
  );
}