import { useState } from 'react';
import api from '../services/api';

function Login({ onLogin }) {
    const [username, setUsername] = useState('');
    const [senha, setSenha] = useState('');
    const [erro, setErro] = useState('');
    const [carregando, setCarregando] = useState(false);

    async function handleLogin() {
        setErro('');

        if (!username.trim() || !senha.trim()) {
            setErro('Preencha o usuário e senha');
            return;
        }

        setCarregando(true);
        try {
            const { data } = await api.post('/login', { username, senha });
            localStorage.setItem('token', data.token);
            onLogin(data.usuario);
        } catch (err) {
            const mensagem = err.response?.data?.erro || 'Erro ao conectar com o servidor.';
            setErro(mensagem);
        } finally {
            setCarregando(false);
        }
    }

    function handleKeyDown(e) {
        if (e.key === 'Enter') handleLogin();
    }

    return (
        <div className="flex h-screen w-screen">
        {/* Painel esquerdo amarelo */}
        <div className="hidden md:flex w-1/2 bg-yellow-300 flex-col justify-center items-center p-12">
            <h1 className="text-6xl font-black tracking-tight text-black mb-4">SCACE</h1>
            <p className="text-black/50 text-lg font-medium">Sistema de Cálculo de Custo de Entregas</p>
        </div>

        {/* Painel direito — formulário */}
        <div className="flex flex-1 flex-col justify-center items-center bg-gray-100 p-8">
            <div className="w-full max-w-sm">
            {/* Título visível só no mobile */}
            <h1 className="text-3xl font-black mb-1 text-black md:hidden">SCACE</h1>

            <h2 className="text-2xl font-bold text-gray-800 mb-1">Entrar</h2>
            <p className="text-gray-500 text-sm mb-8">Insira suas credenciais para continuar.</p>

            <div className="flex flex-col gap-4">
                <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Usuário
                </label>
                <input
                    type="text"
                    placeholder="seu.usuario"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-white"
                />
                </div>

                <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Senha
                </label>
                <input
                    type="password"
                    placeholder="••••••••"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-white"
                />
                </div>

                {/* Mensagem de erro */}
                {erro && (
                <p className="text-red-600 text-sm font-medium -mt-1">{erro}</p>
                )}

                <button
                onClick={handleLogin}
                disabled={carregando}
                className="mt-2 w-full bg-yellow-300 hover:bg-yellow-400 disabled:opacity-60 disabled:cursor-not-allowed text-black font-bold py-2.5 rounded-lg transition-colors"
                >
                {carregando ? 'Entrando...' : 'Entrar'}
                </button>
            </div>
            </div>
        </div>
        </div>
    );
}

export default Login;
