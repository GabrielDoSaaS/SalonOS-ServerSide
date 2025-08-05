const Service = require('../models/Service');

const addService = async (req, res) => {
    if (req.user.role !== 'establishment') {
        return res.status(403).json({ message: 'Apenas estabelecimentos podem adicionar serviços.' });
    }
    if (!req.user.establishmentId) {
        return res.status(400).json({ message: 'O usuário não está associado a um estabelecimento.' });
    }

    const { name, price, duration } = req.body;

    try {
        const newService = new Service({
            name,
            price,
            duration,
            establishmentId: req.user.establishmentId
        });
        await newService.save();
        res.status(201).json({ message: 'Serviço adicionado com sucesso!', service: newService });
    } catch (error) {
        console.error('Erro ao adicionar serviço:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};

const getEstablishmentServices = async (req, res) => {
    if (req.user.establishmentId.toString() !== req.params.establishmentId.toString()) {
        return res.status(403).json({ message: 'Acesso negado.' });
    }

    try {
        const services = await Service.find({ establishmentId: req.params.establishmentId });
        res.json(services);
    } catch (error) {
        console.error('Erro ao obter serviços:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};

const updateService = async (req, res) => {
    try {
        const service = await Service.findById(req.params.id);
        if (!service) {
            return res.status(404).json({ message: 'Serviço não encontrado.' });
        }

        if (req.user.role !== 'establishment' || req.user.establishmentId.toString() !== service.establishmentId.toString()) {
            return res.status(403).json({ message: 'Acesso negado. Apenas o proprietário pode atualizar serviços.' });
        }

        const updatedService = await Service.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        res.json({ message: 'Serviço atualizado com sucesso!', service: updatedService });
    } catch (error) {
        console.error('Erro ao atualizar serviço:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};

const deleteService = async (req, res) => {
    try {
        const service = await Service.findById(req.params.id);
        if (!service) {
            return res.status(404).json({ message: 'Serviço não encontrado.' });
        }

        if (req.user.role !== 'establishment' || req.user.establishmentId.toString() !== service.establishmentId.toString()) {
            return res.status(403).json({ message: 'Acesso negado. Apenas o proprietário pode deletar serviços.' });
        }

        await Service.findByIdAndDelete(req.params.id);
        res.json({ message: 'Serviço deletado com sucesso!' });
    } catch (error) {
        console.error('Erro ao deletar serviço:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};

module.exports = {
    addService,
    getEstablishmentServices,
    updateService,
    deleteService
};