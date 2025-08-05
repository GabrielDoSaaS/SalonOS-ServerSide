const Establishment = require('../models/Establishment');
const User = require('../models/User');

const createEstablishment = async (req, res) => {
    if (req.user.role !== 'establishment') {
        return res.status(403).json({ message: 'Apenas estabelecimentos podem criar perfis.' });
    }
    if (req.user.establishmentId) {
        return res.status(409).json({ message: 'Este usuário já possui um estabelecimento associado.' });
    }

    const { name, address, phone, description } = req.body;

    try {
        const newEstablishment = new Establishment({
            name,
            address,
            phone,
            description,
            ownerId: req.user.userId
        });
        await newEstablishment.save();

        await User.findByIdAndUpdate(req.user.userId, { establishmentId: newEstablishment._id });

        res.status(201).json({
            message: 'Perfil de estabelecimento criado com sucesso!',
            establishment: newEstablishment,
            publicLink: newEstablishment.publicLink
        });
    } catch (error) {
        console.error('Erro ao criar estabelecimento:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};

const getEstablishment = async (req, res) => {
    try {
        const establishment = await Establishment.findById(req.params.id);

        if (!establishment) {
            return res.status(404).json({ message: 'Estabelecimento não encontrado.' });
        }

        if (req.user.role === 'establishment' && req.user.userId.toString() !== establishment.ownerId.toString()) {
            return res.status(403).json({ message: 'Acesso negado.' });
        }
        if (req.user.role === 'employee' && req.user.establishmentId.toString() !== establishment._id.toString()) {
            return res.status(403).json({ message: 'Acesso negado.' });
        }

        res.json(establishment);
    } catch (error) {
        console.error('Erro ao obter estabelecimento:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};

const updateEstablishment = async (req, res) => {
    try {
        const establishment = await Establishment.findById(req.params.id);

        if (!establishment) {
            return res.status(404).json({ message: 'Estabelecimento não encontrado.' });
        }

        if (req.user.role !== 'establishment' || req.user.userId.toString() !== establishment.ownerId.toString()) {
            return res.status(403).json({ message: 'Acesso negado. Apenas o proprietário pode atualizar.' });
        }

        const updatedEstablishment = await Establishment.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );

        res.json({ message: 'Perfil de estabelecimento atualizado com sucesso!', establishment: updatedEstablishment });
    } catch (error) {
        console.error('Erro ao atualizar estabelecimento:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};

module.exports = {
    createEstablishment,
    getEstablishment,
    updateEstablishment
};