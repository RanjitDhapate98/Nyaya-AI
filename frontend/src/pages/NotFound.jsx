import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { EmptyState } from '../components/common/Feedback';

export default function NotFound() {
  return (
    <div className="card mt-10">
      <EmptyState icon={Compass} title="Page not found" message="The page you are looking for does not exist or has moved."
        action={<Link to="/dashboard" className="btn-primary">Back to dashboard</Link>} />
    </div>
  );
}
