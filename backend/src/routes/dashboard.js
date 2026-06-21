const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET /api/dashboard?mes=2026-06
router.get('/', async (req, res) => {
  try {
    const { mes } = req.query; // formato esperado: "YYYY-MM"

    let referencia;
    if (mes && /^\d{4}-\d{2}$/.test(mes)) {
      referencia = mes;
    } else {
      const hoje = new Date();
      referencia = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
    }

    const [ano, mesNum] = referencia.split('-').map(Number);

    // Intervalo do mês: do dia 1 ao último dia (exclusivo no início do próximo mês)
    const inicio = new Date(ano, mesNum - 1, 1);
    const fim = new Date(ano, mesNum, 1); // primeiro dia do mês seguinte

    // Busca todas as rotas do mês com o custo relacionado e a agência
    const rotas = await prisma.rota.findMany({
      where: {
        dia: {
          gte: inicio,
          lt: fim,
        },
      },
      include: {
        custo: true,
        agencia: true,
      },
    });

    // --- Entregas ---
    const entregasRealizadas = rotas.length;

    // Ranking de agências (quantidade de rotas por agência)
    const contagemPorAgencia = {};
    for (const rota of rotas) {
      const nomeAgencia = rota.agencia?.nome || 'Desconhecida';
      contagemPorAgencia[nomeAgencia] = (contagemPorAgencia[nomeAgencia] || 0) + 1;
    }
    const rankingAgencias = Object.entries(contagemPorAgencia)
      .map(([nome, quantidade]) => ({ nome, quantidade }))
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 5); // top 5

    // --- Combustível ---
    const totalKm = rotas.reduce((soma, r) => soma + (r.distancia_km || 0), 0);

    const rotasComConsumo = rotas.filter((r) => r.consumo_kml != null);
    const mediaConsumo =
      rotasComConsumo.length > 0
        ? rotasComConsumo.reduce((soma, r) => soma + r.consumo_kml, 0) / rotasComConsumo.length
        : 0;

    const gastoCombustivel = rotas.reduce(
      (soma, r) => soma + (r.custo?.custo_total || 0),
      0
    );

    // --- Financeiro ---
    const faturamentoBruto = rotas.reduce((soma, r) => soma + (r.valor || 0), 0);
    const faturamentoLiquido = faturamentoBruto - gastoCombustivel;

    res.json({
      referencia, // ex: "2026-06"
      entregas: {
        realizadas: entregasRealizadas,
        rankingAgencias,
      },
      combustivel: {
        totalKm: Number(totalKm.toFixed(2)),
        mediaConsumoKml: Number(mediaConsumo.toFixed(2)),
        gastoTotal: Number(gastoCombustivel.toFixed(2)),
      },
      financeiro: {
        faturamentoBruto: Number(faturamentoBruto.toFixed(2)),
        faturamentoLiquido: Number(faturamentoLiquido.toFixed(2)),
      },
    });
  } catch (error) {
    console.error('Erro ao buscar dados do dashboard:', error);
    res.status(500).json({ error: 'Erro ao buscar dados do dashboard' });
  }
});

module.exports = router;