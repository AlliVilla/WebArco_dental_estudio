import { Bell, ChevronRight, Search } from 'lucide-react';

interface TopBarProps {
  title: string;
  breadcrumbs: string[];
  notificationCount?: number;
  sidebarWidth?: number;
}

export function TopBar({ title, breadcrumbs, notificationCount = 0, sidebarWidth = 240 }: TopBarProps) {
  return (
    <header style={{
      height: 60, background: '#FFFFFF',
      borderBottom: '0.5px solid #D3D7DA',
      display: 'flex', alignItems: 'center',
      padding: '0 24px', gap: 16,
      position: 'fixed', top: 0, left: sidebarWidth,
      right: 0, zIndex: 40,
      transition: 'left 0.22s cubic-bezier(0.4,0,0.2,1)',
    }}>
      {/* Title + Breadcrumb */}
      <div style={{ flex: 1 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: '#203F49', margin: 0, lineHeight: 1 }}>{title}</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
          {breadcrumbs.map((crumb, i) => (
            <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {i > 0 && <ChevronRight size={11} style={{ color: '#888F94' }} />}
              <span style={{
                fontSize: 11, color: i === breadcrumbs.length - 1 ? '#888F94' : '#0BC5DF',
                cursor: i < breadcrumbs.length - 1 ? 'pointer' : 'default',
              }}>{crumb}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Search */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: '#F8F9FA', border: '0.5px solid #D3D7DA',
        borderRadius: 8, padding: '6px 12px', width: 220,
      }}>
        <Search size={14} style={{ color: '#888F94' }} />
        <input
          placeholder="Buscar..."
          style={{
            border: 'none', background: 'transparent', outline: 'none',
            fontSize: 13, color: '#203F49', width: '100%',
          }}
        />
      </div>

      {/* Notifications */}
      <button style={{
        position: 'relative', background: 'none', border: 'none',
        cursor: 'pointer', padding: 8, borderRadius: 8,
        color: '#5F656A',
      }}>
        <Bell size={18} />
        {notificationCount > 0 && (
          <span style={{
            position: 'absolute', top: 4, right: 4,
            width: 8, height: 8, borderRadius: '50%',
            background: '#E24B4A', border: '1.5px solid #fff',
          }} />
        )}
      </button>

      {/* User quick menu */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: '#0BC5DF',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, fontWeight: 600, color: '#fff',
        }}>KA</div>
      </div>
    </header>
  );
}
