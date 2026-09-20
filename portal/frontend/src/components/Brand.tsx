import { Link } from 'react-router-dom';

export function Brand({ admin = false }: { admin?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-violet-500 font-extrabold text-slate-950 shadow-lg shadow-cyan-500/20">
        N
      </div>
      <h1 className="text-xl font-bold tracking-wider text-foreground">
        NEU<span className="text-cyan-400">BAT</span>
        {admin && <span className="ml-2 text-sm font-medium text-muted-foreground">· Admin</span>}
      </h1>
    </Link>
  );
}
