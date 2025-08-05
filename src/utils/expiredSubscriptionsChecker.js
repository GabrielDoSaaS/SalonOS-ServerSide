const User = require('../models/User');

const checkExpiredSubscriptions = async () => {
    try {
        const usersExpirados = await User.find({
            role: 'establishment',
            planoAtivo: true,
            dataExpiracaoPlano: { $lte: new Date() }
        });

        for (const user of usersExpirados) {
            user.planoAtivo = false;
            user.dataExpiracaoPlano = null;
            await user.save();
            console.log(`Plano do usuário ${user.email} desativado por expiração.`);
        }
    } catch (error) {
        console.error("Erro ao verificar planos expirados:", error.message || error);
    }
};

module.exports = checkExpiredSubscriptions;