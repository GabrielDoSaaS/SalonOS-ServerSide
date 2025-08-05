const Employee = require('../models/Employee');

const addEmployee = async (req, res) => {
    if (req.user.role !== 'establishment') {
        return res.status(403).json({ message: 'Apenas estabelecimentos podem adicionar funcionários.' });
    }
    if (!req.user.establishmentId) {
        return res.status(400).json({ message: 'O usuário não está associado a um estabelecimento.' });
    }

    const { name, email, phone, userId } = req.body;

    try {
        const newEmployee = new Employee({
            name,
            email,
            phone,
            establishmentId: req.user.establishmentId,
            userId: userId || null
        });
        await newEmployee.save();
        res.status(201).json({ message: 'Funcionário adicionado com sucesso!', employee: newEmployee });
    } catch (error) {
        console.error('Erro ao adicionar funcionário:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};

const getEstablishmentEmployees = async (req, res) => {
    if (req.user.establishmentId.toString() !== req.params.establishmentId.toString()) {
        return res.status(403).json({ message: 'Acesso negado.' });
    }

    try {
        const employees = await Employee.find({ establishmentId: req.params.establishmentId });
        res.json(employees);
    } catch (error) {
        console.error('Erro ao obter funcionários:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};

const updateEmployee = async (req, res) => {
    try {
        const employee = await Employee.findById(req.params.id);
        if (!employee) {
            return res.status(404).json({ message: 'Funcionário não encontrado.' });
        }

        if (req.user.role !== 'establishment' || req.user.establishmentId.toString() !== employee.establishmentId.toString()) {
            return res.status(403).json({ message: 'Acesso negado. Apenas o proprietário pode atualizar funcionários.' });
        }

        const updatedEmployee = await Employee.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        res.json({ message: 'Funcionário atualizado com sucesso!', employee: updatedEmployee });
    } catch (error) {
        console.error('Erro ao atualizar funcionário:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};

const deleteEmployee = async (req, res) => {
    try {
        const employee = await Employee.findById(req.params.id);
        if (!employee) {
            return res.status(404).json({ message: 'Funcionário não encontrado.' });
        }

        if (req.user.role !== 'establishment' || req.user.establishmentId.toString() !== employee.establishmentId.toString()) {
            return res.status(403).json({ message: 'Acesso negado. Apenas o proprietário pode deletar funcionários.' });
        }

        await Employee.findByIdAndDelete(req.params.id);
        res.json({ message: 'Funcionário deletado com sucesso!' });
    } catch (error) {
        console.error('Erro ao deletar funcionário:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};

module.exports = {
    addEmployee,
    getEstablishmentEmployees,
    updateEmployee,
    deleteEmployee
};