import { calculateBillAmount } from './billing';

export const MOCK_USERS = [
    { id: 1, username: 'admin', password: 'password', role: 'admin', name: 'Administrator' },
    { id: 2, username: 'teller', password: 'password', role: 'teller', name: 'Maria Teller' },
    { id: 3, username: 'teller@gmail.com', password: 'admin123', role: 'teller', name: 'New Teller' },
    { id: 4, username: 'superadmin@gmail.com', password: 'admin123', role: 'superadmin', name: 'Super Administrator' },
    { id: 5, username: 'admin@gmail.com', password: 'admin123', role: 'superadmin', name: 'General Administrator', avatar: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWlaIAAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDAAMCAgICAgMCAgIDAwMDBAYEBAQEBAgGBgUGCQgKCgkICQkKDA8MCgsOCwkJDRENDg8QEBEQCgwSExIQEw8QEBD/2wBDAQMDAwQDBAgEBAgQCwkLEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBD/wAARCAD3AMwDASIAAhEBAxEB/8QAHQABAAEFAQEBAAAAAAAAAAAAAAYEBQcICQIBA//EAFkQAAAFAQMECQ0NBgQDCQAAAAACAwQFBgEHEhETFCIIFSMyM0JikqIXISQxNENSU1VygsLSCRYlREVRY3ODk7Li8DVBVGFxsxgmdHU2kaNkgYSVoaTBw9T/xAAbAQEAAgMBAQAAAAAAAAAAAAAAAgYDBAUBB//EACwRAQABAwMCBQMEAwAAAAAAAAADAQIEBRITETIUISIjMUFCUgYVYvAzU3L/2gA7RhEBAQEBAAAAAAAAAAAAAAIAAAAAAAAAAAAAAAAAAAIe/reDjN03/AG/RHyOfT9X9P0fWtxH6on7Zf2W/rfR/g/mX3X3XvS/FfGfE/Zf3/CD+P8AbfAvPekAAsrreDjPD+j9EAAAAAAAAAAAAAAAAAAAAAAAB/9k=' },
];

const NAMES = [
    "Juan Miguel Santos Dela Cruz",
    "Maria Angelica Reyes Villanueva",
    "Jose Antonio Garcia Mendoza",
    "Ana Patricia Flores Navarro",
    "Mark Anthony Rivera Bautista",
    "Cristina Lourdes Aquino Salazar",
    "Daniel Roberto Cruz Montoya",
    "Ma. Teresa Lopez Fernandez",
    "Paolo Vincent Ramos Castillo",
    "Jasmine Nicole Torres Hidalgo",
    "Emmanuel Joseph Perez Dominguez",
    "Katrina Mae Delgado Soriano",
    "Francisco Lorenzo Medina Alcantara",
    "Rhea Ann Pineda Valdez",
    "Gabriel Luis Ortega Fajardo",
    "Clarisse Joy Santiago Robles",
    "Nathaniel Paul Miranda Escobar",
    "Isabella Grace Cojuangco Lim",
    "Ramon Alejandro Villamor Quiros",
    "Bianca Sofia Evangelista Moran"
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
    contactNo: `09${String(Math.floor(Math.random() * 1000000000)).padStart(9, '0')}`,
    paymentSchedule: ['Monthly', 'Weekly', 'Daily'][index % 3] // Distribute schedules for variety
}));

// Generate Bills for these clients (Last 3 months)
export const MOCK_BILLS = [];
const MONTHS = [
    { id: '2025-11', label: 'November 2025', due: '2025-11-15' },
    { id: '2025-12', label: 'December 2025', due: '2025-12-15' },
    { id: '2026-01', label: 'January 2026', due: '2026-01-15' }
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
            paidDate: isPaid ? `${month.id}-${10 + Math.floor(Math.random() * 20)}T${String(8 + Math.floor(Math.random() * 9)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}Z` : null
        });
    });
});
