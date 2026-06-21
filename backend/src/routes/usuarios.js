const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();
 
// Listar todos
router.get('/', async (req, res) => {
  try {
    const usuarios = await prisma.usuario.findMany({
      select: { id: true, nome: true, email: true, username: true, telefone: true },
    });
    res.json(usuarios);
  } catch (e) {
    res.status(500).json({ message: 'Erro ao buscar usuários.' });
  }
});
 
// Criar
router.post('/', async (req, res) => {
  const { nome, email, username, telefone, senha } = req.body;
  try {
    const hash = await bcrypt.hash(senha, 10);
    const usuario = await prisma.usuario.create({
      data: { nome, email, username, telefone, senha_hash: hash },
    });
    res.status(201).json({ id: usuario.id, nome: usuario.nome, email: usuario.email, username: usuario.username, telefone: usuario.telefone });
  } catch (e) {
    if (e.code === 'P2002') return res.status(409).json({ message: 'E-mail ou username já cadastrado.' });
    res.status(500).json({ message: 'Erro ao criar usuário.' });
  }
});

// Editar
router.put('/:id', async (req, res) => {
  const { nome, email, username, telefone, senha } = req.body;
  try {
    const data = { nome, email, username, telefone };
    if (senha) data.senha_hash = await bcrypt.hash(senha, 10);
    const usuario = await prisma.usuario.update({
      where: { id: Number(req.params.id) },
      data,
    });
    res.json({ id: usuario.id, nome: usuario.nome, email: usuario.email, username: usuario.username, telefone: usuario.telefone });
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ message: 'Usuário não encontrado.' });
    if (e.code === 'P2002') return res.status(409).json({ message: 'E-mail ou username já cadastrado.' });
    res.status(500).json({ message: 'Erro ao atualizar usuário.' });
  }
});

// Excluir
router.delete('/:id', async (req, res) => {
  try {
    await prisma.usuario.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: 'Usuário excluído com sucesso.' });
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ message: 'Usuário não encontrado.' });
    if (e.code === 'P2003') return res.status(409).json({ message: 'Usuário vinculado a rotas e não pode ser excluído.' });
    res.status(500).json({ message: 'Erro ao excluir usuário.' });
  }
});

module.exports = router;