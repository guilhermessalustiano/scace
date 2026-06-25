import { useEffect, useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
} from '@tanstack/react-table';
import api from '../services/api';

const EMPTY_FORM = {
  fk_usuario: '', fk_agencia: '', veiculo_placa: '',
  dia: '', hora_marcada: '', hora_inicio: '', hora_fim: '',
  distancia_km: '', consumo_kml: '', valor: '',
};

function FormRota({ form, setForm, usuarios, agencias, veiculos }) {
  const inputCls = "w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-yellow-300 focus:border-yellow-300 dark:focus:ring-yellow-300 dark:focus:border-yellow-300 transition";
  const labelCls = "block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1";
  const sectionLabelCls = "text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 border-t border-gray-100 dark:border-gray-700 pt-3 mt-1";

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Usuário</label>
          <select className={inputCls} value={form.fk_usuario} onChange={e => setForm(f => ({ ...f, fk_usuario: e.target.value }))}>
            <option value="">Selecione</option>
            {usuarios.map(u => <option key={u.id} value={u.id}>{u.nome}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Agência</label>
          <select className={inputCls} value={form.fk_agencia} onChange={e => setForm(f => ({ ...f, fk_agencia: e.target.value }))}>
            <option value="">Selecione</option>
            {agencias.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className={labelCls}>Veículo</label>
        <select className={inputCls} value={form.veiculo_placa} onChange={e => setForm(f => ({ ...f, veiculo_placa: e.target.value }))}>
          <option value="">Selecione</option>
          {veiculos.map(v => <option key={v.placa} value={v.placa}>{v.placa} — {v.marca} {v.modelo}</option>)}
        </select>
      </div>
      <div>
        <label className={labelCls}>Valor (R$)</label>
        <input className={inputCls} type="number" step="1" min="0" value={form.valor} onChange={e => setForm(f => ({ ...f, valor: e.target.value }))} placeholder="0" />
      </div>

      <p className={sectionLabelCls}>Horários</p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Data</label>
          <input className={inputCls} type="date" value={form.dia} onChange={e => setForm(f => ({ ...f, dia: e.target.value }))} />
        </div>
        <div>
          <label className={labelCls}>Hora marcada</label>
          <input className={inputCls} type="time" value={form.hora_marcada} onChange={e => setForm(f => ({ ...f, hora_marcada: e.target.value }))} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Hora início</label>
          <input className={inputCls} type="time" value={form.hora_inicio} onChange={e => setForm(f => ({ ...f, hora_inicio: e.target.value }))} />
        </div>
        <div>
          <label className={labelCls}>Hora fim</label>
          <input className={inputCls} type="time" value={form.hora_fim} onChange={e => setForm(f => ({ ...f, hora_fim: e.target.value }))} />
        </div>
      </div>

      <p className={sectionLabelCls}>Métricas</p>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className={labelCls}>Distância (km)</label>
          <input className={inputCls} type="number" step="0.1" min="0" value={form.distancia_km} onChange={e => setForm(f => ({ ...f, distancia_km: e.target.value }))} placeholder="0.0" />
        </div>
        <div>
          <label className={labelCls}>Consumo (km/l)</label>
          <input className={inputCls} type="number" step="0.01" min="0" value={form.consumo_kml} onChange={e => setForm(f => ({ ...f, consumo_kml: e.target.value }))} placeholder="0.00" />
        </div>
      </div>
    </>
  );
}

export default function Rotas() {
  const [rotas, setRotas] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [agencias, setAgencias] = useState([]);
  const [veiculos, setVeiculos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [globalFilter, setGlobalFilter] = useState('');
  const [sorting, setSorting] = useState([{ id: 'id', desc: true }]);
  const [modal, setModal] = useState(null);
  const [selecionado, setSelecionado] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  const carregar = () => {
    setLoading(true);
    Promise.all([
      api.get('/rotas'),
      api.get('/usuarios'),
      api.get('/agencias'),
      api.get('/veiculos'),
    ]).then(([r, u, a, v]) => {
      setRotas(r.data);
      setUsuarios(u.data);
      setAgencias(a.data);
      setVeiculos(v.data);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { carregar(); }, []);

  const abrirCriar = () => { setForm(EMPTY_FORM); setErro(''); setModal('criar'); };

  const abrirEditar = (r) => {
    setSelecionado(r);
    setForm({
      fk_usuario: String(r.fk_usuario),
      fk_agencia: String(r.fk_agencia),
      veiculo_placa: r.veiculo_placa,
      dia: r.dia ? r.dia.slice(0, 10) : '',
      hora_marcada: r.hora_marcada ?? '',
      hora_inicio: r.hora_inicio ?? '',
      hora_fim: r.hora_fim ?? '',
      distancia_km: String(r.distancia_km ?? ''),
      consumo_kml: String(r.consumo_kml ?? ''),
      valor: String(r.valor ?? ''),
    });
    setErro(''); setModal('editar');
  };

  const abrirExcluir = (r) => { setSelecionado(r); setErro(''); setModal('excluir'); };
  const fecharModal = () => { setModal(null); setSelecionado(null); setErro(''); };

  const montarPayload = () => ({
    fk_usuario: Number(form.fk_usuario),
    fk_agencia: Number(form.fk_agencia),
    veiculo_placa: form.veiculo_placa,
    dia: form.dia,
    hora_marcada: form.hora_marcada,
    hora_inicio: form.hora_inicio,
    hora_fim: form.hora_fim,
    distancia_km: parseFloat(form.distancia_km),
    consumo_kml: parseFloat(form.consumo_kml),
    valor: parseFloat(form.valor),
  });

  const validar = () => {
    if (!form.fk_usuario || !form.fk_agencia || !form.veiculo_placa || !form.dia) {
      setErro('Usuário, agência, veículo e data são obrigatórios.'); return false;
    }
    return true;
  };

  const salvarCriar = async () => {
    if (!validar()) return;
    setSalvando(true);
    try {
      await api.post('/rotas', montarPayload());
      fecharModal(); carregar();
    } catch (e) { setErro(e.response?.data?.message ?? 'Erro ao criar rota.'); }
    finally { setSalvando(false); }
  };

  const salvarEditar = async () => {
    if (!validar()) return;
    setSalvando(true);
    try {
      await api.put(`/rotas/${selecionado.id}`, montarPayload());
      fecharModal(); carregar();
    } catch (e) { setErro(e.response?.data?.message ?? 'Erro ao salvar alterações.'); }
    finally { setSalvando(false); }
  };

  const confirmarExcluir = async () => {
    setSalvando(true);
    try {
      await api.delete(`/rotas/${selecionado.id}`);
      fecharModal(); carregar();
    } catch (e) { setErro(e.response?.data?.message ?? 'Erro ao excluir rota.'); }
    finally { setSalvando(false); }
  };

  const nomeUsuario = (id) => usuarios.find(u => u.id === id)?.nome ?? `#${id}`;
  const nomeAgencia = (id) => agencias.find(a => a.id === id)?.nome ?? `#${id}`;
  const fmtData = (s) => s ? new Date(s).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '—';
  const fmtMoeda = (v) => v != null ? `R$ ${Number(v).toFixed(2).replace('.', ',')}` : '—';

  const columns = useMemo(() => [
    { accessorKey: 'id', header: 'ID', size: 60 },
    { id: 'usuario', header: 'Usuário', accessorFn: row => nomeUsuario(row.fk_usuario) },
    { id: 'agencia', header: 'Agência', accessorFn: row => nomeAgencia(row.fk_agencia) },
    { accessorKey: 'veiculo_placa', header: 'Veículo', size: 110 },
    { accessorKey: 'dia', header: 'Data', size: 110, cell: ({ getValue }) => fmtData(getValue()) },
    { accessorKey: 'hora_marcada', header: 'Hora marcada', size: 120 },
    { accessorKey: 'distancia_km', header: 'Distância', size: 100, cell: ({ getValue }) => getValue() != null ? `${getValue()} km` : '—' },
    { accessorKey: 'valor', header: 'Valor', size: 110, cell: ({ getValue }) => fmtMoeda(getValue()) },
    {
      id: 'acoes', header: '', enableSorting: false, size: 100,
      cell: ({ row }) => (
        <div className="flex gap-1.5 justify-end">
          <button
            title="Editar"
            onClick={() => abrirEditar(row.original)}
            className="inline-flex items-center justify-center w-8 h-8 border border-gray-200 dark:border-gray-600 rounded-lg bg-transparent text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100 hover:border-gray-300 dark:hover:border-gray-500 transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button
            title="Excluir"
            onClick={() => abrirExcluir(row.original)}
            className="inline-flex items-center justify-center w-8 h-8 border border-gray-200 dark:border-gray-600 rounded-lg bg-transparent text-gray-500 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-700 transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
          </button>
        </div>
      ),
    },
  ], [usuarios, agencias]);

  const table = useReactTable({
    data: rotas, columns,
    state: { globalFilter, sorting },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  // ── Componentes de UI reutilizáveis ──────────────────────────────────────

  const BtnIconPage = ({ onClick, disabled, children }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className="px-2.5 py-1 text-sm border border-gray-200 dark:border-gray-600 rounded-md bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
    >
      {children}
    </button>
  );

  // ── Modais ───────────────────────────────────────────────────────────────

  const Modal = ({ children, onClose }) => (
    <div
      className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-8 overflow-y-auto"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-lg shadow-2xl border border-gray-200 dark:border-gray-700">
        {children}
      </div>
    </div>
  );

  const ModalHeader = ({ title, danger, onClose }) => (
    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
      <h3 className={`text-base font-semibold ${danger ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-gray-100'}`}>
        {title}
      </h3>
      <button
        onClick={onClose}
        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl leading-none transition"
      >
        ×
      </button>
    </div>
  );

  const ModalFooter = ({ children }) => (
    <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-200 dark:border-gray-700">
      {children}
    </div>
  );

  const BtnCancelar = ({ onClick }) => (
    <button
      onClick={onClick}
      className="px-4 py-2 text-sm font-medium border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
    >
      Cancelar
    </button>
  );

  const BtnSalvar = ({ onClick, disabled, children }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className="px-4 py-2 text-sm font-medium rounded-lg bg-yellow-300 hover:bg-yellow-400 text-gray-900 disabled:opacity-60 disabled:cursor-not-allowed transition"
    >
      {children}
    </button>
  );

  const BtnExcluir = ({ onClick, disabled, children }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className="px-4 py-2 text-sm font-medium rounded-lg bg-red-600 hover:bg-red-700 text-white disabled:opacity-60 disabled:cursor-not-allowed transition"
    >
      {children}
    </button>
  );

  const ErroBanner = ({ msg }) => (
    <div className="text-sm text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
      {msg}
    </div>
  );

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6 p-6">

      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Rotas</h1>
        <div className="flex items-center gap-2">
          {/* Busca */}
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input
              className="pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:ring-2 focus:ring-yellow-300 focus:border-yellow-300 dark:focus:ring-yellow-300 dark:focus:border-yellow-300 w-52 transition"
              placeholder="Buscar rotas..."
              value={globalFilter}
              onChange={e => setGlobalFilter(e.target.value)}
            />
          </div>
          {/* Botão nova rota */}
          <button
            onClick={abrirCriar}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg bg-yellow-300 hover:bg-yellow-400 text-gray-900 transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nova rota
          </button>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <span className="text-sm text-gray-500 dark:text-gray-400">Carregando...</span>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  {table.getHeaderGroups().map(hg => (
                    <tr key={hg.id}>
                      {hg.headers.map(header => {
                        const sorted = header.column.getIsSorted();
                        return (
                          <th
                            key={header.id}
                            style={{ width: header.column.columnDef.size }}
                            onClick={header.column.getToggleSortingHandler()}
                            className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 whitespace-nowrap ${header.column.getCanSort() ? 'cursor-pointer select-none hover:text-gray-900 dark:hover:text-gray-100' : ''}`}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {header.column.getCanSort() && (
                              <span className={`ml-1 ${sorted ? 'text-yellow-400' : 'opacity-40'}`}>
                                {sorted === 'asc' ? '↑' : sorted === 'desc' ? '↓' : '↕'}
                              </span>
                            )}
                          </th>
                        );
                      })}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {table.getRowModel().rows.length === 0 ? (
                    <tr>
                      <td colSpan={columns.length} className="text-center py-12 text-sm text-gray-400 dark:text-gray-500">
                        Nenhuma rota encontrada.
                      </td>
                    </tr>
                  ) : (
                    table.getRowModel().rows.map(row => (
                      <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/40 transition">
                        {row.getVisibleCells().map(cell => (
                          <td key={cell.id} className="px-4 py-3 border-b border-gray-100 dark:border-gray-700/50 text-gray-800 dark:text-gray-200 align-middle last:border-b-0">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Paginação */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400 flex-wrap gap-3">
              <div className="flex items-center gap-1.5">
                Exibindo{' '}
                <select
                  value={table.getState().pagination.pageSize}
                  onChange={e => table.setPageSize(Number(e.target.value))}
                  className="border border-gray-200 dark:border-gray-600 rounded-md px-2 py-1 text-xs bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 outline-none focus:ring-2 focus:ring-yellow-300"
                >
                  {[10, 20, 50].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
                {' '}por página — {table.getFilteredRowModel().rows.length} resultado(s)
              </div>
              <div className="flex items-center gap-1">
                <BtnIconPage onClick={() => table.firstPage()} disabled={!table.getCanPreviousPage()}>«</BtnIconPage>
                <BtnIconPage onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>‹</BtnIconPage>
                {Array.from({ length: table.getPageCount() }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => table.setPageIndex(i)}
                    className={`px-2.5 py-1 text-sm rounded-md border transition ${
                      table.getState().pagination.pageIndex === i
                        ? 'bg-yellow-300 border-yellow-300 text-gray-900 font-medium'
                        : 'border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <BtnIconPage onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>›</BtnIconPage>
                <BtnIconPage onClick={() => table.lastPage()} disabled={!table.getCanNextPage()}>»</BtnIconPage>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modal Criar */}
      {modal === 'criar' && (
        <Modal onClose={fecharModal}>
          <ModalHeader title="Nova rota" onClose={fecharModal} />
          <div className="px-5 py-4 flex flex-col gap-3">
            {erro && <ErroBanner msg={erro} />}
            <FormRota form={form} setForm={setForm} usuarios={usuarios} agencias={agencias} veiculos={veiculos} />
          </div>
          <ModalFooter>
            <BtnCancelar onClick={fecharModal} />
            <BtnSalvar onClick={salvarCriar} disabled={salvando}>{salvando ? 'Salvando…' : 'Criar rota'}</BtnSalvar>
          </ModalFooter>
        </Modal>
      )}

      {/* Modal Editar */}
      {modal === 'editar' && (
        <Modal onClose={fecharModal}>
          <ModalHeader title={`Editar rota #${selecionado?.id}`} onClose={fecharModal} />
          <div className="px-5 py-4 flex flex-col gap-3">
            {erro && <ErroBanner msg={erro} />}
            <FormRota form={form} setForm={setForm} usuarios={usuarios} agencias={agencias} veiculos={veiculos} />
          </div>
          <ModalFooter>
            <BtnCancelar onClick={fecharModal} />
            <BtnSalvar onClick={salvarEditar} disabled={salvando}>{salvando ? 'Salvando…' : 'Salvar alterações'}</BtnSalvar>
          </ModalFooter>
        </Modal>
      )}

      {/* Modal Excluir */}
      {modal === 'excluir' && (
        <Modal onClose={fecharModal}>
          <ModalHeader title="Excluir rota" danger onClose={fecharModal} />
          <div className="px-5 py-4 flex flex-col gap-3">
            {erro && <ErroBanner msg={erro} />}
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              Tem certeza que deseja excluir a rota <strong className="text-gray-900 dark:text-gray-100">#{selecionado?.id}</strong>?<br />
              Esta ação não pode ser desfeita.
            </p>
          </div>
          <ModalFooter>
            <BtnCancelar onClick={fecharModal} />
            <BtnExcluir onClick={confirmarExcluir} disabled={salvando}>{salvando ? 'Excluindo…' : 'Excluir'}</BtnExcluir>
          </ModalFooter>
        </Modal>
      )}
    </div>
  );
}
