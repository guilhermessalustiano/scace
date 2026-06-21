
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
 
// Listar todos
router.get('/', async (req, res) => {
  try {
    const veiculos = await prisma.veiculo.findMany();
    res.json(veiculos);
  } catch (e) {
    res.status(500).json({ message: 'Erro ao buscar veículos.' });
  }
});
 
// Buscar por placa
router.get('/:placa', async (req, res) => {
  try {
    const veiculo = await prisma.veiculo.findUnique({ where: { placa: req.params.placa } });
    if (!veiculo) return res.status(404).json({ message: 'Veículo não encontrado.' });
    res.json(veiculo);
  } catch (e) {
    res.status(500).json({ message: 'Erro ao buscar veículo.' });
  }
});
 
// Criar
router.post('/', async (req, res) => {
  const { placa, marca, modelo, ano, tipo_combustivel } = req.body;
  try {
    const veiculo = await prisma.veiculo.create({
      data: { placa, marca, modelo, ano: Number(ano), tipo_combustivel },
    });
    res.status(201).json(veiculo);
  } catch (e) {
    if (e.code === 'P2002') return res.status(409).json({ message: 'Já existe um veículo com essa placa.' });
    res.status(500).json({ message: 'Erro ao criar veículo.' });
  }
});
 
// Editar
router.put('/:placa', async (req, res) => {
  const { marca, modelo, ano, tipo_combustivel } = req.body;
  try {
    const veiculo = await prisma.veiculo.update({
      where: { placa: req.params.placa },
      data: { marca, modelo, ano: Number(ano), tipo_combustivel },
    });
    res.json(veiculo);
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ message: 'Veículo não encontrado.' });
    res.status(500).json({ message: 'Erro ao atualizar veículo.' });
  }
});
 
// Excluir
router.delete('/:placa', async (req, res) => {
  try {
    await prisma.veiculo.delete({ where: { placa: req.params.placa } });
    res.json({ message: 'Veículo excluído com sucesso.' });
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ message: 'Veículo não encontrado.' });
    if (e.code === 'P2003') return res.status(409).json({ message: 'Veículo vinculado a rotas e não pode ser excluído.' });
    res.status(500).json({ message: 'Erro ao excluir veículo.' });
  }
});
 
module.exports = router;