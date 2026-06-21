const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
 
const includeUsuario = {
  usuario: { select: { id: true, nome: true, username: true } },
  agencia: true,
  veiculo: true,
};

// Listar todas
router.get('/', async (req, res) => {
  try {
    
    const rotas = await prisma.rota.findMany({
      include: includeUsuario,
    });
    res.json(rotas);
  } catch (e) {
    res.status(500).json({ message: 'Erro ao buscar rotas.' });
  }
});
 
// Buscar por ID
router.get('/:id', async (req, res) => {
  try {
    const rota = await prisma.rota.findUnique({
      where: { id: Number(req.params.id) },
      include: includeUsuario,
    });
    if (!rota) return res.status(404).json({ message: 'Rota não encontrada.' });
    res.json(rota);
  } catch (e) {
    res.status(500).json({ message: 'Erro ao buscar rota.' });
  }
});
 
// Criar
router.post('/', async (req, res) => {
  const { fk_usuario, fk_agencia, veiculo_placa, dia, hora_marcada, hora_inicio, hora_fim, distancia_km, consumo_kml, valor } = req.body;
  try {
    const rota = await prisma.rota.create({
      data: {
        fk_usuario: Number(fk_usuario),
        fk_agencia: Number(fk_agencia),
        veiculo_placa,
        dia: new Date(dia),
        hora_marcada,
        hora_inicio,
        hora_fim,
        distancia_km: parseFloat(distancia_km),
        consumo_kml: parseFloat(consumo_kml),
        valor: parseFloat(valor),
      },
    });
    res.status(201).json(rota);
  } catch (e) {
    if (e.code === 'P2003') return res.status(409).json({ message: 'Usuário, agência ou veículo não encontrado.' });
    res.status(500).json({ message: 'Erro ao criar rota.' });
  }
});
 
// Editar
router.put('/:id', async (req, res) => {
  const { fk_usuario, fk_agencia, veiculo_placa, dia, hora_marcada, hora_inicio, hora_fim, distancia_km, consumo_kml, valor } = req.body;
  try {
    const rota = await prisma.rota.update({
      where: { id: Number(req.params.id) },
      data: {
        fk_usuario: Number(fk_usuario),
        fk_agencia: Number(fk_agencia),
        veiculo_placa,
        dia: new Date(dia),
        hora_marcada,
        hora_inicio,
        hora_fim,
        distancia_km: parseFloat(distancia_km),
        consumo_kml: parseFloat(consumo_kml),
        valor: parseFloat(valor),
      },
    });
    res.json(rota);
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ message: 'Rota não encontrada.' });
    if (e.code === 'P2003') return res.status(409).json({ message: 'Usuário, agência ou veículo não encontrado.' });
    res.status(500).json({ message: 'Erro ao atualizar rota.' });
  }
});
 
// Excluir
router.delete('/:id', async (req, res) => {
  const id = Number(req.params.id);
  try {
    // Remove custo vinculado antes (FK constraint)
    await prisma.custo.deleteMany({ where: { fk_rota: id } });
    await prisma.rota.delete({ where: { id } });
    res.json({ message: 'Rota excluída com sucesso.' });
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ message: 'Rota não encontrada.' });
    res.status(500).json({ message: 'Erro ao excluir rota.' });
  }
});
 
module.exports = router;