import { calculateBillAmount } from './billing';

export const MOCK_USERS = [
    { id: 1, username: 'admin', password: 'password', role: 'admin', name: 'Administrator' },
    { id: 2, username: 'teller', password: 'password', role: 'teller', name: 'Maria Teller' },
    { id: 3, username: 'teller@gmail.com', password: 'admin123', role: 'teller', name: 'New Teller' },
];

const NAMES = [
    "Juan Dela Cruz", "Maria Santos", "Jose Rizal", "Andres Bonifacio", "Gabriela Silang",
    "Emilio Aguinaldo", "Teresa Magbanua", "Melchora Aquino", "Gregorio del Pilar", "Apolinario Mabini",
    "Marcelo H. del Pilar", "Francisco Balagtas", "Graciano Lopez Jaena", "Antonio Luna", "Juan Luna",
    "Josefa Llanes Escoda", "Teodora Alonso", "Demetrio Tuason", "Pedro Paterno", "Mariano Ponce",
    "Epifanio de los Santos", "Fernando Amorsolo", "Botong Francisco"
];

const BARANGAYS = [
    "Poblacion I", "Poblacion II", "Poblacion III", "Silangan Kabubuhayan", "Calumpang",
    "Buboy", "Banca-Banca", "Abo", "Alibungbungan", "Alumbrado", "Balayong",
    "Balimbing", "Balinacon", "Bambang", "Banago", "Banca-banca", "Bangcuro",
    "Banilad", "Bayaquitos", "Buboy", "Buenavista", "Buhanginan", "Bukal"
];

// Generate 25 Clients
export const MOCK_CLIENTS = NAMES.map((name, index) => ({
    id: 1000 + index,
    name: name,
    meterNo: `M-2026-${String(1000 + index).slice(1)}`,
    type: index % 5 === 0 ? 'commercial' : 'residential', // 20% commercial
    address: `Brgy. ${BARANGAYS[index % BARANGAYS.length]}, Nagcarlan`,
    status: index % 10 === 0 ? 'disconnected' : 'active', // 10% disconnected
    email: `${name.toLowerCase().replace(/\s/g, '')}@gmail.com`,
    contactNo: `09${String(Math.floor(Math.random() * 1000000000)).padStart(9, '0')}`
}));

// Generate Bills for these clients (Last 3 months)
export const MOCK_BILLS = [];
const MONTHS = [
    { id: '2026-04', label: 'April 2026', due: '2026-04-15' },
    { id: '2026-05', label: 'May 2026', due: '2026-05-15' },
    { id: '2026-06', label: 'June 2026', due: '2026-06-15' }
];

MOCK_CLIENTS.forEach(client => {
    MONTHS.forEach(month => {
        const isPaid = Math.random() > 0.3; // 70% chance paid
        const consumption = Math.floor(Math.random() * 40) + 10; // 10-50 m3
        const amount = calculateBillAmount(client.type, consumption);

        MOCK_BILLS.push({
            id: `B-${client.id}-${month.id}`,
            clientId: client.id,
            date: month.id + '-01',
            month: month.label,
            dueDate: month.due,
            prevReading: 1000 + (Math.random() * 100),
            currReading: 1000 + (Math.random() * 100) + consumption,
            consumption: consumption,
            amount: amount,
            status: isPaid ? 'paid' : 'unpaid',
            paidAmount: isPaid ? amount : 0,
            paidDate: isPaid ? `${month.id}-${10 + Math.floor(Math.random() * 20)}` : null
        });
    });
});
