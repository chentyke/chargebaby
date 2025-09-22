import { ICPBeian } from './icp-beian';

export function Footer() {
  return (
    <footer className="py-3 mt-auto bg-white border-t border-gray-100">
      <div className="container mx-auto px-4 text-center">
        <ICPBeian variant="footer" />
      </div>
    </footer>
  );
}