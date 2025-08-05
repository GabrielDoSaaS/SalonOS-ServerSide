const Availability = require('../models/Availability');
const Employee = require('../models/Employee');

const setAvailability = async (req, res) => {
    if (req.user.role !== 'establishment') {
        return res.status(403).json({ message: 'Apenas proprietários de estabelecimentos podem definir disponibilidade.' });
    }
    const { employeeId, days } = req.body;

    if (!employeeId || !days) {
        return res.status(400).json({ message: 'ID do funcionário e dias de disponibilidade são obrigatórios.' });
    }

    try {
        const employee = await Employee.findById(employeeId);
        if (!employee || employee.establishmentId.toString() !== req.user.establishmentId.toString()) {
            return res.status(403).json({ message: 'Funcionário não encontrado ou não pertence ao seu estabelecimento.' });
        }

        const availability = await Availability.findOneAndUpdate(
            { employeeId: employeeId },
            { $set: { days: days } },
            { upsert: true, new: true }
        );
        res.status(200).json({ message: 'Disponibilidade atualizada com sucesso!', availability });
    } catch (error) {
        console.error('Erro ao definir disponibilidade:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};

const getAvailability = async (req, res) => {
    try {
        const availability = await Availability.findOne({ employeeId: req.params.employeeId });
        if (!availability) {
            return res.status(404).json({ message: 'Disponibilidade não encontrada para este funcionário.' });
        }
        res.json(availability);
    } catch (error) {
        console.error('Erro ao obter disponibilidade:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};

module.exports = {
    setAvailability,
    getAvailability
};