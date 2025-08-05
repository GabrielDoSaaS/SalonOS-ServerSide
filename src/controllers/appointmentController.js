const Appointment = require('../models/Appointment');
const Establishment = require('../models/Establishment');
const Employee = require('../models/Employee');
const Service = require('../models/Service');
const Availability = require('../models/Availability');
const moment = require('moment');
const { Preference, Payment } = require('mercadopago');
const client = require('../config/mercadopago');

const preferenceService = new Preference(client);
const paymentService = new Payment(client);

const getPublicEstablishmentDetails = async (req, res) => {
    try {
        const establishment = await Establishment.findById(req.params.establishmentId);
        if (!establishment) {
            return res.status(404).json({ message: 'Estabelecimento não encontrado.' });
        }
        const services = await Service.find({ establishmentId: req.params.establishmentId });
        const employees = await Employee.find({ establishmentId: req.params.establishmentId });
        res.json({ establishment, services, employees });
    } catch (error) {
        console.error('Erro ao obter detalhes públicos do estabelecimento:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};

const getAvailableTimes = async (req, res) => {
    const { employeeId, date } = req.params;
    const selectedDate = moment(date).startOf('day');

    try {
        const employeeAvailability = await Availability.findOne({ employeeId: employeeId });
        if (!employeeAvailability) {
            return res.status(404).json({ message: 'Disponibilidade não configurada para este funcionário.' });
        }

        const dayOfWeek = selectedDate.day();
        const dayAvailability = employeeAvailability.days.find(d => d.dayOfWeek === dayOfWeek);

        if (!dayAvailability) {
            return res.json({ availableTimes: [], message: 'Funcionário não disponível neste dia da semana.' });
        }

        const existingAppointments = await Appointment.find({
            employeeId: employeeId,
            appointmentDate: {
                $gte: selectedDate.toDate(),
                $lt: moment(selectedDate).endOf('day').toDate()
            },
            status: { $in: ['pending_payment', 'confirmed'] }
        }).populate('serviceIds', 'duration');

        const bookedSlots = [];
        existingAppointments.forEach(appointment => {
            const start = moment(appointment.appointmentDate);
            const totalDuration = appointment.serviceIds.reduce((sum, service) => sum + service.duration, 0);
            const end = moment(start).add(totalDuration, 'minutes');
            bookedSlots.push({ start, end });
        });

        const availableTimes = [];
        dayAvailability.intervals.forEach(interval => {
            let currentSlot = moment(selectedDate).hour(moment(interval.start, 'HH:mm').hour()).minute(moment(interval.start, 'HH:mm').minute());
            const endOfInterval = moment(selectedDate).hour(moment(interval.end, 'HH:mm').hour()).minute(moment(interval.end, 'HH:mm').minute());

            if (currentSlot.isBefore(moment())) {
                currentSlot = moment();
                const remainder = currentSlot.minute() % 30;
                if (remainder !== 0) {
                    currentSlot.add(30 - remainder, 'minutes');
                }
            }

            while (currentSlot.isBefore(endOfInterval)) {
                const potentialEndTime = moment(currentSlot).add(30, 'minutes');

                if (potentialEndTime.isAfter(endOfInterval)) {
                    break;
                }

                let isConflict = false;
                for (const booked of bookedSlots) {
                    if (currentSlot.isBefore(booked.end) && potentialEndTime.isAfter(booked.start)) {
                        isConflict = true;
                        break;
                    }
                }

                if (!isConflict) {
                    availableTimes.push(currentSlot.format('HH:mm'));
                }
                currentSlot = potentialEndTime;
            }
        });

        res.json({ availableTimes });

    } catch (error) {
        console.error('Erro ao verificar horários disponíveis:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};

const initiatePayment = async (req, res) => {
    const { establishmentId, employeeId, serviceIds, clientName, clientPhone, appointmentDate, redirectBaseUrl } = req.body;

    if (!establishmentId || !employeeId || !serviceIds || serviceIds.length === 0 || !clientName || !clientPhone || !appointmentDate || !redirectBaseUrl) {
        return res.status(400).json({ message: 'Todos os campos de agendamento e serviços são obrigatórios, incluindo redirectBaseUrl.' });
    }

    try {
        const establishment = await Establishment.findById(establishmentId);
        const employee = await Employee.findById(employeeId);
        const services = await Service.find({ _id: { $in: serviceIds } });

        if (!establishment || !employee || services.length !== serviceIds.length ||
            employee.establishmentId.toString() !== establishmentId.toString() ||
            services.some(s => s.establishmentId.toString() !== establishmentId.toString())) {
            return res.status(400).json({ message: 'Dados de agendamento inválidos (estabelecimento, funcionário ou serviços não encontrados/associados).' });
        }

        let totalDuration = 0;
        let totalAmount = 0;
        services.forEach(service => {
            totalDuration += service.duration;
            totalAmount += service.price;
        });

        const requestedMoment = moment(appointmentDate);
        const dayOfWeek = requestedMoment.day();
        const employeeAvailability = await Availability.findOne({ employeeId: employeeId });

        if (!employeeAvailability) {
            return res.status(400).json({ message: 'Disponibilidade não configurada para este funcionário.' });
        }

        const dayAvailability = employeeAvailability.days.find(d => d.dayOfWeek === dayOfWeek);
        if (!dayAvailability) {
            return res.status(400).json({ message: 'Funcionário não disponível neste dia da semana.' });
        }

        let isTimeWithinAvailability = false;
        for (const interval of dayAvailability.intervals) {
            const intervalStart = moment(appointmentDate).hour(moment(interval.start, 'HH:mm').hour()).minute(moment(interval.start, 'HH:mm').minute());
            const intervalEnd = moment(appointmentDate).hour(moment(interval.end, 'HH:mm').hour()).minute(moment(interval.end, 'HH:mm').minute());
            const appointmentEnd = moment(requestedMoment).add(totalDuration, 'minutes');

            if (requestedMoment.isSameOrAfter(intervalStart) && appointmentEnd.isSameOrBefore(intervalEnd)) {
                isTimeWithinAvailability = true;
                break;
            }
        }

        if (!isTimeWithinAvailability) {
            return res.status(409).json({ message: 'Horário fora da disponibilidade do funcionário.' });
        }

        const existingAppointments = await Appointment.find({
            employeeId: employeeId,
            appointmentDate: {
                $gte: moment(requestedMoment).subtract(totalDuration, 'minutes').toDate(),
                $lt: moment(requestedMoment).add(totalDuration, 'minutes').toDate()
            },
            status: { $in: ['pending_payment', 'confirmed'] }
        }).populate('serviceIds', 'duration');

        for (const existingApp of existingAppointments) {
            const existingAppStart = moment(existingApp.appointmentDate);
            const existingAppTotalDuration = existingApp.serviceIds.reduce((sum, service) => sum + service.duration, 0);
            const existingAppEnd = moment(existingAppStart).add(existingAppTotalDuration, 'minutes');

            if (requestedMoment.isBefore(existingAppEnd) && moment(requestedMoment).add(totalDuration, 'minutes').isAfter(existingAppStart)) {
                return res.status(409).json({ message: 'Horário indisponível para este funcionário devido a outro agendamento. Por favor, escolha outro.' });
            }
        }

        const newAppointment = new Appointment({
            establishmentId,
            employeeId,
            serviceIds,
            clientName,
            clientPhone,
            appointmentDate: requestedMoment.toDate(),
            totalAmount: totalAmount,
            status: 'pending_payment'
        });
        await newAppointment.save();

        const preference = await preferenceService.create({
            body: {
                items: services.map(s => ({
                    title: s.name,
                    quantity: 1,
                    unit_price: parseFloat(s.price.toFixed(2)),
                    currency_id: "BRL"
                })),
                payer: {
                    name: clientName,
                    email: "test_user_123@test.com"
                },
                back_urls: {
                    success: `${redirectBaseUrl}/payment-success`,
                    failure: `${redirectBaseUrl}/payment-failure`,
                    pending: `${redirectBaseUrl}/payment-pending`
                },
                auto_return: "approved",
                external_reference: newAppointment._id.toString(),
                notification_url: `${req.protocol}://${req.get('host')}/api/mercadopago/webhook`
            }
        });

        res.status(200).json({
            message: 'Agendamento iniciado. Redirecione para o Mercado Pago para completar o pagamento.',
            paymentLink: preference.init_point,
            appointmentId: newAppointment._id
        });

    } catch (error) {
        console.error('Erro ao iniciar agendamento e pagamento:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};

const getEstablishmentAppointments = async (req, res) => {
    if (req.user.establishmentId.toString() !== req.params.establishmentId.toString()) {
        return res.status(403).json({ message: 'Acesso negado.' });
    }

    try {
        const appointments = await Appointment.find({ establishmentId: req.params.establishmentId })
            .populate('employeeId', 'name')
            .populate('serviceIds', 'name price');
        res.json(appointments);
    } catch (error) {
        console.error('Erro ao obter agendamentos:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};

const updateAppointmentStatus = async (req, res) => {
    const { status } = req.body;
    if (!['pending_payment', 'confirmed', 'completed', 'cancelled'].includes(status)) {
        return res.status(400).json({ message: 'Status inválido.' });
    }

    try {
        const appointment = await Appointment.findById(req.params.id);
        if (!appointment) {
            return res.status(404).json({ message: 'Agendamento não encontrado.' });
        }

        if (req.user.establishmentId.toString() !== appointment.establishmentId.toString()) {
            return res.status(403).json({ message: 'Acesso negado.' });
        }

        appointment.status = status;
        await appointment.save();
        res.json({ message: 'Status do agendamento atualizado com sucesso!', appointment });
    } catch (error) {
        console.error('Erro ao atualizar status do agendamento:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};

module.exports = {
    getPublicEstablishmentDetails,
    getAvailableTimes,
    initiatePayment,
    getEstablishmentAppointments,
    updateAppointmentStatus
};