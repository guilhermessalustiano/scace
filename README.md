# SCACE - Sistema de Caślculo de Custo de Entrega

Sistema web desenvolvido com o objetivo de facilitar o calculo de custos para entregadores que atuam em plataformas como Mercado Livre, Shopee, IFood, 99 e dentre outras. Permite gerenciar agencias, veiculos, usuarios e rotas, alem de permitir calcular o gasto de combustivel de cada rota realizada.

## Funcionalidades

- Controle de usuarios
- Gerenciamento de veiculos disponiveis
- Cadastro de agencias de retirada de mercadorias
- Controle de rotas realizadas
- Calculo de custo de combustivel por rota

## Tecnologias

| Camada     | Tecnologia                        |
|------------|-----------------------------------|
| Frontend   | React, Vite, Tailwind CSS v4, TanStack Table, Axios |
| Backend    | Node.js, Express, Prisma ORM, JWT, bcrypt |
| Banco      | MySQL / MariaDB                   |
| Produção   | Nginx, PM2                        |

## Instalaçao

### Requisitos:

- **Node.js** 18 ou superior (recomendado 24)
- **MariaDB** 10.6 ou superior (recomendado 10.11) OU MySQL 8 ou Superior
- **Nginx** (para servir o frontend em produçao)
- **PM2** (para produção): `npm install -g pm2`

### Clonagem do repositorio

```bash
git clone https://github.com/seu-usuario/scace.git
cd scace
```

### Configuraçao do Backend

```bash
cd backend
npm install
cp .env.example .env   # edite com suas credenciais de banco e JWT_SECRET
npx prisma migrate deploy
npx prisma generate
npm start              # ou: pm2 start index.js --name scace-backend
```

### Configuracao do Frontend

```bash
cd ../frontend
npm install
npm run build          # gera a pasta dist/
```

### Configuraçao do servidor web Nginx

Apontar para a pasta `frontend/dist` e fazer o proxy de `/api` para `http://localhost:3001`.