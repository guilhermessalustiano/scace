const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes     = require('./routes/auth');
const usuariosRoutes = require('./routes/usuarios');
const veiculosRoutes = require('./routes/veiculos');
const agenciasRoutes = require('./routes/agencias');
const rotasRoutes    = require('./routes/rotas');
const custosRoutes   = require('./routes/custos');
const dashboardRoutes = require('./routes/dashboard');

const authMiddleware = require('./../middleware/auth');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Rota pública (sem autenticação)
app.use('/api', authRoutes);

// Rotas protegidas
app.use('/api/usuarios',  authMiddleware, usuariosRoutes);
app.use('/api/veiculos',  authMiddleware, veiculosRoutes);
app.use('/api/agencias',  authMiddleware, agenciasRoutes);
app.use('/api/rotas',     authMiddleware, rotasRoutes);
app.use('/api/custos',    authMiddleware, custosRoutes);
app.use('/api/dashboard', authMiddleware, dashboardRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Backend rodando na porta ${PORT}`);
});
