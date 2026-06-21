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
      cell: ({ getValue }) => <strong>{fmtMoeda(getValue())}</strong>,
    },
    {
      id: 'acoes', header: '', enableSorting: false, size: 90,
      cell: ({ row }) => (
        <div className="acoes">
          <button className="btn-icon" title="Recalcular" onClick={() => abrirEdit(row.original)}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button className="btn-icon btn-danger" title="Remover custo" onClick={() => abrirDel(row.original)}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
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

  return (
    <div className="page">
      <style>{`
        .page { padding: 1.5rem; font-family: inherit; }
        .page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 12px; }
        .page-title { font-size: 1.35rem; font-weight: 600; margin: 0; }
        .section-title { font-size: 0.8rem; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; color: #6b7280; margin: 0 0 .75rem; display: flex; align-items: center; gap: 8px; }
        .section-title::after { content: ''; flex: 1; height: 1px; background: #e5e7eb; }
        .section-gap { margin-bottom: 2rem; }
        .toolbar { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .search-box { position: relative; }
        .search-box input { padding: 7px 12px 7px 34px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; width: 220px; outline: none; }
        .search-box input:focus { border-color: #ffdd20; box-shadow: 0 0 0 3px rgba(255,233,32,1); }
        .search-icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: #9ca3af; pointer-events: none; }
        .table-wrap { border: 1px solid #e5e7eb; border-radius: 10px; overflow: hidden; background: #fff; }
        table { width: 100%; border-collapse: collapse; font-size: 14px; }
        thead { background: #f9fafb; }
        th { padding: 10px 14px; text-align: left; font-weight: 600; font-size: 12px; text-transform: uppercase; letter-spacing: .04em; color: #6b7280; border-bottom: 1px solid #e5e7eb; white-space: nowrap; }
        th.sortable { cursor: pointer; user-select: none; }
        th.sortable:hover { color: #111; }
        .sort-icon { display: inline-block; margin-left: 4px; opacity: .4; }
        .sort-icon.active { opacity: 1; color: #6366f1; }
        td { padding: 11px 14px; border-bottom: 1px solid #f3f4f6; color: #111; vertical-align: middle; }
        tr:last-child td { border-bottom: none; }
        tbody tr:hover td { background: #f9fafb; }
        .empty-row td { text-align: center; padding: 2rem; color: #9ca3af; font-size: 13px; }
        .acoes { display: flex; gap: 6px; justify-content: flex-end; }
        .btn-icon { display: inline-flex; align-items: center; justify-content: center; width: 30px; height: 30px; border: 1px solid #e5e7eb; border-radius: 6px; background: transparent; cursor: pointer; color: #6b7280; transition: all .15s; }
        .btn-icon:hover { background: #f3f4f6; color: #111; border-color: #d1d5db; }
        .btn-icon.btn-danger:hover { background: #fef2f2; color: #dc2626; border-color: #fca5a5; }
        .btn-calcular { display: inline-flex; align-items: center; gap: 5px; padding: 5px 12px; background: #6366f1; color: #fff; border: none; border-radius: 6px; font-size: 13px; font-weight: 500; cursor: pointer; transition: background .15s; }
        .btn-calcular:hover { background: #4f46e5; }
        .pagination { display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; border-top: 1px solid #e5e7eb; font-size: 13px; color: #6b7280; flex-wrap: wrap; gap: 8px; }
        .pg-btns { display: flex; align-items: center; gap: 4px; }
        .pg-btn { padding: 5px 10px; border: 1px solid #e5e7eb; border-radius: 6px; background: transparent; cursor: pointer; font-size: 13px; color: #374151; }
        .pg-btn:hover:not(:disabled) { background: #f3f4f6; }
        .pg-btn:disabled { opacity: .4; cursor: default; }
        .pg-btn.active { background: #ffdf20; color: #111; border-color: #ffdf20; }
        .pg-size select { border: 1px solid #e5e7eb; border-radius: 6px; padding: 4px 8px; font-size: 13px; background: #fff; color: #374151; }
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.45); display: flex; align-items: center; justify-content: center; z-index: 50; padding: 1rem; }
        .modal { background: #fff; border-radius: 12px; width: 100%; max-width: 400px; box-shadow: 0 20px 60px rgba(0,0,0,.15); }
        .modal-header { display: flex; align-items: center; justify-content: space-between; padding: 1rem 1.25rem; border-bottom: 1px solid #e5e7eb; }
        .modal-title { font-size: 1rem; font-weight: 600; margin: 0; }
        .modal-close { background: none; border: none; cursor: pointer; color: #9ca3af; font-size: 20px; padding: 0; line-height: 1; }
        .modal-close:hover { color: #111; }
        .modal-body { padding: 1.25rem; display: flex; flex-direction: column; gap: 14px; }
        .modal-footer { display: flex; justify-content: flex-end; gap: 8px; padding: 1rem 1.25rem; border-top: 1px solid #e5e7eb; }
        .info-box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px 14px; display: flex; flex-direction: column; gap: 5px; }
        .info-row { display: flex; justify-content: space-between; font-size: 13px; }
        .info-row span:first-child { color: #6b7280; }
        .info-row span:last-child { font-weight: 500; color: #111; }
        .preview-box { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 10px 14px; }
        .preview-label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .05em; color: #3b82f6; margin-bottom: 6px; }
        .preview-valor { font-size: 1.4rem; font-weight: 700; color: #1d4ed8; }
        .preview-detalhe { font-size: 12px; color: #3b82f6; margin-top: 2px; }
        label { font-size: 13px; font-weight: 500; color: #374151; display: block; margin-bottom: 4px; }
        .field input { width: 100%; padding: 8px 10px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; box-sizing: border-box; outline: none; }
        .field input:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,.15); }
        .erro-msg { font-size: 13px; color: #dc2626; background: #fef2f2; border: 1px solid #fca5a5; border-radius: 7px; padding: 8px 12px; }
        .btn-cancelar { padding: 8px 16px; border: 1px solid #d1d5db; border-radius: 8px; background: transparent; cursor: pointer; font-size: 14px; font-weight: 500; }
        .btn-cancelar:hover { background: #f3f4f6; }
        .btn-salvar { padding: 8px 16px; background: #6366f1; color: #fff; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 500; }
        .btn-salvar:hover:not(:disabled) { background: #4f46e5; }
        .btn-salvar:disabled { opacity: .6; cursor: default; }
        .btn-excluir { padding: 8px 16px; background: #dc2626; color: #fff; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 500; }
        .btn-excluir:hover:not(:disabled) { background: #b91c1c; }
        .btn-excluir:disabled { opacity: .6; cursor: default; }
        .excluir-aviso { font-size: 14px; color: #374151; line-height: 1.6; }
        .excluir-aviso strong { color: #111; }
      `}</style>

      {/* ── Header da página ── */}
      <div className="page-header">
        <h2 className="page-title dark:text-white">Custos</h2>
      </div>

      {loading ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af', fontSize: 14 }}>Carregando...</div>
      ) : (
        <>
          {/* ── Rotas sem custo ── */}
          <div className="section-gap">
            <p className="section-title">Aguardando cálculo ({pendentes.length})</p>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>ID Rota</th><th>Data</th><th>Agência</th><th>Usuário</th>
                    <th>Distância</th><th>Consumo</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {pendentes.length === 0 ? (
                    <tr className="empty-row"><td colSpan={7}>Todas as rotas já possuem custo calculado.</td></tr>
                  ) : pendentes.map(r => (
                    <tr key={r.id}>
                      <td>#{r.id}</td>
                      <td>{fmtData(r.dia)}</td>
                      <td>{r.agencia?.nome ?? '—'}</td>
                      <td>{r.usuario?.nome ?? '—'}</td>
                      <td>{r.distancia_km} km</td>
                      <td>{r.consumo_kml} km/l</td>
                      <td>
                        <div className="acoes">
                          <button className="btn-calcular" onClick={() => abrirCalc(r)}>
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

          {/* ── Custos calculados — TanStack Table ── */}
          <div className="section-gap">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '.75rem', flexWrap: 'wrap', gap: 10 }}>
              <p className="section-title" style={{ margin: 0, flex: 1 }}>
                Custos calculados ({table.getFilteredRowModel().rows.length})
              </p>
              <div className="toolbar">
                <div className="search-box">
                  <svg className="search-icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  <input
                    className="text-slate-700 dark:text-slate-300"
                    placeholder="Buscar custos..."
                    value={globalFilter}
                    onChange={e => setGlobalFilter(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  {table.getHeaderGroups().map(hg => (
                    <tr key={hg.id}>
                      {hg.headers.map(header => {
                        const sorted = header.column.getIsSorted();
                        return (
                          <th
                            key={header.id}
                            style={{ width: header.column.columnDef.size }}
                            className={header.column.getCanSort() ? 'sortable' : ''}
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {header.column.getCanSort() && (
                              <span className={`sort-icon ${sorted ? 'active' : ''}`}>
                                {sorted === 'asc' ? ' ↑' : sorted === 'desc' ? ' ↓' : ' ↕'}
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
                    <tr className="empty-row">
                      <td colSpan={columns.length}>
                        {globalFilter ? 'Nenhum resultado encontrado.' : 'Nenhum custo calculado ainda.'}
                      </td>
                    </tr>
                  ) : table.getRowModel().rows.map(row => (
                    <tr key={row.id}>
                      {row.getVisibleCells().map(cell => (
                        <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Paginação dentro do table-wrap, igual Agencias */}
              <div className="pagination">
                <div className="pg-size">
                  Exibindo <select value={table.getState().pagination.pageSize} onChange={e => table.setPageSize(Number(e.target.value))}>
                    {[10, 20, 50].map(n => <option key={n} value={n}>{n}</option>)}
                  </select> por página — {table.getFilteredRowModel().rows.length} resultado(s)
                </div>
                <div className="pg-btns">
                  <button className="pg-btn" onClick={() => table.firstPage()}    disabled={!table.getCanPreviousPage()}>«</button>
                  <button className="pg-btn" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>‹</button>
                  {Array.from({ length: table.getPageCount() }, (_, i) => (
                    <button
                      key={i}
                      className={`pg-btn ${table.getState().pagination.pageIndex === i ? 'active' : ''}`}
                      onClick={() => table.setPageIndex(i)}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button className="pg-btn" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>›</button>
                  <button className="pg-btn" onClick={() => table.lastPage()}  disabled={!table.getCanNextPage()}>»</button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Modal: Calcular custo ── */}
      {modalCalc && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && fecharCalc()}>
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">Calcular custo — Rota #{modalCalc.id}</h3>
              <button className="modal-close" onClick={fecharCalc}>×</button>
            </div>
            <div className="modal-body">
              {erro && <div className="erro-msg">{erro}</div>}
              <div className="info-box">
                <div className="info-row"><span>Data</span><span>{fmtData(modalCalc.dia)}</span></div>
                <div className="info-row"><span>Agência</span><span>{modalCalc.agencia?.nome ?? '—'}</span></div>
                <div className="info-row"><span>Distância</span><span>{modalCalc.distancia_km} km</span></div>
                <div className="info-row"><span>Consumo</span><span>{modalCalc.consumo_kml} km/l</span></div>
                <div className="info-row">
                  <span>Litros necessários</span>
                  <span>{(modalCalc.distancia_km / modalCalc.consumo_kml).toFixed(2)} L</span>
                </div>
              </div>
              <div className="field">
                <label>Preço do combustível (R$/L)</label>
                <input type="number" step="0.01" min="0" placeholder="ex: 6.29"
                  value={preco} onChange={e => { setPreco(e.target.value); setErro(''); }} autoFocus />
              </div>
              {previewCusto != null && (
                <div className="preview-box">
                  <div className="preview-label">Custo estimado</div>
                  <div className="preview-valor">{fmtMoeda(previewCusto)}</div>
                  <div className="preview-detalhe">{previewLitros?.toFixed(2)} L × {fmtMoeda(parseFloat(preco))}</div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-cancelar" onClick={fecharCalc}>Cancelar</button>
              <button className="btn-salvar" onClick={salvarCalc} disabled={salvando}>
                {salvando ? 'Salvando…' : 'Salvar custo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Recalcular ── */}
      {modalEdit && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && fecharEdit()}>
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">Recalcular — Rota #{modalEdit.fk_rota}</h3>
              <button className="modal-close" onClick={fecharEdit}>×</button>
            </div>
            <div className="modal-body">
              {erro && <div className="erro-msg">{erro}</div>}
              <div className="info-box">
                <div className="info-row"><span>Distância</span><span>{modalEdit.rota.distancia_km} km</span></div>
                <div className="info-row"><span>Consumo</span><span>{modalEdit.rota.consumo_kml} km/l</span></div>
                <div className="info-row"><span>Litros necessários</span><span>{previewEditLitros?.toFixed(2)} L</span></div>
                <div className="info-row"><span>Custo atual</span><span>{fmtMoeda(modalEdit.custo_total)}</span></div>
              </div>
              <div className="field">
                <label>Novo preço do combustível (R$/L)</label>
                <input type="number" step="0.01" min="0"
                  value={precoEdit} onChange={e => { setPrecoEdit(e.target.value); setErro(''); }} autoFocus />
              </div>
              {previewEditCusto != null && (
                <div className="preview-box">
                  <div className="preview-label">Novo custo estimado</div>
                  <div className="preview-valor">{fmtMoeda(previewEditCusto)}</div>
                  <div className="preview-detalhe">{previewEditLitros?.toFixed(2)} L × {fmtMoeda(parseFloat(precoEdit))}</div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-cancelar" onClick={fecharEdit}>Cancelar</button>
              <button className="btn-salvar" onClick={salvarEdit} disabled={salvando}>
                {salvando ? 'Salvando…' : 'Recalcular'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Excluir custo ── */}
      {modalDel && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && fecharDel()}>
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title" style={{ color: '#dc2626' }}>Remover custo</h3>
              <button className="modal-close" onClick={fecharDel}>×</button>
            </div>
            <div className="modal-body">
              {erro && <div className="erro-msg">{erro}</div>}
              <p className="excluir-aviso">
                Deseja remover o custo da rota <strong>#{modalDel.fk_rota}</strong>?<br />
                A rota voltará para a lista de pendentes e poderá ser recalculada.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn-cancelar" onClick={fecharDel}>Cancelar</button>
              <button className="btn-excluir" onClick={confirmarDel} disabled={salvando}>
                {salvando ? 'Removendo…' : 'Remover'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}