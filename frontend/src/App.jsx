import { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Usuarios from './pages/Usuarios';
import Login from './pages/Login';
import Agencias from './pages/Agencias';
import Veiculos from './pages/Veiculos';
import Rotas from './pages/Rotas';
import Custos from './pages/Custos';

function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [autenticado, setAutenticado] = useState(false);
  const [carregando, setCarregando] = useState(true);

  // Verifica token ao carregar (F5 / reload)
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        const agora = Date.now() / 1000;
        if (decoded.exp > agora) {
          setAutenticado(true); // token ainda válido
        } else {
          localStorage.removeItem('token');
          localStorage.removeItem('usuario'); // expirado
        }
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('usuario'); // token corrompido
      }
    }
    setCarregando(false);
  }, []);

  function handleLogin(usuario) {
    setAutenticado(true);
  }

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    setAutenticado(false);
  }

  // Evita flash de tela de login enquanto verifica o token
  if (carregando) return null;

  // Não autenticado: mostra apenas o Login
  if (!autenticado) {
    return <Login onLogin={handleLogin} />;
  }

  // Autenticado: mostra o app completo
  return (
    <BrowserRouter>
      <div className={darkMode ? 'dark' : ''}>
        <div className="flex h-screen bg-slate-100 dark:bg-slate-950 transition-colors duration-300">
          <Sidebar
            onLogout={handleLogout}
            darkMode={darkMode}
            onToggleDarkMode={() => setDarkMode(d => !d)}
          />
          <main className="flex-1 p-6 overflow-auto">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/rotas" element={<Rotas />} />
              <Route path="/custos" element={<Custos />} />
              <Route path="/agencias" element={<Agencias />} />
              <Route path="/veiculos" element={<Veiculos />} />
              <Route path="/usuarios" element={<Usuarios />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
