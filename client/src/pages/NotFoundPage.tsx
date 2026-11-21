import { Compass } from 'lucide-react';
import { Link } from 'react-router-dom';
import { EmptyState } from '../components/States';

export function NotFoundPage() {
  return (
    <EmptyState
      icon={Compass}
      title="Az oldal nem található"
      description="A keresett oldal nem létezik, vagy áthelyezték."
      action={<Link to="/" className="btn-primary">Vissza a főoldalra</Link>}
    />
  );
}
