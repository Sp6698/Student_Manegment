import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import {
  AppBar, Toolbar, IconButton, Avatar, Menu, MenuItem,
  Drawer, List, ListItemButton, ListItemIcon, ListItemText,
  Divider, Tooltip, Chip,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import HomeIcon from '@mui/icons-material/Home';
import GroupIcon from '@mui/icons-material/Group';
import CastForEducationIcon from '@mui/icons-material/CastForEducation';
import BarChartIcon from '@mui/icons-material/BarChart';
import SchoolIcon from '@mui/icons-material/School';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import PersonIcon from '@mui/icons-material/Person';
import LogoutIcon from '@mui/icons-material/Logout';
import CloseIcon from '@mui/icons-material/Close';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { useAuth } from '../context/AuthContext';

const ROLE_CONFIG = {
  SUPER_ADMIN: { label: 'IT Admin',   color: '#7c3aed', bg: '#f3e8ff', icon: <AdminPanelSettingsIcon sx={{ fontSize: 14 }} /> },
  ADMIN:       { label: 'Principal',  color: '#059669', bg: '#d1fae5', icon: <SchoolIcon sx={{ fontSize: 14 }} /> },
  TEACHER:     { label: 'Teacher',    color: '#2563eb', bg: '#dbeafe', icon: <CastForEducationIcon sx={{ fontSize: 14 }} /> },
  STUDENT:     { label: 'Student',    color: '#d97706', bg: '#fef3c7', icon: <SchoolIcon sx={{ fontSize: 14 }} /> },
};

const NAV_ITEMS = {
  SUPER_ADMIN: [
    { label: 'Dashboard', path: '/super-admin', icon: <HomeIcon fontSize="small" /> },
  ],
  ADMIN: [
    { label: 'Dashboard', path: '/admin',       icon: <HomeIcon fontSize="small" /> },
    { label: 'Users',     path: '/admin/users', icon: <GroupIcon fontSize="small" /> },
  ],
  TEACHER: [
    { label: 'Dashboard',   path: '/teacher',          icon: <HomeIcon fontSize="small" /> },
    { label: 'My Students', path: '/teacher/students', icon: <GroupIcon fontSize="small" /> },
    { label: 'Marks',       path: '/teacher/marks',    icon: <BarChartIcon fontSize="small" /> },
  ],
  STUDENT: [
    { label: 'Dashboard', path: '/dashboard',       icon: <HomeIcon fontSize="small" /> },
    { label: 'My Marks',  path: '/dashboard/marks', icon: <BarChartIcon fontSize="small" /> },
  ],
};

export default function Navbar() {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  const navItems = NAV_ITEMS[user?.role] || [];
  const roleConfig = ROLE_CONFIG[user?.role] || {};
  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const isActive = (path) => {
    const exact = ['/teacher', '/admin', '/super-admin', '/dashboard'];
    return exact.includes(path) ? location.pathname === path : location.pathname.startsWith(path);
  };

  const handleLogout = async () => {
    setAnchorEl(null);
    const result = await Swal.fire({
      title: 'Logging out?',
      text: 'You will be returned to the login screen.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, logout',
      cancelButtonText: 'Stay',
      confirmButtonColor: '#4f46e5',
    });
    if (result.isConfirmed) { logoutUser(); navigate('/login'); }
  };

  return (
    <>
      <AppBar position="fixed" elevation={0} sx={{
        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)',
        borderBottom: 'none',
        zIndex: 1300,
      }}>
        <Toolbar sx={{ minHeight: '64px !important', px: { xs: 2, md: 3 } }}>
          {/* Hamburger — mobile */}
          <IconButton edge="start" onClick={() => setDrawerOpen(true)}
            sx={{ color: 'rgba(255,255,255,0.8)', mr: 1, display: { md: 'none' } }}>
            <MenuIcon />
          </IconButton>

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 no-underline mr-8 flex-shrink-0">
            <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center">
              <SchoolIcon sx={{ color: '#fff', fontSize: 18 }} />
            </div>
            <div className="hidden sm:block">
              <span className="font-bold text-white text-base tracking-tight">EduManage</span>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1 flex-1">
            {navItems.map((item) => {
              const active = isActive(item.path);
              return (
                <Link key={item.path} to={item.path}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium no-underline transition-all
                    ${active
                      ? 'bg-white/20 text-white shadow-sm'
                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                    }`}>
                  <span className={active ? 'text-white' : 'text-white/60'}>{item.icon}</span>
                  {item.label}
                  {active && <span className="w-1 h-1 rounded-full bg-white ml-0.5" />}
                </Link>
              );
            })}
          </nav>

          {/* Right side */}
          <div className="ml-auto flex items-center gap-2">
            {/* Role badge */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur">
              <span style={{ color: '#a5b4fc' }}>{roleConfig.icon}</span>
              <span className="text-xs font-semibold text-white/90">{roleConfig.label}</span>
            </div>

            {/* Avatar button */}
            <Tooltip title={user?.name || ''}>
              <button
                onClick={(e) => setAnchorEl(e.currentTarget)}
                className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full bg-white/10 hover:bg-white/20 transition-all"
              >
                <Avatar sx={{ width: 32, height: 32, bgcolor: 'rgba(255,255,255,0.25)', fontSize: 13, fontWeight: 700, color: '#fff' }}>
                  {initials}
                </Avatar>
                <span className="text-white/80 text-xs font-medium hidden sm:block max-w-[80px] truncate">
                  {user?.name?.split(' ')[0]}
                </span>
                <KeyboardArrowDownIcon sx={{ color: 'rgba(255,255,255,0.6)', fontSize: 16 }} />
              </button>
            </Tooltip>
          </div>
        </Toolbar>
      </AppBar>

      {/* Profile dropdown */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{ elevation: 8, sx: { mt: 1.5, minWidth: 220, borderRadius: 3, overflow: 'hidden' } }}>
        {/* User info header */}
        <div className="px-4 py-3 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <Avatar sx={{ width: 40, height: 40, bgcolor: '#4f46e5', fontSize: 15, fontWeight: 700 }}>{initials}</Avatar>
            <div>
              <p className="text-sm font-bold text-slate-800 m-0 leading-tight">{user?.name}</p>
              <p className="text-xs text-slate-500 m-0">{user?.email}</p>
              <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-xs font-semibold"
                style={{ background: roleConfig.bg, color: roleConfig.color }}>
                {roleConfig.icon} {roleConfig.label}
              </span>
            </div>
          </div>
        </div>
        <MenuItem onClick={() => { setAnchorEl(null); }} sx={{ py: 1.5, gap: 1.5, fontSize: 14 }}>
          <PersonIcon fontSize="small" sx={{ color: '#64748b' }} /> My Profile
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout} sx={{ py: 1.5, gap: 1.5, fontSize: 14, color: '#ef4444' }}>
          <LogoutIcon fontSize="small" /> Logout
        </MenuItem>
      </Menu>

      {/* Mobile Drawer */}
      <Drawer anchor="left" open={drawerOpen} onClose={() => setDrawerOpen(false)}
        PaperProps={{ sx: { width: 280, background: 'linear-gradient(180deg, #1e1b4b 0%, #312e81 100%)' } }}>
        {/* Drawer header */}
        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
              <SchoolIcon sx={{ color: '#fff', fontSize: 18 }} />
            </div>
            <span className="font-bold text-white text-base">EduManage</span>
          </div>
          <IconButton size="small" onClick={() => setDrawerOpen(false)} sx={{ color: 'rgba(255,255,255,0.6)' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </div>

        {/* User info */}
        <div className="mx-4 mb-4 p-3 rounded-xl bg-white/10 backdrop-blur">
          <div className="flex items-center gap-3">
            <Avatar sx={{ width: 42, height: 42, bgcolor: 'rgba(255,255,255,0.2)', fontSize: 15, fontWeight: 700, color: '#fff' }}>
              {initials}
            </Avatar>
            <div>
              <p className="text-sm font-bold text-white m-0">{user?.name}</p>
              <span className="text-xs text-indigo-300">{roleConfig.label}</span>
            </div>
          </div>
        </div>

        {/* Nav items */}
        <List sx={{ px: 1.5, flex: 1 }}>
          {navItems.map((item) => {
            const active = isActive(item.path);
            return (
              <ListItemButton key={item.path} selected={active}
                onClick={() => { navigate(item.path); setDrawerOpen(false); }}
                sx={{
                  borderRadius: 2, mb: 0.5, py: 1.5,
                  color: active ? '#fff' : 'rgba(255,255,255,0.65)',
                  '&.Mui-selected': { bgcolor: 'rgba(255,255,255,0.15)', color: '#fff' },
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.1)', color: '#fff' },
                }}>
                <ListItemIcon sx={{ minWidth: 36, color: 'inherit' }}>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: 14, fontWeight: active ? 600 : 400 }} />
                {active && <span className="w-2 h-2 rounded-full bg-indigo-300" />}
              </ListItemButton>
            );
          })}
        </List>

        <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', mx: 2 }} />
        <List sx={{ px: 1.5, pb: 2 }}>
          <ListItemButton onClick={handleLogout}
            sx={{ borderRadius: 2, color: '#fca5a5', '&:hover': { bgcolor: 'rgba(239,68,68,0.15)' } }}>
            <ListItemIcon sx={{ minWidth: 36, color: '#fca5a5' }}><LogoutIcon fontSize="small" /></ListItemIcon>
            <ListItemText primary="Logout" primaryTypographyProps={{ fontSize: 14, fontWeight: 500 }} />
          </ListItemButton>
        </List>
      </Drawer>
    </>
  );
}
