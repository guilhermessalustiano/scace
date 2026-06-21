const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const SECRET = process.env.JWT_SECRET;

async function login(req, res) {
  const { username, senha } = req.body;

  if (!username || !senha) {
    return res.status(400).json({ erro: 'Preencha todos os campos.' });
  }

  const usuario = await prisma.usuario.findUnique({
    where: { username },
  });

  if (!usuario) {
    return res.status(401).json({ erro: 'Usuário ou senha inválidos.' });
  }

  const senhaCorreta = await bcrypt.compare(senha, usuario.senha_hash);

  if (!senhaCorreta) {
    return res.status(401).json({ erro: 'Usuário ou senha inválidos.' });
  }

  const token = jwt.sign(
    { id: usuario.id, username: usuario.username, nome: usuario.nome, email: usuario.email },
    SECRET,
    { expiresIn: '30m' }
  );

  res.json({
    token,
    usuario: {
      id: usuario.id,
      username: usuario.username,
      nome: usuario.nome,
      email: usuario.email,
    },
  });
}

module.exports = { login };
