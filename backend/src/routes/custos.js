const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Rotas SEM custo calculado
router.get('/pendentes', async (req, res) => {
  try {
    const rotas = await prisma.rota.findMany({
      where: { custo: null },
      include: {
        agencia: { select: { id: true, nome: true } },
        usuario: { select: { id: true, nome: true } },
      },
      orderBy: { dia: 'desc' },
    });
    res.json(rotas);
  } catch (e) {
    res.status(500).json({ message: 'Erro ao buscar rotas pendentes.' });
  }
});

// Rotas COM custo calculado
router.get('/calculados', async (req, res) => {
  try {
    const custos = await prisma.custo.findMany({
      include: {
        rota: {
          include: {
            agencia: { select: { id: true, nome: true } },
            usuario: { select: { id: true, nome: true } },
          },
        },
      },
      orderBy: { rota: { dia: 'desc' } },
    });
    res.json(custos);
  } catch (e) {
    res.status(500).json({ message: 'Erro ao buscar custos.' });
  }
});

// Calcular e salvar custo de uma rota
router.post('/', async (req, res) => {
  const { fk_rota, preco_combustivel } = req.body;
  if (!fk_rota || !preco_combustivel) {
    return res.status(400).json({ message: 'fk_rota e preco_combustivel são obrigatórios.' });
  }
  try {
    const rota = await prisma.rota.findUnique({ where: { id: Number(fk_rota) } });
    if (!rota) return res.status(404).json({ message: 'Rota não encontrada.' });

    const litros = rota.distancia_km / rota.consumo_kml;
    const custo_total = litros * parseFloat(preco_combustivel);

    const custo = await prisma.custo.create({
      data: {
        fk_rota: Number(fk_rota),
        preco_combustivel: parseFloat(preco_combustivel),
        custo_total: parseFloat(custo_total.toFixed(2)),
      },
    });
    res.status(201).json(custo);
  } catch (e) {
    if (e.code === 'P2002') return res.status(409).json({ message: 'Custo já calculado para esta rota.' });
    res.status(500).json({ message: 'Erro ao calcular custo.' });
  }
});

// Editar preço do combustível e recalcular
router.put('/:fk_rota', async (req, res) => {
  const fk_rota = Number(req.params.fk_rota);
  const { preco_combustivel } = req.body;
  try {
    const rota = await prisma.rota.findUnique({ where: { id: fk_rota } });
    if (!rota) return res.status(404).json({ message: 'Rota não encontrada.' });

    const litros = rota.distancia_km / rota.consumo_kml;
    const custo_total = litros * parseFloat(preco_combustivel);

    const custo = await prisma.custo.update({
      where: { fk_rota },
      data: {
        preco_combustivel: parseFloat(preco_combustivel),
        custo_total: parseFloat(custo_total.toFixed(2)),
      },
    });
    res.json(custo);
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ message: 'Custo não encontrado.' });
    res.status(500).json({ message: 'Erro ao recalcular custo.' });
  }
});

// Excluir custo (volta rota para pendente)
router.delete('/:fk_rota', async (req, res) => {
  try {
    await prisma.custo.delete({ where: { fk_rota: Number(req.params.fk_rota) } });
    res.json({ message: 'Custo removido.' });
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ message: 'Custo não encontrado.' });
    res.status(500).json({ message: 'Erro ao remover custo.' });
  }
});

module.exports = router;