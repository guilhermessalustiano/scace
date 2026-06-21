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

const EMPTY_FORM = { nome: '', email: '', username: '', telefone: '', senha: '' };

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [globalFilter, setGlobalFilter] = useState('');
  const [sorting, setSorting] = useState([]);

  // Modal state
  const [modal, setModal] = useState(null); // null | 'criar' | 'editar' | 'excluir'
  const [selecionado, setSelecionado] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  const carregar = () => {
    setLoading(true);
    api.get('/usuarios')
      .then(res => setUsuarios(res.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { carregar(); }, []);

  const abrirCriar = () => {
    setForm(EMPTY_FORM);
    setErro('');
    setModal('criar');
  };

  const abrirEditar = (usuario) => {
    setSelecionado(usuario);
    setForm({
      nome: usuario.nome,
      email: usuario.email,
      username: usuario.username,
      telefone: usuario.telefone ?? '',
      senha: '',
    });
    setErro('');
    setModal('editar');
  };

  const abrirExcluir = (usuario) => {
    setSelecionado(usuario);
    setModal('excluir');
  };

  const fecharModal = () => {
    setModal(null);
    setSelecionado(null);
    setErro('');
  };

  const salvarCriar = async () => {
    if (!form.nome || !form.email || !form.username || !form.senha) {
      setErro('Nome, e-mail, username e senha são obrigatórios.');
      return;
    }
    setSalvando(true);
    try {
      await api.post('/usuarios', form);
      fecharModal();
      carregar();
    } catch (e) {
      setErro(e.response?.data?.message ?? 'Erro ao criar usuário.');
    } finally {
      setSalvando(false);
    }
  };

  const salvarEditar = async () => {
    if (!form.nome || !form.email) {
      setErro('Nome e e-mail são obrigatórios.');
      return;
    }
    setSalvando(true);
    // username não é enviado na edição — é imutável
    const payload = { nome: form.nome, email: form.email, telefone: form.telefone };
    if (form.senha) payload.senha = form.senha;
    try {
      await api.put(`/usuarios/${selecionado.id}`, payload);
      fecharModal();
      carregar();
    } catch (e) {
      setErro(e.response?.data?.message ?? 'Erro ao salvar alterações.');
    } finally {
      setSalvando(false);
    }
  };

  const confirmarExcluir = async () => {
    setSalvando(true);
    try {
      await api.delete(`/usuarios/${selecionado.id}`);
      fecharModal();
      carregar();
    } catch (e) {
      setErro(e.response?.data?.message ?? 'Erro ao excluir usuário.');
    } finally {
      setSalvando(false);
    }
  };

  const columns = useMemo(() => [
    {
      accessorKey: 'id',
      header: 'ID',
      size: 60,
    },
    {
      accessorKey: 'username',
      header: 'Username',
    },
    {
      accessorKey: 'nome',
      header: 'Nome',
    },
    {
      accessorKey: 'email',
      header: 'E-mail',
    },
    {
      accessorKey: 'telefone',
      header: 'Telefone',
      cell: ({ row }) => row.original.telefone || '—',
    },
    {
      id: 'acoes',
      header: '',
      enableSorting: false,
      size: 100,
      cell: ({ row }) => (
        <div className="acoes">
          <button className="btn-icon" title="Editar" onClick={() => abrirEditar(row.original)}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button className="btn-icon btn-danger" title="Excluir" onClick={() => abrirExcluir(row.original)}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
          </button>
        </div>
      ),
    },
  ], []);

  const table = useReactTable({
    data: usuarios,
    columns,
    state: { globalFilter, sorting },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  return (
    <div className="usuarios-page">
      <style>{`
        .usuarios-page { padding: 1.5rem; font-family: inherit; }
        .page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 12px; }
        .page-title { font-size: 1.35rem; font-weight: 600; margin: 0; }
        .toolbar { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .search-box { position: relative; }
        .search-box input { padding: 7px 12px 7px 34px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; width: 220px; outline: none; }
        .search-box input:focus { border-color: #ffdf20; box-shadow: 0 0 0 3px rgba(255,233,32,1); }
        .search-icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: #9ca3af; pointer-events: none; }
        .btn-primary { display: inline-flex; align-items: center; gap: 6px; padding: 7px 14px; border: none; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer; transition: background .15s; }
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
        .acoes { display: flex; gap: 6px; justify-content: flex-end; }
        .btn-icon { display: inline-flex; align-items: center; justify-content: center; width: 30px; height: 30px; border: 1px solid #e5e7eb; border-radius: 6px; background: transparent; cursor: pointer; color: #6b7280; transition: all .15s; }
        .btn-icon:hover { background: #f3f4f6; color: #111; border-color: #d1d5db; }
        .btn-icon.btn-danger:hover { background: #fef2f2; color: #dc2626; border-color: #fca5a5; }
        .pagination { display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; border-top: 1px solid #e5e7eb; font-size: 13px; color: #6b7280; flex-wrap: wrap; gap: 8px; }
        .pg-btns { display: flex; align-items: center; gap: 4px; }
        .pg-btn { padding: 5px 10px; border: 1px solid #e5e7eb; border-radius: 6px; background: transparent; cursor: pointer; font-size: 13px; color: #374151; }
        .pg-btn:hover:not(:disabled) { background: #f3f4f6; }
        .pg-btn:disabled { opacity: .4; cursor: default; }
        .pg-btn.active { background: #ffdf20; color: #111; border-color: #ffdf20; }
        .pg-size select { border: 1px solid #e5e7eb; border-radius: 6px; padding: 4px 8px; font-size: 13px; background: #fff; color: #374151; }
        .empty-row td { text-align: center; padding: 2rem; color: #9ca3af; }

        /* Modal */
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.45); display: flex; align-items: center; justify-content: center; z-index: 50; padding: 1rem; }
        .modal { background: #fff; border-radius: 12px; width: 100%; max-width: 420px; box-shadow: 0 20px 60px rgba(0,0,0,.15); }
        .modal-header { display: flex; align-items: center; justify-content: space-between; padding: 1rem 1.25rem; border-bottom: 1px solid #e5e7eb; }
        .modal-title { font-size: 1rem; font-weight: 600; margin: 0; }
        .modal-close { background: none; border: none; cursor: pointer; color: #9ca3af; font-size: 20px; padding: 0; line-height: 1; }
        .modal-close:hover { color: #111; }
        .modal-body { padding: 1.25rem; display: flex; flex-direction: column; gap: 14px; }
        .modal-footer { display: flex; justify-content: flex-end; gap: 8px; padding: 1rem 1.25rem; border-top: 1px solid #e5e7eb; }
        label { font-size: 13px; font-weight: 500; color: #374151; display: block; margin-bottom: 4px; }
        .field input { width: 100%; padding: 8px 10px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; box-sizing: border-box; outline: none; }
        .field input:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,.15); }
        .field input:disabled { background: #f3f4f6; color: #9ca3af; cursor: not-allowed; }
        .campo-hint { font-size: 12px; color: #9ca3af; margin-top: 2px; }
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

      {/* Cabeçalho */}
      <div className="page-header">
        <h2 className="page-title dark:text-white">Usuários</h2>
        <div className="toolbar">
          <div className="search-box">
            <svg className="search-icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input
              className='text-slate-700 dark:text-slate-300'
              placeholder="Buscar usuários..."
              value={globalFilter}
              onChange={e => setGlobalFilter(e.target.value)}
            />
          </div>
          <button className="btn-primary bg-yellow-300 hover:bg-yellow-400" onClick={abrirCriar}>
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Novo usuário
          </button>
        </div>
      </div>

      {/* Tabela */}
      <div className="table-wrap">
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af', fontSize: 14 }}>Carregando...</div>
        ) : (
          <>
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
                  <tr className="empty-row"><td colSpan={columns.length}>Nenhum usuário encontrado.</td></tr>
                ) : (
                  table.getRowModel().rows.map(row => (
                    <tr key={row.id}>
                      {row.getVisibleCells().map(cell => (
                        <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Paginação */}
            <div className="pagination">
              <div className="pg-size">
                Exibindo{' '}
                <select
                  value={table.getState().pagination.pageSize}
                  onChange={e => table.setPageSize(Number(e.target.value))}
                >
                  {[10, 20, 50].map(n => <option key={n} value={n}>{n}</option>)}
                </select>{' '}
                por página — {table.getFilteredRowModel().rows.length} resultado(s)
              </div>
              <div className="pg-btns">
                <button className="pg-btn" onClick={() => table.firstPage()} disabled={!table.getCanPreviousPage()}>«</button>
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
                <button className="pg-btn" onClick={() => table.lastPage()} disabled={!table.getCanNextPage()}>»</button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modal Criar */}
      {modal === 'criar' && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && fecharModal()}>
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">Novo usuário</h3>
              <button className="modal-close" onClick={fecharModal}>×</button>
            </div>
            <div className="modal-body">
              {erro && <div className="erro-msg">{erro}</div>}
              <div className="field"><label>Nome</label><input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Nome completo" /></div>
              <div className="field"><label>Username</label><input value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} placeholder="ex: joao.silva" /></div>
              <div className="field"><label>E-mail</label><input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@exemplo.com" /></div>
              <div className="field"><label>Telefone <span style={{ fontWeight: 400, color: '#9ca3af' }}>(opcional)</span></label><input value={form.telefone} onChange={e => setForm(f => ({ ...f, telefone: e.target.value }))} placeholder="(00) 00000-0000" /></div>
              <div className="field"><label>Senha</label><input type="password" value={form.senha} onChange={e => setForm(f => ({ ...f, senha: e.target.value }))} placeholder="Senha inicial" /></div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancelar" onClick={fecharModal}>Cancelar</button>
              <button className="btn-salvar" onClick={salvarCriar} disabled={salvando}>{salvando ? 'Salvando…' : 'Criar usuário'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar */}
      {modal === 'editar' && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && fecharModal()}>
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">Editar usuário</h3>
              <button className="modal-close" onClick={fecharModal}>×</button>
            </div>
            <div className="modal-body">
              {erro && <div className="erro-msg">{erro}</div>}
              <div className="field">
                <label>Username</label>
                <input value={form.username} disabled />
                <p className="campo-hint">O username não pode ser alterado.</p>
              </div>
              <div className="field"><label>Nome</label><input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} /></div>
              <div className="field"><label>E-mail</label><input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
              <div className="field"><label>Telefone <span style={{ fontWeight: 400, color: '#9ca3af' }}>(opcional)</span></label><input value={form.telefone} onChange={e => setForm(f => ({ ...f, telefone: e.target.value }))} placeholder="(00) 00000-0000" /></div>
              <div className="field">
                <label>Nova senha <span style={{ fontWeight: 400, color: '#9ca3af' }}>(opcional)</span></label>
                <input type="password" value={form.senha} onChange={e => setForm(f => ({ ...f, senha: e.target.value }))} placeholder="Deixe em branco para manter" />
                <p className="campo-hint">Preencha apenas se quiser alterar a senha.</p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancelar" onClick={fecharModal}>Cancelar</button>
              <button className="btn-salvar" onClick={salvarEditar} disabled={salvando}>{salvando ? 'Salvando…' : 'Salvar alterações'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Excluir */}
      {modal === 'excluir' && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && fecharModal()}>
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title" style={{ color: '#dc2626' }}>Excluir usuário</h3>
              <button className="modal-close" onClick={fecharModal}>×</button>
            </div>
            <div className="modal-body">
              {erro && <div className="erro-msg">{erro}</div>}
              <p className="excluir-aviso">
                Tem certeza que deseja excluir o usuário <strong>{selecionado?.nome}</strong>?
                <br />Esta ação não pode ser desfeita.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn-cancelar" onClick={fecharModal}>Cancelar</button>
              <button className="btn-excluir" onClick={confirmarExcluir} disabled={salvando}>{salvando ? 'Excluindo…' : 'Excluir'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
