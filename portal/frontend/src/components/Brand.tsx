import { Link } from 'react-router-dom';

export function Brand({ admin = false }: { admin?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-3">
      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary font-extrabold text-primary-foreground">
        N
      </span>
      <span className="text-xl font-bold tracking-wider text-foreground">
        NEU<span className="text-primary">BAT</span>
        {admin && <span className="ml-2 text-sm font-medium text-muted-foreground">· Admin</span>}
      </span>
    </Link>
  );
}
