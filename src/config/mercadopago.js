const { MercadoPagoConfig } = require('mercadopago');

const MERCADOPAGO_ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN;

const client = new MercadoPagoConfig({
    accessToken: MERCADOPAGO_ACCESS_TOKEN,
    options: {
        timeout: 5000
    }
});

module.exports = client;