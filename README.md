# SalonOS-ServerSide ✂️
## Este é o BackEnd da aplicação. Caso queira visualizar o repositório do FrontEnd, acesse: https://github.com/GabrielDoSaaS/SalonOS-ClientSide
**SalonOS** é um SaaS dedicado a ajudar barbearias a simplificar:
 -  Clientes agendarem seus atendimentos
 -  Gerenciamento de funcionários e valores de seus serviços
 -  Exigir pagamento antecipado na plataforma para reservar horário


### Tecnologias utilizadas
- Node.js + Express 
- MongoDB + Mongoose
- JsonWebToken
- Sdk do Mercado Pago

## 📡 API Reference

### Autenticação

`POST /api/register`
```json
// Request

{
  "email": "exampleemail@gmail.com",
  "password": "senha123",
  "role": "your-role",
  "establishmentId": "establishmentId"
}

// Response (400)

{
  "message": "Email, senha e papel são obrigatórios."
}

{
  "message": "Funcionários devem ser associados a um estabelecimento existente."
}

// Response (409)

{
  "message": "Usuário com este email já existe."
}

// Response (500)

{
  "message": "Erro interno do servidor."
}

// Response (201)

{
  "message": "Usuário registrado com sucesso!",
  "userId": {
                 "email": "emailexample@gmail.com",
                 "role": "your-role",
                 "establishmentId": "establishmentId",
                 "planoAtivo": false,
                 "dataExpiracaoPlano": "date"
            }
}

```
`POST /api/login`
```json
// Request

{
  "email": "emailexample@gmail.com",
  "password": "senha123"
}

// Response (400)

{
  "message": "Credenciais inválidas."
}

// Response (500)

{
  "message": "Erro interno do servidor."
}

// Response (200)

{
 "message": "Login bem-sucedido!",
 "token": "tokenJWT",
 "role": "role",
 "establishmentId": "establishmentId",
 "planoAtivo": "planoAtivo",
 "dataExpiracaoPlano": "user.dataExpiracaoPlano"
}



