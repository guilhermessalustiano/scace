import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import {
  Truck,
  MapPin,
  Fuel,
  Gauge,
  Wallet,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

// --- Helpers de data/mês, fora do componente (módulo) ---

const NOMES_MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

function formatarReferencia(ano, mes) {
  // mes é 1-indexed aqui
  return `${ano}-${String(mes).padStart(2, '0')}`;
}

function formatarMoeda(valor) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor || 0);
}

function formatarDataExtenso(data) {
  const dia = String(data.getDate()).padStart(2, '0');
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const ano = data.getFullYear();
  return `${dia}/${mes}/${ano}`;
}

// --- Subcomponentes em escopo de módulo (evita remount em cada render) ---

function CardMetrica({ icone: Icone, label, valor, corIcone }) {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 flex items-start gap-4 shadow-sm">
      <div className={`p-3 rounded-lg ${corIcone}`}>
        <Icone size={22} className="text-white" />
      </div>
      <div className="flex flex-col">
        <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
        <span className="text-2xl font-semibold text-gray-800 dark:text-gray-100">
          {valor}
        </span>
      </div>
    </div>
  );
}

function SecaoTitulo({ children }) {
  return (
    <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
      {children}
    </h2>
  );
}

function RankingAgencias({ ranking }) {
  if (!ranking || ranking.length === 0) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Nenhuma rota registrada neste mês.
      </p>
    );
  }

  const maiorQuantidade = ranking[0].quantidade;

  return (
    <ul className="flex flex-col gap-3">
      {ranking.map((item, index) => (
        <li key={item.nome} className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400 w-6">
            {index + 1}º
          </span>
          <div className="flex-1">
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                {item.nome}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {item.quantidade}
              </span>
            </div>
            <div className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full"
                style={{ width: `${(item.quantidade / maiorQuantidade) * 100}%` }}
              />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

function SeletorMes({ ano, mes, onAlterar }) {
  const irParaMesAnterior = () => {
    if (mes === 1) {
      onAlterar(ano - 1, 12);
    } else {
      onAlterar(ano, mes - 1);
    }
  };

  const irParaProximoMes = () => {
    if (mes === 12) {
      onAlterar(ano + 1, 1);
    } else {
      onAlterar(ano, mes + 1);
    }
  };

  return (
    <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5">
      <button
        onClick={irParaMesAnterior}
        className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        aria-label="Mês anterior"
      >
        <ChevronLeft size={18} className="text-gray-600 dark:text-gray-300" />
      </button>
      <span className="text-sm font-medium text-gray-700 dark:text-gray-200 min-w-[120px] text-center">
        {NOMES_MESES[mes - 1]} {ano}
      </span>
      <button
        onClick={irParaProximoMes}
        className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        aria-label="Próximo mês"
      >
        <ChevronRight size={18} className="text-gray-600 dark:text-gray-300" />
      </button>
    </div>
  );
}

// --- Componente principal ---

export default function Dashboard() {
  const hoje = new Date();
  const [ano, setAno] = useState(hoje.getFullYear());
  const [mes, setMes] = useState(hoje.getMonth() + 1);
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  const nomeUsuario = (() => {
    try {
      const usuario = JSON.parse(localStorage.getItem('usuario'));
      return usuario?.nome || 'Usuário';
    } catch {
      return 'Usuário';
    }
  })();

  const buscarDados = useCallback(async (anoConsulta, mesConsulta) => {
    setCarregando(true);
    setErro(null);
    try {
      const referencia = formatarReferencia(anoConsulta, mesConsulta);
      const resposta = await api.get('/dashboard', {
        params: { mes: referencia },
      });
      setDados(resposta.data);
    } catch (err) {
      console.error('Erro ao buscar dashboard:', err);
      setErro('Não foi possível carregar os dados do dashboard.');
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    buscarDados(ano, mes);
  }, [ano, mes, buscarDados]);

  const alterarMes = (novoAno, novoMes) => {
    setAno(novoAno);
    setMes(novoMes);
  };

  return (
    <div className="flex flex-col gap-8 p-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            Olá, {nomeUsuario}
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Hoje é dia {formatarDataExtenso(hoje)}
          </p>
        </div>
        <SeletorMes ano={ano} mes={mes} onAlterar={alterarMes} />
      </div>

      {erro && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg p-4 text-sm">
          {erro}
        </div>
      )}

      {carregando ? (
        <div className="flex items-center justify-center py-20">
          <span className="text-gray-500 dark:text-gray-400">Carregando dados...</span>
        </div>
      ) : dados ? (
        <>
          {/* Seção Entregas */}
          <section>
            <SecaoTitulo>Entregas</SecaoTitulo>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <CardMetrica
                icone={Truck}
                label="Entregas feitas neste mês"
                valor={dados.entregas.realizadas}
                corIcone="bg-blue-500"
              />
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin size={18} className="text-gray-500 dark:text-gray-400" />
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    Agências com mais rotas realizadas
                  </span>
                </div>
                <RankingAgencias ranking={dados.entregas.rankingAgencias} />
              </div>
            </div>
          </section>

          {/* Seção Combustível */}
          <section>
            <SecaoTitulo>Combustível</SecaoTitulo>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <CardMetrica
                icone={Gauge}
                label="Total de KM percorridos"
                valor={`${dados.combustivel.totalKm.toLocaleString('pt-BR')} km`}
                corIcone="bg-amber-500"
              />
              <CardMetrica
                icone={TrendingUp}
                label="Média de consumo"
                valor={`${dados.combustivel.mediaConsumoKml.toLocaleString('pt-BR')} km/l`}
                corIcone="bg-emerald-500"
              />
              <CardMetrica
                icone={Fuel}
                label="Gasto com combustível"
                valor={formatarMoeda(dados.combustivel.gastoTotal)}
                corIcone="bg-orange-500"
              />
            </div>
          </section>

          {/* Seção Financeiro */}
          <section>
            <SecaoTitulo>Finanças</SecaoTitulo>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CardMetrica
                icone={Wallet}
                label="Faturamento bruto no mês"
                valor={formatarMoeda(dados.financeiro.faturamentoBruto)}
                corIcone="bg-indigo-500"
              />
              <CardMetrica
                icone={Wallet}
                label="Faturamento líquido no mês"
                valor={formatarMoeda(dados.financeiro.faturamentoLiquido)}
                corIcone="bg-teal-500"
              />
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}