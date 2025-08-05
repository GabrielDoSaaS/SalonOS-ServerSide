const User = require('../models/User');
const Appointment = require('../models/Appointment');
const moment = require('moment');
const { PreApprovalPlan, PreApproval, Payment } = require('mercadopago');
const client = require('../config/mercadopago');

const preApprovalPlan = new PreApprovalPlan(client);
const preApproval = new PreApproval(client);
const paymentService = new Payment(client);

const createMonthlySubscription = async (req, res) => {
    if (!req.user.userId) {
        return res.status(400).json({ message: 'ID do usuário não encontrado no token.' });
    }

    const userId = req.user.userId;
    const { redirectBaseUrl } = req.body;

    if (!redirectBaseUrl) {
        return res.status(400).json({ message: 'A URL de redirecionamento (redirectBaseUrl) é obrigatória.' });
    }

    try {
        const response = await preApprovalPlan.create({
            body: {
                reason: "Assinatura Mensal de Serviço para Estabelecimento",
                auto_recurring: {
                    frequency: 1,
                    frequency_type: "months",
                    transaction_amount: 99.90,
                    currency_id: "BRL"
                },
                back_url: `${redirectBaseUrl}/subscription-status`,
                external_reference: `plano_mensal_user_${userId}`,
                status: "active"
            }
        });

        return res.json({ init_point: response.init_point });
    } catch (error) {
        console.error("Erro ao criar plano mensal:", error.message || error);
        return res.status(500).json({ message: "Erro ao criar plano mensal." });
    }
};

const createAnnualSubscription = async (req, res) => {
    if (!req.user.userId) {
        return res.status(400).json({ message: 'ID do usuário não encontrado no token.' });
    }

    const userId = req.user.userId;
    const { redirectBaseUrl } = req.body;

    if (!redirectBaseUrl) {
        return res.status(400).json({ message: 'A URL de redirecionamento (redirectBaseUrl) é obrigatória.' });
    }

    try {
        const response = await preApprovalPlan.create({
            body: {
                reason: "Assinatura Anual de Serviço para Estabelecimento",
                auto_recurring: {
                    frequency: 12,
                    frequency_type: "months",
                    transaction_amount: 700.00,
                    currency_id: "BRL"
                },
                back_url: `${redirectBaseUrl}/subscription-status`,
                external_reference: `plano_anual_user_${userId}`,
                status: "active"
            }
        });

        return res.json({ init_point: response.init_point });
    } catch (error) {
        console.error("Erro ao criar plano anual:", error.message || error);
        return res.status(500).json({ message: "Erro ao criar plano anual." });
    }
};

const handleWebhook = async (req, res) => {
    const { type, data } = req.body;

    console.log("Webhook recebido:", type, data);

    try {
        if (type === 'preapproval') {
            const preapprovalId = data.id;
            const preapprovalDetails = await preApproval.get({ id: preapprovalId });
            const externalReference = preapprovalDetails.external_reference;
            const status = preapprovalDetails.status;

            const userIdMatch = externalReference.match(/_(plano_mensal|plano_anual)_user_(.+)/);
            const userId = userIdMatch ? userIdMatch[2] : null;

            if (!userId) {
                console.warn("ID do usuário não encontrado no external_reference:", externalReference);
                return res.status(400).send("ID do usuário não encontrado.");
            }

            const user = await User.findById(userId);

            if (!user) {
                console.warn("Usuário não encontrado para o ID:", userId);
                return res.status(404).send("Usuário não encontrado.");
            }

            if (status === 'authorized') {
                user.planoAtivo = true;
                if (externalReference.includes('plano_mensal')) {
                    user.dataExpiracaoPlano = moment().add(1, 'months').toDate();
                } else if (externalReference.includes('plano_anual')) {
                    user.dataExpiracaoPlano = moment().add(12, 'months').toDate();
                }
                await user.save();
                console.log(`Plano ativado para o usuário ${user.email}. Data de expiração: ${user.dataExpiracaoPlano}`);
            } else if (['cancelled', 'paused', 'pending'].includes(status)) {
                user.planoAtivo = false;
                user.dataExpiracaoPlano = null;
                await user.save();
                console.log(`Plano do usuário ${user.email} atualizado para ${status}.`);
            }
        } else if (type === 'payment') {
            const paymentId = data.id;
            const paymentDetails = await paymentService.get({ id: paymentId });
            const paymentStatus = paymentDetails.status;
            const externalReference = paymentDetails.external_reference;

            console.log(`Webhook de pagamento: ID ${paymentId}, Status: ${paymentStatus}, External Ref: ${externalReference}`);

            if (externalReference && externalReference.length === 24 && paymentStatus === 'approved') {
                const appointment = await Appointment.findById(externalReference);
                if (appointment && appointment.status === 'pending_payment') {
                    appointment.status = 'confirmed';
                    appointment.paymentId = paymentId;
                    await appointment.save();
                    console.log(`Agendamento ${appointment._id} confirmado via pagamento aprovado.`);
                } else if (appointment && appointment.status === 'confirmed') {
                    console.log(`Agendamento ${appointment._id} já estava confirmado.`);
                } else {
                    console.warn(`Agendamento ${externalReference} não encontrado ou já processado.`);
                }
            } else if (externalReference && externalReference.length === 24 && ['rejected', 'cancelled'].includes(paymentStatus)) {
                const appointment = await Appointment.findById(externalReference);
                if (appointment && appointment.status === 'pending_payment') {
                    appointment.status = 'cancelled';
                    await appointment.save();
                    console.log(`Agendamento ${appointment._id} cancelado devido a pagamento ${paymentStatus}.`);
                }
            }
        }

        return res.status(200).send('Webhook recebido com sucesso.');
    } catch (error) {
        console.error("Erro ao processar webhook do Mercado Pago:", error.message || error);
        return res.status(500).send("Erro interno ao processar webhook.");
    }
};

module.exports = {
    createMonthlySubscription,
    createAnnualSubscription,
    handleWebhook
};