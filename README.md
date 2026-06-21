# SCACE - Sistema de Cálculo de Custo de Entrega

Sistema web desenvolvido com o objetivo de facilitar o cálculo de custos para entregadores que atuam em plataformas como Mercado Livre, Shopee, IFood, 99 e dentre outras. Permite gerenciar agências, veículos, usuários e rotas, além de permitir calcular o gasto de combust+ivel de cada rota realizada.

## Funcionalidades

- Controle de usuários
- Gerenciamento de veículos disponíveis
- Cadastro de agências de retirada de mercadorias
- Controle de rotas realizadas
- Cálculo de custo de combustível por rota

## Tecnologias

| Camada     | Tecnologia                        |
|------------|-----------------------------------|
| Frontend   | React, Vite, Tailwind CSS v4, TanStack Table, Axios |
| Backend    | Node.js, Express, Prisma ORM, JWT, bcrypt |
| Banco      | MySQL / MariaDB                   |
| Produção   | Nginx, PM2                        |

## Instalação

### Requisitos:

- **Node.js** 18 ou superior (recomendado 24)
- **MariaDB** 10.6 ou superior (recomendado 10.11) OU MySQL 8 ou superior
- **Nginx** (para servir o frontend em produçao)
- **PM2** (para produção): `npm install -g pm2`

### Clonagem do repositório

```bash
git clone https://github.com/guilhermessalustiano/scace.git
cd scace
```

### Configuração do Backend

```bash
cd backend
npm install
cp .env.example .env   # edite com suas credenciais de banco e JWT_SECRET
npx prisma migrate deploy
npx prisma generate
npm start              # ou: pm2 start index.js --name scace-backend
```

### Configuração do Frontend

```bash
cd ../frontend
npm install
npm run build          # gera a pasta dist/
```

### Configuração do servidor web Nginx

Apontar para a pasta `frontend/dist` e fazer o proxy de `/api` para `http://localhost:3001`.
