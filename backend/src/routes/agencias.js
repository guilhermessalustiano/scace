const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
 
// Listar todas (com endereço)
router.get('/', async (req, res) => {
  try {
    const agencias = await prisma.agencia.findMany({ include: { endereco: true } });
    res.json(agencias);
  } catch (e) {
    res.status(500).json({ message: 'Erro ao buscar agências.' });
  }
});
 
// Buscar por ID
router.get('/:id', async (req, res) => {
  try {
    const agencia = await prisma.agencia.findUnique({
      where: { id: Number(req.params.id) },
      include: { endereco: true },
    });
    if (!agencia) return res.status(404).json({ message: 'Agência não encontrada.' });
    res.json(agencia);
  } catch (e) {
    res.status(500).json({ message: 'Erro ao buscar agência.' });
  }
});
 
// Criar
router.post('/', async (req, res) => {
  const { nome, descricao, endereco } = req.body;
  try {
    const agencia = await prisma.agencia.create({
      data: {
        nome,
        descricao,
        endereco: endereco ? { create: { ...endereco, numero: Number(endereco.numero) } } : undefined,
      },
      include: { endereco: true },
    });
    res.status(201).json(agencia);
  } catch (e) {
    if (e.code === 'P2002') return res.status(409).json({ message: 'Já existe uma agência com esses dados.' });
    res.status(500).json({ message: 'Erro ao criar agência.' });
  }
});
 
// Editar
router.put('/:id', async (req, res) => {
  const { nome, descricao, endereco } = req.body;
  const id = Number(req.params.id);
  try {
    const agencia = await prisma.agencia.update({
      where: { id },
      data: {
        nome,
        descricao,
        endereco: endereco
          ? {
              upsert: {
                create: { ...endereco, numero: Number(endereco.numero) },
                update: { ...endereco, numero: Number(endereco.numero) },
              },
            }
          : undefined,
      },
      include: { endereco: true },
    });
    res.json(agencia);
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ message: 'Agência não encontrada.' });
    res.status(500).json({ message: 'Erro ao atualizar agência.' });
  }
});
 
// Excluir
router.delete('/:id', async (req, res) => {
  const id = Number(req.params.id);
  try {
    // Remove endereço antes (FK constraint)
    await prisma.endereco_agencia.deleteMany({ where: { fk_agencia: id } });
    await prisma.agencia.delete({ where: { id } });
    res.json({ message: 'Agência excluída com sucesso.' });
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ message: 'Agência não encontrada.' });
    if (e.code === 'P2003') return res.status(409).json({ message: 'Agência vinculada a rotas e não pode ser excluída.' });
    res.status(500).json({ message: 'Erro ao excluir agência.' });
  }
});
 
module.exports = router;