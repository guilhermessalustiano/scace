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

const fmtData  = (s) => s ? new Date(s).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '—';
const fmtMoeda = (v) => v != null ? `R$ ${Number(v).toFixed(2).replace('.', ',')}` : '—';

// ── Componentes de UI ────────────────────────────────────────────────────────

const inputCls = "w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-yellow-300 focus:border-yellow-300 dark:focus:ring-yellow-300 dark:focus:border-yellow-300 transition";
const labelCls = "block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1";

function BtnIconPage({ onClick, disabled, children }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="px-2.5 py-1 text-sm border border-gray-200 dark:border-gray-600 rounded-md bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
    >
      {children}
    </button>
  );
}

function Modal({ children, onClose }) {
  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-8 overflow-y-auto"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md shadow-2xl border border-gray-200 dark:border-gray-700">
        {children}
      </div>
    </div>
  );
}

function ModalHeader({ title, danger, onClose }) {
  return (
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
}

function ModalFooter({ children }) {
  return (
    <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-200 dark:border-gray-700">
      {children}
    </div>
  );
}

function BtnCancelar({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-2 text-sm font-medium border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
    >
      Cancelar
    </button>
  );
}

function BtnSalvar({ onClick, disabled, children }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="px-4 py-2 text-sm font-medium rounded-lg bg-yellow-300 hover:bg-yellow-400 text-gray-900 disabled:opacity-60 disabled:cursor-not-allowed transition"
    >
      {children}
    </button>
  );
}

function BtnExcluir({ onClick, disabled, children }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="px-4 py-2 text-sm font-medium rounded-lg bg-red-600 hover:bg-red-700 text-white disabled:opacity-60 disabled:cursor-not-allowed transition"
    >
      {children}
    </button>
  );
}

function ErroBanner({ msg }) {
  return (
    <div className="text-sm text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
      {msg}
    </div>
  );
}

function InfoBox({ rows }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-3 flex flex-col gap-2">
      {rows.map(([label, value]) => (
        <div key={label} className="flex justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">{label}</span>
          <span className="font-medium text-gray-900 dark:text-gray-100">{value}</span>
        </div>
      ))}
    </div>
  );
}

function PreviewBox({ label, valor, detalhe }) {
  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-blue-500 dark:text-blue-400 mb-1">{label}</p>
      <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{valor}</p>
      <p className="text-xs text-blue-500 dark:text-blue-400 mt-0.5">{detalhe}</p>
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 whitespace-nowrap">
        {children}
      </span>
      <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
    </div>
  );
}

// ── Custos ───────────────────────────────────────────────────────────────────

export default function Custos() {
  const [pendentes,  setPendentes]  = useState([]);
  const [calculados, setCalculados] = useState([]);
  const [loading,    setLoading]    = useState(true);

  const [globalFilter, setGlobalFilter] = useState('');
  const [sorting,      setSorting]      = useState([]);

  const [modalCalc, setModalCalc] = useState(null);
  const [preco,     setPreco]     = useState('');
  const [modalEdit, setModalEdit] = useState(null);
  const [precoEdit, setPrecoEdit] = useState('');
  const [modalDel,  setModalDel]  = useState(null);
  const [salvando,  setSalvando]  = useState(false);
  const [erro,      setErro]      = useState('');

  const carregar = () => {
    setLoading(true);
    Promise.all([
      api.get('/custos/pendentes'),
      api.get('/custos/calculados'),
    ]).then(([p, c]) => {
      setPendentes(p.data);
      setCalculados(c.data);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { carregar(); }, []);

  const abrirCalc  = (rota) => { setModalCalc(rota); setPreco(''); setErro(''); };
  const fecharCalc = ()     => { setModalCalc(null);  setPreco(''); setErro(''); };
  const salvarCalc = async () => {
    if (!preco || isNaN(parseFloat(preco))) { setErro('Informe um preço válido.'); return; }
    setSalvando(true);
    try {
      await api.post('/custos', { fk_rota: modalCalc.id, preco_combustivel: parseFloat(preco) });
      fecharCalc(); carregar();
    } catch (e) { setErro(e.response?.data?.message ?? 'Erro ao salvar.'); }
    finally { setSalvando(false); }
  };

  const abrirEdit  = (custo) => { setModalEdit(custo); setPrecoEdit(String(custo.preco_combustivel)); setErro(''); };
  const fecharEdit = ()      => { setModalEdit(null);   setPrecoEdit(''); setErro(''); };
  const salvarEdit = async () => {
    if (!precoEdit || isNaN(parseFloat(precoEdit))) { setErro('Informe um preço válido.'); return; }
    setSalvando(true);
    try {
      await api.put(`/custos/${modalEdit.fk_rota}`, { preco_combustivel: parseFloat(precoEdit) });
      fecharEdit(); carregar();
    } catch (e) { setErro(e.response?.data?.message ?? 'Erro ao recalcular.'); }
    finally { setSalvando(false); }
  };

  const abrirDel     = (custo) => { setModalDel(custo); setErro(''); };
  const fecharDel    = ()      => { setModalDel(null);  setErro(''); };
  const confirmarDel = async () => {
    setSalvando(true);
    try {
      await api.delete(`/custos/${modalDel.fk_rota}`);
      fecharDel(); carregar();
    } catch (e) { setErro(e.response?.data?.message ?? 'Erro ao remover.'); }
    finally { setSalvando(false); }
  };

  const previewLitros     = modalCalc && parseFloat(preco)    ? (modalCalc.distancia_km / modalCalc.consumo_kml) : null;
  const previewCusto      = previewLitros ? previewLitros * parseFloat(preco) : null;
  const previewEditLitros = modalEdit ? (modalEdit.rota.distancia_km / modalEdit.rota.consumo_kml) : null;
  const previewEditCusto  = previewEditLitros && parseFloat(precoEdit) ? previewEditLitros * parseFloat(precoEdit) : null;

  const columns = useMemo(() => [
    {
      id: 'fk_rota', header: 'ID Rota', size: 80,
      accessorFn: row => row.fk_rota,
      cell: ({ getValue }) => `#${getValue()}`,
    },
    {
      id: 'dia', header: 'Data', size: 100,
      accessorFn: row => row.rota?.dia ?? '',
      cell: ({ getValue }) => fmtData(getValue()),
      sortingFn: 'datetime',
    },
    {
      id: 'agencia', header: 'Agência',
      accessorFn: row => row.rota?.agencia?.nome ?? '—',
    },
    {
      id: 'usuario', header: 'Usuário',
      accessorFn: row => row.rota?.usuario?.nome ?? '—',
    },
    {
      id: 'distancia_km', header: 'Distância', size: 100,
      accessorFn: row => row.rota?.distancia_km ?? 0,
      cell: ({ getValue }) => `${getValue()} km`,
    },
    {
      id: 'preco_combustivel', header: 'Combustível (R$/L)', size: 160,
      accessorFn: row => row.preco_combustivel,
      cell: ({ getValue }) => fmtMoeda(getValue()),
    },
    {
      id: 'custo_total', header: 'Custo total', size: 120,
      accessorFn: row => row.custo_total,
      cell: ({ getValue }) => <strong className="text-gray-900 dark:text-gray-100">{fmtMoeda(getValue())}</strong>,
    },
    {
      id: 'acoes', header: '', enableSorting: false, size: 90,
      cell: ({ row }) => (
        <div className="flex gap-1.5 justify-end">
          <button
            title="Recalcular"
            onClick={() => abrirEdit(row.original)}
            className="inline-flex items-center justify-center w-8 h-8 border border-gray-200 dark:border-gray-600 rounded-lg bg-transparent text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100 hover:border-gray-300 dark:hover:border-gray-500 transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button
            title="Remover custo"
            onClick={() => abrirDel(row.original)}
            className="inline-flex items-center justify-center w-8 h-8 border border-gray-200 dark:border-gray-600 rounded-lg bg-transparent text-gray-500 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-700 transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
          </button>
        </div>
      ),
    },
  ], []);

  const table = useReactTable({
    data: calculados, columns,
    state: { globalFilter, sorting },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    getCoreRowModel:       getCoreRowModel(),
    getSortedRowModel:     getSortedRowModel(),
    getFilteredRowModel:   getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6 p-6">

      {/* Cabeçalho */}
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Custos</h1>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <span className="text-sm text-gray-500 dark:text-gray-400">Carregando...</span>
        </div>
      ) : (
        <>
          {/* ── Rotas pendentes ── */}
          <section>
            <SectionTitle>Aguardando cálculo ({pendentes.length})</SectionTitle>
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead className="bg-gray-50 dark:bg-gray-700/50">
                    <tr>
                      {['ID Rota', 'Data', 'Agência', 'Usuário', 'Distância', 'Consumo', ''].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pendentes.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-10 text-sm text-gray-400 dark:text-gray-500">
                          Todas as rotas já possuem custo calculado.
                        </td>
                      </tr>
                    ) : pendentes.map(r => (
                      <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/40 transition">
                        <td className="px-4 py-3 border-b border-gray-100 dark:border-gray-700/50 text-gray-800 dark:text-gray-200">#{r.id}</td>
                        <td className="px-4 py-3 border-b border-gray-100 dark:border-gray-700/50 text-gray-800 dark:text-gray-200">{fmtData(r.dia)}</td>
                        <td className="px-4 py-3 border-b border-gray-100 dark:border-gray-700/50 text-gray-800 dark:text-gray-200">{r.agencia?.nome ?? '—'}</td>
                        <td className="px-4 py-3 border-b border-gray-100 dark:border-gray-700/50 text-gray-800 dark:text-gray-200">{r.usuario?.nome ?? '—'}</td>
                        <td className="px-4 py-3 border-b border-gray-100 dark:border-gray-700/50 text-gray-800 dark:text-gray-200">{r.distancia_km} km</td>
                        <td className="px-4 py-3 border-b border-gray-100 dark:border-gray-700/50 text-gray-800 dark:text-gray-200">{r.consumo_kml} km/l</td>
                        <td className="px-4 py-3 border-b border-gray-100 dark:border-gray-700/50">
                          <div className="flex justify-end">
                            <button
                              onClick={() => abrirCalc(r)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-yellow-300 hover:bg-yellow-400 text-gray-900 transition"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="4" y="2" width="16" height="20" rx="2"/>
                                <line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="16" y2="10"/>
                                <line x1="8" y1="14" x2="12" y2="14"/>
                              </svg>
                              Calcular
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* ── Custos calculados ── */}
          <section>
            <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
              <SectionTitle>Custos calculados ({table.getFilteredRowModel().rows.length})</SectionTitle>
              <div className="relative mb-4">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input
                  className="pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:ring-2 focus:ring-yellow-300 focus:border-yellow-300 dark:focus:ring-yellow-300 dark:focus:border-yellow-300 w-52 transition"
                  placeholder="Buscar custos..."
                  value={globalFilter}
                  onChange={e => setGlobalFilter(e.target.value)}
                />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden">
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
                          {globalFilter ? 'Nenhum resultado encontrado.' : 'Nenhum custo calculado ainda.'}
                        </td>
                      </tr>
                    ) : table.getRowModel().rows.map(row => (
                      <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/40 transition">
                        {row.getVisibleCells().map(cell => (
                          <td key={cell.id} className="px-4 py-3 border-b border-gray-100 dark:border-gray-700/50 text-gray-800 dark:text-gray-200 align-middle last:border-b-0">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                    ))}
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
                  <BtnIconPage onClick={() => table.firstPage()}    disabled={!table.getCanPreviousPage()}>«</BtnIconPage>
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
                  <BtnIconPage onClick={() => table.lastPage()}  disabled={!table.getCanNextPage()}>»</BtnIconPage>
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      {/* ── Modal: Calcular custo ── */}
      {modalCalc && (
        <Modal onClose={fecharCalc}>
          <ModalHeader title={`Calcular custo — Rota #${modalCalc.id}`} onClose={fecharCalc} />
          <div className="px-5 py-4 flex flex-col gap-3">
            {erro && <ErroBanner msg={erro} />}
            <InfoBox rows={[
              ['Data',              fmtData(modalCalc.dia)],
              ['Agência',           modalCalc.agencia?.nome ?? '—'],
              ['Distância',         `${modalCalc.distancia_km} km`],
              ['Consumo',           `${modalCalc.consumo_kml} km/l`],
              ['Litros necessários', `${(modalCalc.distancia_km / modalCalc.consumo_kml).toFixed(2)} L`],
            ]} />
            <div>
              <label className={labelCls}>Preço do combustível (R$/L)</label>
              <input
                className={inputCls}
                type="number" step="0.01" min="0" placeholder="ex: 6.29"
                value={preco}
                onChange={e => { setPreco(e.target.value); setErro(''); }}
                autoFocus
              />
            </div>
            {previewCusto != null && (
              <PreviewBox
                label="Custo estimado"
                valor={fmtMoeda(previewCusto)}
                detalhe={`${previewLitros?.toFixed(2)} L × ${fmtMoeda(parseFloat(preco))}`}
              />
            )}
          </div>
          <ModalFooter>
            <BtnCancelar onClick={fecharCalc} />
            <BtnSalvar onClick={salvarCalc} disabled={salvando}>{salvando ? 'Salvando…' : 'Salvar custo'}</BtnSalvar>
          </ModalFooter>
        </Modal>
      )}

      {/* ── Modal: Recalcular ── */}
      {modalEdit && (
        <Modal onClose={fecharEdit}>
          <ModalHeader title={`Recalcular — Rota #${modalEdit.fk_rota}`} onClose={fecharEdit} />
          <div className="px-5 py-4 flex flex-col gap-3">
            {erro && <ErroBanner msg={erro} />}
            <InfoBox rows={[
              ['Distância',          `${modalEdit.rota.distancia_km} km`],
              ['Consumo',            `${modalEdit.rota.consumo_kml} km/l`],
              ['Litros necessários', `${previewEditLitros?.toFixed(2)} L`],
              ['Custo atual',        fmtMoeda(modalEdit.custo_total)],
            ]} />
            <div>
              <label className={labelCls}>Novo preço do combustível (R$/L)</label>
              <input
                className={inputCls}
                type="number" step="0.01" min="0"
                value={precoEdit}
                onChange={e => { setPrecoEdit(e.target.value); setErro(''); }}
                autoFocus
              />
            </div>
            {previewEditCusto != null && (
              <PreviewBox
                label="Novo custo estimado"
                valor={fmtMoeda(previewEditCusto)}
                detalhe={`${previewEditLitros?.toFixed(2)} L × ${fmtMoeda(parseFloat(precoEdit))}`}
              />
            )}
          </div>
          <ModalFooter>
            <BtnCancelar onClick={fecharEdit} />
            <BtnSalvar onClick={salvarEdit} disabled={salvando}>{salvando ? 'Salvando…' : 'Recalcular'}</BtnSalvar>
          </ModalFooter>
        </Modal>
      )}

      {/* ── Modal: Remover custo ── */}
      {modalDel && (
        <Modal onClose={fecharDel}>
          <ModalHeader title="Remover custo" danger onClose={fecharDel} />
          <div className="px-5 py-4 flex flex-col gap-3">
            {erro && <ErroBanner msg={erro} />}
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              Deseja remover o custo da rota <strong className="text-gray-900 dark:text-gray-100">#{modalDel.fk_rota}</strong>?<br />
              A rota voltará para a lista de pendentes e poderá ser recalculada.
            </p>
          </div>
          <ModalFooter>
            <BtnCancelar onClick={fecharDel} />
            <BtnExcluir onClick={confirmarDel} disabled={salvando}>{salvando ? 'Removendo…' : 'Remover'}</BtnExcluir>
          </ModalFooter>
        </Modal>
      )}
    </div>
  );
}