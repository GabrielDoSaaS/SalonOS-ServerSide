const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

const registerUser = async (req, res) => {
    const { email, password, role, establishmentId } = req.body;

    if (!email || !password || !role) {
        return res.status(400).json({ message: 'Email, senha e papel são obrigatórios.' });
    }

    if (role === 'employee' && !establishmentId) {
        return res.status(400).json({ message: 'Funcionários devem ser associados a um estabelecimento existente.' });
    }

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ message: 'Usuário com este email já existe.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ email, password: hashedPassword, role, establishmentId: role === 'employee' ? establishmentId : null });
        await newUser.save();

        res.status(201).json({ message: 'Usuário registrado com sucesso!', userId: newUser._id });
    } catch (error) {
        console.error('Erro ao registrar usuário:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};

const loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Credenciais inválidas.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Credenciais inválidas.' });
        }

        const token = jwt.sign(
            {
                userId: user._id,
                email: user.email,
                role: user.role,
                establishmentId: user.establishmentId,
                planoAtivo: user.planoAtivo,
                dataExpiracaoPlano: user.dataExpiracaoPlano
            },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.json({
            message: 'Login bem-sucedido!',
            token,
            role: user.role,
            establishmentId: user.establishmentId,
            planoAtivo: user.planoAtivo,
            dataExpiracaoPlano: user.dataExpiracaoPlano
        });
    } catch (error) {
        console.error('Erro ao fazer login:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};

module.exports = {
    registerUser,
    loginUser
};