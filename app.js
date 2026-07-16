const { useState, useEffect } = React;

const App = () => {
    // --- ESTADOS GLOBALES ---
    const [userRole, setUserRole] = useState('cliente');
    const [view, setView] = useState('inicio_cliente');

    // Estados de las Mesas (POS)
    const [tables, setTables] = useState([
        { id: 1, number: 'Mesa 1', status: 'Disponible', orders: [] },
        { id: 2, number: 'Mesa 2', status: 'Ocupada', orders: [{ id: 4, name: 'Refresco Artesanal', price: 2.50, quantity: 2 }] },
        { id: 3, number: 'Mesa 3', status: 'Reservada', orders: [] },
        { id: 4, number: 'Mesa 4', status: 'En_Limpieza', orders: [] },
        { id: 5, number: 'Mesa 5', status: 'Disponible', orders: [] },
    ]);

    // Menú de platillos
    const [menu, setMenu] = useState([
        { id: 1, name: 'Hamburguesa Clásica', price: 8.50, rating: 4.8, image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=80', description: 'Carne de res 100%, queso cheddar, lechuga fresca, tomate y nuestra salsa secreta.' },
        { id: 2, name: 'Pizza Margarita', price: 12.00, rating: 4.9, image: 'https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?auto=format&fit=crop&w=400&q=80', description: 'Masa artesanal a la leña, salsa de tomate San Marzano, mozzarella fresca y albahaca.' },
        { id: 3, name: 'Ensalada César', price: 7.00, rating: 4.5, image: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?auto=format&fit=crop&w=400&q=80', description: 'Lechuga romana crujiente, crutones, queso parmesano y aderezo César casero.' },
        { id: 4, name: 'Refresco Artesanal', price: 2.50, rating: 4.2, image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=400&q=80', description: 'Bebida gasificada bien fría con toques frutales (Limón, Naranja, Cola).' },
    ]);

    // Reseñas Ficticias
    const customerReviews = [
        { id: 1, author: 'María Fernanda', comment: '¡La mejor hamburguesa que he probado! La aplicación para pedir desde la mesa es un éxito.', stars: '⭐⭐⭐⭐⭐' },
        { id: 2, author: 'Carlos Roberto', comment: 'La pizza Margarita tiene un sabor auténtico italiano. Muy recomendado para venir en familia.', stars: '⭐⭐⭐⭐⭐' },
        { id: 3, author: 'Ana López', comment: 'Excelente ambiente y el servicio es rapidísimo. Los precios son muy justos.', stars: '⭐⭐⭐⭐' },
    ];

    // Tickets de Cocina y Estado del Cliente
    const [kitchenTickets, setKitchenTickets] = useState([]);
    const [clientTable, setClientTable] = useState(null);
    const [clientCart, setClientCart] = useState([]);
    const [clientActiveTicketId, setClientActiveTicketId] = useState(null); // ID para rastrear el pedido actual del cliente
    const [selectedTable, setSelectedTable] = useState(null);

    // --- ESTADOS DE INTERFAZ (UX) ---
    const [toasts, setToasts] = useState([]); // Sistema de Notificaciones Toasts
    const [passwordModal, setPasswordModal] = useState({ isOpen: false, targetRole: '' }); // Modal de Contraseñas
    const [passwordInput, setPasswordInput] = useState('');
    const [receiptModal, setReceiptModal] = useState({ isOpen: false, data: null }); // Modal de Ticket de Pago (POS)

    // --- NUEVOS ESTADOS: PASARELA DE PAGO ---
    const [paymentModal, setPaymentModal] = useState({ isOpen: false, total: 0 });
    const [paymentStep, setPaymentStep] = useState('form'); // 'form' | 'processing' | 'success'
    const [cardDetails, setCardDetails] = useState({ number: '', name: '', expiry: '', cvv: '' });

    // Notificaciones Toasts
    const showToast = (message, type = 'success') => {
        const id = Date.now();
        setToasts(prevToasts => [...prevToasts, { id, message, type }]);
        setTimeout(() => {
            setToasts(prevToasts => prevToasts.filter(t => t.id !== id));
        }, 4000);
    };

    // ==========================================
    // FUNCIONES LÓGICAS (EMPLEADO / ADMIN / POS)
    // ==========================================
    const addNewTable = () => {
        const nextId = tables.length > 0 ? Math.max(...tables.map(t => t.id)) + 1 : 1;
        setTables([...tables, { id: nextId, number: `Mesa ${nextId}`, status: 'Disponible', orders: [] }]);
        showToast(`➕ Se ha creado la Mesa ${nextId} en el sistema.`, 'success');
    };

    const updateTableStatus = (id, newStatus) => {
        setTables(tables.map(t => t.id === id ? { ...t, status: newStatus } : t));
    };

    const addToOrderPOS = (item) => {
        const updatedTables = tables.map(t => {
            if (t.id === selectedTable.id) {
                const existingItem = t.orders.find(o => o.id === item.id);
                let newOrders = existingItem
                    ? t.orders.map(o => o.id === item.id ? { ...o, quantity: o.quantity + 1 } : o)
                    : [...t.orders, { ...item, quantity: 1 }];
                return { ...t, orders: newOrders, status: 'Ocupada' };
            }
            return t;
        });
        setTables(updatedTables);
        setSelectedTable(updatedTables.find(t => t.id === selectedTable.id));
        showToast(`🛒 Se agregó "${item.name}" a la ${selectedTable.number}.`, 'success');
    };

    const sendToKitchenPOS = () => {
        if (!selectedTable) return showToast("⚠️ Selecciona una mesa primero.", "warning");
        if (!selectedTable.orders || selectedTable.orders.length === 0) return showToast("⚠️ No puedes enviar una comanda vacía.", "warning");

        // 🛑 CANDADO DE SEGURIDAD (MESERO): Evitar enviar duplicados a cocina
        const isTableCooking = kitchenTickets.some(t => t.tableNumber === selectedTable.number && t.status !== 'entregado');
        if (isTableCooking) {
            return showToast("⚠️ Esta mesa ya tiene un pedido en cocina. Espera a que se entregue para enviar más.", "warning");
        }

        const newTicket = {
            id: Date.now(),
            tableNumber: selectedTable.number,
            items: JSON.parse(JSON.stringify(selectedTable.orders)),
            time: new Date().toLocaleTimeString(),
            status: 'recibido'
        };
        setKitchenTickets([...kitchenTickets, newTicket]);
        showToast(`👩‍🍳 Comanda de ${selectedTable.number} enviada a cocina.`, 'success');
    };

    const generateBill = () => {
        if (!selectedTable) return showToast("⚠️ Error: Ninguna mesa seleccionada.", "danger");
        if (!selectedTable.orders || selectedTable.orders.length === 0) return showToast("ℹ️ La mesa no tiene pedidos registrados.", "warning");

        const subtotal = selectedTable.orders.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
        const tax = subtotal * 0.12;
        const tip = subtotal * 0.10;
        const total = subtotal + tax + tip;

        setReceiptModal({
            isOpen: true,
            data: { tableId: selectedTable.id, tableName: selectedTable.number, orders: selectedTable.orders, subtotal, tax, tip, total }
        });
    };

    const confirmPaymentAndClearTable = () => {
        if (!receiptModal.data) return;
        const { tableId, tableName } = receiptModal.data;

        setTables(tables.map(t => t.id === tableId ? { ...t, status: 'En_Limpieza', orders: [] } : t));
        setSelectedTable(null);
        setReceiptModal({ isOpen: false, data: null });
        showToast(`✅ Cuenta cobrada con éxito. ${tableName} ahora está En Limpieza.`, 'success');
    };

    const addMenuItem = (e) => {
        e.preventDefault();
        const name = e.target.elements.name.value.trim();
        const price = parseFloat(e.target.elements.price.value);
        const description = e.target.elements.description.value.trim() || 'Platillo delicioso preparado al momento.';
        const image = e.target.elements.image.value.trim() || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80';

        setMenu([...menu, { id: Date.now(), name, price, description, image, rating: 5.0 }]);
        e.target.reset();
        showToast(`🍔 ¡"${name}" agregado al menú correctamente!`, 'success');
    };

    // ==========================================
    // FUNCIONES LÓGICAS (CLIENTE)
    // ==========================================
    const reserveTableAsClient = (table) => {
        if (table.status !== 'Disponible') return showToast("⚠️ Esta mesa no está disponible.", "warning");
        setTables(tables.map(t => t.id === table.id ? { ...t, status: 'Reservada' } : t));
        setClientTable({ ...table, status: 'Reservada' });
        showToast(`🎉 ¡Has reservado la ${table.number}!`, 'success');
        setView('menu_cliente');
    };

    const updateCartQuantity = (item, delta) => {
        setClientCart(prevCart => {
            const existingItem = prevCart.find(cartItem => cartItem.id === item.id);
            if (existingItem) {
                const newQuantity = existingItem.quantity + delta;
                if (newQuantity <= 0) {
                    showToast(`❌ Se eliminó "${item.name}" de tu carrito.`, 'warning');
                    return prevCart.filter(cartItem => cartItem.id !== item.id);
                }
                return prevCart.map(cartItem => cartItem.id === item.id ? { ...cartItem, quantity: newQuantity } : cartItem);
            } else {
                if (delta > 0) {
                    showToast(`🛒 "${item.name}" añadido al carrito.`, 'success');
                    return [...prevCart, { ...item, quantity: 1 }];
                }
                return prevCart;
            }
        });
    };

    const sendClientOrder = () => {
        if (!clientTable) return showToast("⚠️ Selecciona una mesa antes de ordenar.", "warning");
        if (!clientCart || clientCart.length === 0) return showToast("⚠️ Tu carrito está vacío.", "warning");

        // 🛑 CANDADO DE SEGURIDAD (CLIENTE): Evitar romper el rastreador enviando doble
        const isTableCooking = kitchenTickets.some(t => t.tableNumber === clientTable.number && t.status !== 'entregado');
        if (isTableCooking) {
            return showToast("⚠️ Ya tienes un pedido en preparación. Espera a recibirlo antes de pedir más.", "warning");
        }

        const ticketId = Date.now();
        const updatedTables = tables.map(t => {
            if (t.id === clientTable.id) {
                const mergedOrders = [...t.orders];
                clientCart.forEach(cartItem => {
                    const existing = mergedOrders.find(o => o.id === cartItem.id);
                    if (existing) existing.quantity += cartItem.quantity;
                    else mergedOrders.push({ ...cartItem });
                });
                return { ...t, orders: mergedOrders, status: 'Ocupada' };
            }
            return t;
        });

        setTables(updatedTables);
        const newTicket = {
            id: ticketId,
            tableNumber: clientTable.number,
            items: JSON.parse(JSON.stringify(clientCart)),
            time: new Date().toLocaleTimeString(),
            status: 'recibido'
        };
        setKitchenTickets([...kitchenTickets, newTicket]);
        setClientActiveTicketId(ticketId);
        setClientCart([]);
        showToast("👩‍🍳 ¡Pedido enviado a cocina! Empezamos a prepararlo ya.", 'success');
    };

    // --- PASARELA DE PAGO CLIENTE (SIMULADA) ---
    const openPaymentGateway = () => {
        const currentTableData = tables.find(t => t.id === clientTable.id);
        if (!currentTableData || currentTableData.orders.length === 0) {
            return showToast("⚠️ No tienes ningún pedido cargado en tu mesa aún.", "warning");
        }
        const subtotal = currentTableData.orders.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const total = subtotal + (subtotal * 0.12) + (subtotal * 0.10); // total con IVA + propina

        setPaymentModal({ isOpen: true, total });
        setPaymentStep('form');
        setCardDetails({ number: '', name: '', expiry: '', cvv: '' });
    };

    const handleCardNumberChange = (e) => {
        // Formato automático de 16 dígitos con espacios: XXXX XXXX XXXX XXXX
        let value = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
        let formatted = '';
        for (let i = 0; i < value.length && i < 16; i++) {
            if (i > 0 && i % 4 === 0) formatted += ' ';
            formatted += value[i];
        }
        setCardDetails({ ...cardDetails, number: formatted });
    };

    const handleExpiryChange = (e) => {
        // Formato automático para fecha de vencimiento: MM/AA
        let value = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
        if (value.length > 2) {
            value = value.slice(0, 2) + '/' + value.slice(2, 4);
        }
        setCardDetails({ ...cardDetails, expiry: value.slice(0, 5) });
    };

    const processPaymentSubmit = (e) => {
        e.preventDefault();
        setPaymentStep('processing');

        // Simulación de conexión bancaria de 2.5 segundos
        setTimeout(() => {
            setPaymentStep('success');
            // Liberamos la mesa del cliente y la dejamos "En Limpieza"
            setTables(tables.map(t => t.id === clientTable.id ? { ...t, status: 'En_Limpieza', orders: [] } : t));
        }, 2500);
    };

    const finishClientSession = () => {
        // Limpiamos todo el estado de la sesión del cliente al completar el pago
        setClientTable(null);
        setClientCart([]);
        setClientActiveTicketId(null);
        setPaymentModal({ isOpen: false, total: 0 });
        setView('inicio_cliente');
        showToast("💖 ¡Gracias por tu visita! Vuelve pronto.", "success");
    };

    // --- ACCESO CON CONTRASEÑA MODALES ---
    const handleRoleChangeAttempt = (e) => {
        const newRole = e.target.value;
        if (newRole === 'admin' || newRole === 'empleado') {
            setPasswordModal({ isOpen: true, targetRole: newRole });
            setPasswordInput('');
        } else {
            setUserRole('cliente');
            setView('inicio_cliente');
            showToast("👁️ Cambiaste al Modo Cliente.", "info");
        }
    };

    const handlePasswordSubmit = (e) => {
        e.preventDefault();
        const role = passwordModal.targetRole;
        const requiredPassword = role === 'admin' ? 'admin123' : 'mesero123';

        if (passwordInput === requiredPassword) {
            setUserRole(role);
            setView(role === 'admin' ? 'admin' : 'mesas');
            setPasswordModal({ isOpen: false, targetRole: '' });
            showToast(`🔓 Acceso Concedido: Modo ${role === 'admin' ? 'Administrador' : 'Mesero'}.`, 'success');
        } else {
            showToast("❌ Contraseña incorrecta. Acceso denegado.", "danger");
        }
    };

    // Obtener estado del ticket activo del cliente
    const getClientTicketStatus = () => {
        if (!clientActiveTicketId) return null;
        const ticket = kitchenTickets.find(t => t.id === clientActiveTicketId);
        return ticket ? ticket.status : 'entregado'; // Si no se encuentra, asumimos que fue procesado por completo
    };

    const activeStatus = getClientTicketStatus();

    return (
        <div>
            {/* Animaciones CSS inyectadas */}
            <style>{`
                @keyframes slideIn { from { transform: translateX(120%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes scaleUp { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                @keyframes pulse-glow { 0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7); } 70% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(59, 130, 246, 0); } 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); } }
                .toast-enter { animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
                .modal-fade { animation: fadeIn 0.2s ease forwards; }
                .modal-scale { animation: scaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
                .spinner { border: 4px solid #f3f3f3; border-top: 4px solid #3b82f6; border-radius: 50%; width: 50px; height: 50px; animation: spin 1s linear infinite; margin: 0 auto; }
                
                /* Estilo de la barra de progreso */
                .stepper-container { display: flex; justify-content: space-between; align-items: center; position: relative; margin: 2rem 0; background: #f8fafc; padding: 1.5rem; borderRadius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
                .stepper-line { position: absolute; top: 43px; left: 10%; right: 10%; height: 4px; background: #e2e8f0; z-index: 1; }
                .stepper-line-active { position: absolute; top: 43px; left: 10%; height: 4px; background: #10b981; z-index: 2; transition: width 0.4s ease; }
                .step-item { display: flex; flex-direction: column; align-items: center; position: relative; z-index: 3; width: 20%; }
                .step-bubble { width: 36px; height: 36px; border-radius: 50%; background: #cbd5e1; border: 4px solid white; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 0.9rem; transition: all 0.3s ease; }
                .step-item.active .step-bubble { background: #3b82f6; color: white; animation: pulse-glow 2s infinite; }
                .step-item.completed .step-bubble { background: #10b981; color: white; }
                .step-label { font-size: 0.85rem; margin-top: 0.5rem; color: #64748b; font-weight: 500; text-align: center; }
                .step-item.active .step-label { color: #1e293b; font-weight: bold; }
                .step-item.completed .step-label { color: #10b981; }

                /* Tarjeta de crédito interactiva */
                .credit-card-preview { background: linear-gradient(135deg, #1e293b, #0f172a); color: white; border-radius: 12px; padding: 1.5rem; width: 100%; max-width: 320px; height: 180px; margin: 0 auto 1.5rem auto; display: flex; flex-direction: column; justify-content: space-between; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.3); text-align: left; }
                .card-chip { width: 40px; height: 30px; background: #f59e0b; border-radius: 6px; }
            `}</style>

            <nav className="navbar">
                <div className="navbar-brand">
                    <h1>🍽️ DineSync</h1>
                    <div className="nav-buttons">
                        {(userRole === 'admin' || userRole === 'empleado') && (
                            <>
                                <button className={view === 'mesas' ? 'active' : ''} onClick={() => setView('mesas')}>Punto de Venta</button>
                                <button className={view === 'cocina' ? 'active' : ''} onClick={() => setView('cocina')}>Cocina ({kitchenTickets.filter(t => t.status !== 'entregado').length})</button>
                                {userRole === 'admin' && <button className={view === 'admin' ? 'active' : ''} onClick={() => setView('admin')}>Admin Menú</button>}
                            </>
                        )}
                        {userRole === 'cliente' && (
                            <>
                                <button className={view === 'inicio_cliente' ? 'active' : ''} onClick={() => setView('inicio_cliente')}>Inicio</button>
                                <button className={view === 'reservar_cliente' ? 'active' : ''} onClick={() => setView('reservar_cliente')}>Reservar Mesa</button>
                                <button
                                    className={view === 'menu_cliente' ? 'active' : ''}
                                    onClick={() => {
                                        if (!clientTable) {
                                            showToast("⚠️ Por favor, reserva una mesa primero para poder pedir del menú.", "warning");
                                            setView('reservar_cliente');
                                        } else { setView('menu_cliente'); }
                                    }}
                                >Pedir Menú</button>
                            </>
                        )}
                    </div>
                </div>
                <div className="role-switch">
                    <select value={userRole} onChange={handleRoleChangeAttempt} style={{ padding: '0.5rem', borderRadius: '5px', cursor: 'pointer', outline: 'none' }}>
                        <option value="cliente">👁️ Modo Cliente</option>
                        <option value="empleado">👔 Modo Mesero</option>
                        <option value="admin">⚙️ Modo Admin</option>
                    </select>
                </div>
            </nav>

            <div className="container" style={{ paddingBottom: '2rem' }}>

                {/* === MONITOR DE ESTADO DEL PEDIDO (VISTA CLIENTE) === */}
                {userRole === 'cliente' && clientActiveTicketId && (
                    <div>
                        <h3 style={{ fontSize: '1.2rem', color: '#1e293b', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            🛰️ Seguimiento de tu Pedido: <span style={{ color: 'var(--primary)' }}>{clientTable?.number}</span>
                        </h3>
                        <div className="stepper-container">
                            {/* Línea de fondo */}
                            <div className="stepper-line"></div>
                            {/* Línea de progreso dinámico */}
                            <div className="stepper-line-active" style={{
                                width: activeStatus === 'recibido' ? '0%' :
                                    activeStatus === 'preparando' ? '27%' :
                                        activeStatus === 'listo' ? '54%' : '80%'
                            }}></div>

                            <div className={`step-item ${activeStatus === 'recibido' ? 'active' : 'completed'}`}>
                                <div className="step-bubble">📝</div>
                                <div className="step-label">Enviado</div>
                            </div>
                            <div className={`step-item ${activeStatus === 'preparando' ? 'active' : (activeStatus === 'listo' || activeStatus === 'entregado' ? 'completed' : '')}`}>
                                <div className="step-bubble">🍳</div>
                                <div className="step-label">Preparando</div>
                            </div>
                            <div className={`step-item ${activeStatus === 'listo' ? 'active' : (activeStatus === 'entregado' ? 'completed' : '')}`}>
                                <div className="step-bubble">🔔</div>
                                <div className="step-label">Listo</div>
                            </div>
                            <div className={`step-item ${activeStatus === 'entregado' ? 'completed' : ''}`}>
                                <div className="step-bubble">🍽️</div>
                                <div className="step-label">Entregado</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* === LANDING PAGE COMPLETA (INICIO CLIENTE) === */}
                {view === 'inicio_cliente' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
                        <div className="client-hero" style={{
                            backgroundImage: 'linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url(https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80)',
                            backgroundSize: 'cover', backgroundPosition: 'center', color: 'white', padding: '4rem 2rem', borderRadius: '12px', textAlign: 'center'
                        }}>
                            <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem', textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>Bienvenido a DineSync Restaurant</h2>
                            <p style={{ fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto 2rem auto' }}>La mejor experiencia gastronómica de la ciudad. Escanea, reserva tu mesa y ordena desde tu celular sin esperas.</p>
                            <button className="btn btn-primary" style={{ fontSize: '1.3rem', padding: '1rem 2.5rem', borderRadius: '30px', boxShadow: '0 4px 15px rgba(0,0,0,0.3)' }} onClick={() => setView('reservar_cliente')}>
                                Reservar mi Mesa Ahora
                            </button>
                        </div>

                        <div>
                            <h3 style={{ textAlign: 'center', fontSize: '2rem', marginBottom: '1.5rem', color: '#1e293b' }}>Nuestros Platillos Estrella ⭐</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
                                {menu.slice(0, 3).map(item => (
                                    <div key={item.id} style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', cursor: 'pointer', transition: 'transform 0.2s' }}
                                        onClick={() => showToast(`😋 ¿Te apetece ${item.name}? ¡Reserva una mesa arriba para poder ordenarlo!`, 'info')}>
                                        <img src={item.image} alt={item.name} style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
                                        <div style={{ padding: '1.5rem' }}>
                                            <h4 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>{item.name}</h4>
                                            <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1rem', height: '40px' }}>{item.description}</p>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--primary)' }}>${item.price.toFixed(2)}</span>
                                                <span style={{ color: '#f59e0b' }}>⭐ {item.rating}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* REVIEWS */}
                        <div style={{ background: '#f8fafc', padding: '3rem 2rem', borderRadius: '12px' }}>
                            <h3 style={{ textAlign: 'center', fontSize: '1.8rem', marginBottom: '2rem', color: '#1e293b' }}>Lo que dicen nuestros clientes</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                                {customerReviews.map(review => (
                                    <div key={review.id} style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                                        <div style={{ marginBottom: '0.5rem' }}>{review.stars}</div>
                                        <p style={{ fontStyle: 'italic', color: '#475569', marginBottom: '1rem' }}>" {review.comment} "</p>
                                        <p style={{ fontWeight: 'bold', color: '#1e293b' }}>- {review.author}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* FOOTER */}
                        <footer style={{ background: '#1e293b', color: '#cbd5e1', padding: '3rem 2rem', borderRadius: '12px', display: 'flex', flexWrap: 'wrap', gap: '2rem', justifyContent: 'space-between' }}>
                            <div style={{ flex: '1', minWidth: '250px' }}>
                                <h4 style={{ color: 'white', fontSize: '1.2rem', marginBottom: '1rem' }}>🍽️ DineSync Restaurant</h4>
                                <p style={{ lineHeight: '1.6' }}>Redefiniendo la forma de comer. Disfruta de la mejor calidad, pidiendo directo desde tu celular.</p>
                            </div>
                            <div style={{ flex: '1', minWidth: '250px' }}>
                                <h4 style={{ color: 'white', fontSize: '1.2rem', marginBottom: '1rem' }}>📍 Visítanos</h4>
                                <p>Av. Principal #1234, Centro Gastronómico.</p>
                                <p>Ciudad Capital, CP 90210</p>
                                <p><strong>Lunes a Domingo:</strong> 12:00 PM - 11:00 PM</p>
                            </div>
                            <div style={{ flex: '1', minWidth: '250px' }}>
                                <h4 style={{ color: 'white', fontSize: '1.2rem', marginBottom: '1rem' }}>📞 Contacto y Reservas</h4>
                                <p>Teléfono: +52 (55) 1234-5678</p>
                                <p>WhatsApp: +52 (55) 9876-5432</p>
                            </div>
                        </footer>
                    </div>
                )}

                {/* === RESERVA DE MESA === */}
                {view === 'reservar_cliente' && (
                    <div>
                        <div className="section-header">
                            <h2>Elige tu Mesa</h2>
                            {clientTable && <span style={{ color: 'white', background: 'var(--primary)', padding: '0.5rem 1rem', borderRadius: '20px', fontWeight: 'bold' }}>Mesa actual: {clientTable.number}</span>}
                        </div>
                        <p style={{ marginBottom: '1rem', color: '#64748b' }}>Selecciona una mesa disponible (Verde) para comenzar tu orden.</p>
                        <div className="tables-grid">
                            {tables.map(table => (
                                <div key={table.id} className={`table-card ${table.status}`} onClick={() => reserveTableAsClient(table)} style={{ opacity: table.status !== 'Disponible' ? 0.6 : 1, cursor: 'pointer' }}>
                                    <h3>{table.number}</h3>
                                    <p>{table.status === 'Disponible' ? 'Tocar para Reservar' : table.status.replace('_', ' ')}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* === MENÚ DEL CLIENTE === */}
                {view === 'menu_cliente' && (
                    <div>
                        <div className="section-header">
                            <h2>Nuestro Menú Digital</h2>
                            {clientTable ? (
                                <span style={{ background: 'var(--disponible)', color: 'white', padding: '0.5rem 1rem', borderRadius: '4px' }}>
                                    📍 Ordenando para: {clientTable.number}
                                </span>
                            ) : (
                                <span style={{ color: 'var(--ocupada)', fontWeight: 'bold' }}>⚠️ No has reservado una mesa</span>
                            )}
                        </div>

                        <div className="client-menu-grid" style={{ alignItems: 'flex-start' }}>
                            <div className="client-menu-items" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' }}>
                                {menu.map(item => {
                                    const cartItem = clientCart.find(c => c.id === item.id);
                                    const currentQuantity = cartItem ? cartItem.quantity : 0;

                                    return (
                                        <div key={item.id} className="client-menu-card" style={{ padding: '0', overflow: 'hidden' }}>
                                            <img src={item.image} alt={item.name} style={{ width: '100%', height: '160px', objectFit: 'cover' }} />
                                            <div style={{ padding: '1rem' }}>
                                                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem' }}>{item.name}</h4>
                                                <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '1rem', minHeight: '40px' }}>{item.description}</p>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                                    <span style={{ fontWeight: 'bold', color: 'var(--primary)', fontSize: '1.1rem' }}>${item.price.toFixed(2)}</span>
                                                    <span style={{ fontSize: '0.9rem', color: '#f59e0b' }}>⭐ {item.rating}</span>
                                                </div>

                                                {currentQuantity === 0 ? (
                                                    <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => updateCartQuantity(item, 1)}>Añadir a la orden</button>
                                                ) : (
                                                    <div className="quantity-controls" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <button className="btn btn-danger" style={{ padding: '0.3rem 1rem' }} onClick={() => updateCartQuantity(item, -1)}>-</button>
                                                        <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{currentQuantity}</span>
                                                        <button className="btn btn-primary" style={{ padding: '0.3rem 1rem' }} onClick={() => updateCartQuantity(item, 1)}>+</button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Panel lateral de Carrito */}
                            <div className="cart-panel" style={{ position: 'sticky', top: '20px' }}>
                                <h3>🛒 Mi Carrito</h3>
                                <div className="cart-items">
                                    {clientCart.length === 0 ? <p style={{ color: '#64748b', marginTop: '1rem' }}>Tu carrito está vacío.</p> : null}
                                    {clientCart.map((item, idx) => (
                                        <div key={idx} className="order-item" style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                                            <span><b>{item.quantity}x</b> {item.name}</span>
                                            <span style={{ fontWeight: 'bold' }}>${(item.price * item.quantity).toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="cart-total" style={{ fontSize: '1.2rem', marginTop: '1rem', marginBottom: '1rem' }}>
                                    <span>Subtotal Carrito:</span>
                                    <span>${clientCart.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}</span>
                                </div>
                                <button className="btn btn-success" style={{ width: '100%', fontSize: '1.1rem', padding: '1rem', marginBottom: '1rem' }} onClick={sendClientOrder}>
                                    Enviar Orden a Cocina 👩‍🍳
                                </button>

                                {/* NUEVA SECCIÓN: PAGAR CUENTA DESDE EL CLIENTE */}
                                {clientTable && (
                                    <div style={{ borderTop: '2px solid #e2e8f0', paddingTop: '1rem', marginTop: '1rem' }}>
                                        <h4 style={{ fontSize: '0.95rem', color: '#475569', marginBottom: '0.5rem' }}>¿Listo para salir?</h4>
                                        <button className="btn" style={{ width: '100%', background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', fontWeight: 'bold', fontSize: '1rem', padding: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} onClick={openPaymentGateway}>
                                            <span>💳 Pagar mi Cuenta</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* === PUNTO DE VENTA (MESEROS) === */}
                {view === 'mesas' && !selectedTable && (
                    <div>
                        <div className="section-header">
                            <h2>Mapa de Mesas (POS)</h2>
                            {userRole === 'admin' && <button className="btn btn-admin" onClick={addNewTable}>+ Agregar Nueva Mesa</button>}
                        </div>
                        <div className="tables-grid">
                            {tables.map(table => (
                                <div key={table.id} className={`table-card ${table.status}`} onClick={() => setSelectedTable(table)} style={{ cursor: 'pointer' }}>
                                    <h3>{table.number}</h3>
                                    <p>{table.status.replace('_', ' ')}</p>
                                    <small>{table.orders.length > 0 ? `${table.orders.reduce((sum, o) => sum + (o.quantity || 1), 0)} items` : ''}</small>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {view === 'mesas' && selectedTable && (
                    <div className="panel">
                        <div className="panel-header">
                            <h2>{selectedTable.number} - {selectedTable.status.replace('_', ' ')}</h2>
                            <div>
                                <select onChange={(e) => { updateTableStatus(selectedTable.id, e.target.value); setSelectedTable({ ...selectedTable, status: e.target.value }); }} value={selectedTable.status} style={{ padding: '0.5rem', marginRight: '1rem', borderRadius: '4px', cursor: 'pointer' }}>
                                    <option value="Disponible">Disponible</option>
                                    <option value="Ocupada">Ocupada</option>
                                    <option value="Reservada">Reservada</option>
                                    <option value="En_Limpieza">En Limpieza</option>
                                </select>
                                <button className="btn btn-danger" onClick={() => setSelectedTable(null)}>Cerrar Panel</button>
                            </div>
                        </div>
                        <div className="order-grid">
                            <div>
                                <h3>Menú Rápido</h3>
                                <div className="menu-list">
                                    {menu.map(item => (
                                        <div key={item.id} className="menu-item" style={{ display: 'flex', justifyContent: 'space-between', padding: '0.8rem' }}>
                                            <span>{item.name} - <b>${item.price.toFixed(2)}</b></span>
                                            <button className="btn btn-primary" style={{ padding: '0.2rem 0.5rem' }} onClick={() => addToOrderPOS(item)}>+ Agregar</button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <h3>Comanda Actual de la Mesa</h3>
                                <div className="current-order">
                                    {selectedTable.orders.length === 0 ? <p>Mesa sin pedidos.</p> : null}
                                    {selectedTable.orders.map((item, idx) => (
                                        <div key={idx} className="order-item" style={{ background: '#f8fafc', padding: '0.5rem', borderRadius: '4px' }}>
                                            <span><b>{item.quantity ? `${item.quantity}x ` : ''}</b>{item.name}</span>
                                            <span>${(item.price * (item.quantity || 1)).toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>
                                <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
                                    <button className="btn btn-primary" onClick={sendToKitchenPOS} style={{ flex: 1, padding: '1rem' }}>Enviar a Cocina</button>
                                    <button className="btn btn-success" onClick={generateBill} style={{ flex: 1, padding: '1rem' }}>Generar Recibo 🧾</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* === COCINA (KDS) ENRIQUECIDA CON ESTADOS DE SEGUIMIENTO === */}
                {view === 'cocina' && (
                    <div>
                        <h2>Pantalla de Cocina (KDS)</h2>
                        <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>Controla y cambia los estados de preparación en tiempo real.</p>
                        <div className="kitchen-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                            {kitchenTickets.filter(t => t.status !== 'entregado').length === 0 ? <p style={{ color: '#64748b' }}>No hay pedidos pendientes en preparación. ¡Buen trabajo! 👏</p> : null}
                            {kitchenTickets.map(ticket => {
                                if (ticket.status === 'entregado') return null; // No lo mostramos si ya está entregado

                                return (
                                    <div key={ticket.id} className="ticket" style={{
                                        background: ticket.status === 'recibido' ? '#fff9c4' : ticket.status === 'preparando' ? '#e0f2fe' : '#d1fae5',
                                        padding: '1.5rem', borderRadius: '8px',
                                        borderLeft: `6px solid ${ticket.status === 'recibido' ? '#f59e0b' : ticket.status === 'preparando' ? '#0ea5e9' : '#10b981'}`,
                                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                                    }}>
                                        <h3 style={{ borderBottom: '2px dashed #ccc', paddingBottom: '0.5rem', marginBottom: '1rem', fontSize: '1.2rem' }}>
                                            {ticket.tableNumber}
                                            <small style={{ float: 'right', color: '#666', fontSize: '0.8rem' }}>{ticket.time}</small>
                                        </h3>
                                        <ul style={{ marginLeft: '1.5rem', marginBottom: '1.5rem', fontSize: '1.1rem' }}>
                                            {ticket.items.map((item, idx) => (
                                                <li key={idx} style={{ marginBottom: '0.5rem' }}><b>{item.quantity ? `${item.quantity}x ` : ''}</b>{item.name}</li>
                                            ))}
                                        </ul>

                                        {/* Botones de cambio de estado interactivos */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            {ticket.status === 'recibido' && (
                                                <button className="btn" style={{ width: '100%', background: '#0ea5e9', color: 'white', fontWeight: 'bold' }} onClick={() => {
                                                    setKitchenTickets(kitchenTickets.map(t => t.id === ticket.id ? { ...t, status: 'preparando' } : t));
                                                    showToast(`🍳 Pedido de la ${ticket.tableNumber} en preparación.`, 'info');
                                                }}>
                                                    Empezar Preparación 🍳
                                                </button>
                                            )}
                                            {ticket.status === 'preparando' && (
                                                <button className="btn" style={{ width: '100%', background: '#10b981', color: 'white', fontWeight: 'bold' }} onClick={() => {
                                                    setKitchenTickets(kitchenTickets.map(t => t.id === ticket.id ? { ...t, status: 'listo' } : t));
                                                    showToast(`🔔 ¡Pedido de la ${ticket.tableNumber} está listo para ser recogido!`, 'success');
                                                }}>
                                                    Listo para Servir 🔔
                                                </button>
                                            )}
                                            {ticket.status === 'listo' && (
                                                <button className="btn" style={{ width: '100%', background: '#64748b', color: 'white', fontWeight: 'bold' }} onClick={() => {
                                                    setKitchenTickets(kitchenTickets.map(t => t.id === ticket.id ? { ...t, status: 'entregado' } : t));
                                                    showToast(`🍽️ Comida entregada al cliente por el mesero.`, 'success');
                                                }}>
                                                    Marcar como Entregado 🍽️
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* === ADMIN MENÚ === */}
                {view === 'admin' && userRole === 'admin' && (
                    <div>
                        <div className="section-header"><h2>Gestión de Menú</h2></div>
                        <form className="admin-form" onSubmit={addMenuItem} style={{ background: 'white', padding: '2rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginBottom: '2rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                <input name="name" type="text" placeholder="Nombre del platillo..." required style={{ padding: '0.8rem' }} />
                                <input name="price" type="number" step="0.01" placeholder="Precio ($)" required style={{ padding: '0.8rem' }} />
                            </div>
                            <input name="description" type="text" placeholder="Descripción breve del platillo..." style={{ width: '100%', padding: '0.8rem', marginBottom: '1rem' }} />
                            <input name="image" type="url" placeholder="URL de la imagen (Opcional)..." style={{ width: '100%', padding: '0.8rem', marginBottom: '1rem' }} />
                            <button type="submit" className="btn btn-admin" style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }}>Añadir Platillo al Menú</button>
                        </form>
                    </div>
                )}
            </div>

            {/* === SISTEMA DE TOAST NOTIFICATIONS === */}
            <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '10px', pointerEvents: 'none' }}>
                {toasts.map(toast => {
                    let bgColor = '#10b981';
                    if (toast.type === 'warning') bgColor = '#f59e0b';
                    if (toast.type === 'danger') bgColor = '#ef4444';
                    if (toast.type === 'info') bgColor = '#3b82f6';

                    return (
                        <div key={toast.id} className="toast-enter" style={{
                            backgroundColor: bgColor, color: 'white', padding: '1rem 1.5rem', borderRadius: '8px',
                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.2)', display: 'flex', alignItems: 'center', gap: '12px',
                            minWidth: '280px', maxWidth: '400px', fontSize: '0.95rem', fontWeight: '500', pointerEvents: 'auto'
                        }}>
                            <span style={{ flex: 1 }}>{toast.message}</span>
                            <button onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.2rem', fontWeight: 'bold', padding: 0 }}>&times;</button>
                        </div>
                    );
                })}
            </div>

            {/* === MODAL DE PASARELA DE PAGO CLIENTE === */}
            {paymentModal.isOpen && (
                <div className="modal-fade" style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(15, 23, 42, 0.8)', zIndex: 9998, display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(4px)'
                }}>
                    <div className="modal-scale" style={{
                        background: 'white', padding: '2rem', borderRadius: '16px', width: '95%', maxWidth: '420px',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', textAlign: 'center'
                    }}>

                        {/* PASO 1: FORMULARIO DE PAGO */}
                        {paymentStep === 'form' && (
                            <div>
                                <h3 style={{ fontSize: '1.5rem', color: '#1e293b', marginBottom: '0.5rem' }}>🔒 Pago Seguro</h3>
                                <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                                    Monto total de la cuenta (con Impuestos & Servicio): <b style={{ color: '#10b981', fontSize: '1.1rem' }}>${paymentModal.total.toFixed(2)}</b>
                                </p>

                                {/* Tarjeta Virtual Animada */}
                                <div className="credit-card-preview">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div className="card-chip"></div>
                                        <span style={{ fontSize: '1.1rem', fontWeight: 'bold', fontStyle: 'italic', opacity: 0.8 }}>DineSync Card</span>
                                    </div>
                                    <div style={{ fontSize: '1.25rem', letterSpacing: '2px', fontFamily: 'monospace', margin: '1rem 0' }}>
                                        {cardDetails.number || '•••• •••• •••• ••••'}
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                                        <div>
                                            <div style={{ fontSize: '0.6rem', opacity: 0.6 }}>Titular</div>
                                            <div>{cardDetails.name || 'NOMBRE COMPLETO'}</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.6rem', opacity: 0.6 }}>Vence</div>
                                            <div>{cardDetails.expiry || 'MM/AA'}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Formulario */}
                                <form onSubmit={processPaymentSubmit} style={{ textAlign: 'left' }}>
                                    <div style={{ marginBottom: '1rem' }}>
                                        <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#475569' }}>Número de Tarjeta</label>
                                        <input type="text" placeholder="4152 8291 0023 9948" value={cardDetails.number} onChange={handleCardNumberChange} required style={{ width: '100%', padding: '0.7rem', border: '1px solid #cbd5e1', borderRadius: '6px', marginTop: '0.2rem' }} />
                                    </div>
                                    <div style={{ marginBottom: '1rem' }}>
                                        <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#475569' }}>Nombre en la Tarjeta</label>
                                        <input type="text" placeholder="Juan Pérez" value={cardDetails.name} onChange={(e) => setCardDetails({ ...cardDetails, name: e.target.value.toUpperCase() })} required style={{ width: '100%', padding: '0.7rem', border: '1px solid #cbd5e1', borderRadius: '6px', marginTop: '0.2rem' }} />
                                    </div>
                                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                                        <div style={{ flex: 1 }}>
                                            <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#475569' }}>Vencimiento</label>
                                            <input type="text" placeholder="12/28" value={cardDetails.expiry} onChange={handleExpiryChange} required style={{ width: '100%', padding: '0.7rem', border: '1px solid #cbd5e1', borderRadius: '6px', marginTop: '0.2rem' }} />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#475569' }}>CVV</label>
                                            <input type="password" placeholder="***" maxLength="3" value={cardDetails.cvv} onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value.replace(/[^0-9]/gi, '') })} required style={{ width: '100%', padding: '0.7rem', border: '1px solid #cbd5e1', borderRadius: '6px', marginTop: '0.2rem' }} />
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        <button type="button" className="btn" style={{ flex: 1, background: '#e2e8f0', color: '#475569' }} onClick={() => setPaymentModal({ isOpen: false, total: 0 })}>Cancelar</button>
                                        <button type="submit" className="btn btn-success" style={{ flex: 1.5 }}>Procesar Pago ✔️</button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* PASO 2: PROCESANDO PAGO (SPINNER) */}
                        {paymentStep === 'processing' && (
                            <div style={{ padding: '2rem 0' }}>
                                <div className="spinner" style={{ marginBottom: '1.5rem' }}></div>
                                <h3 style={{ fontSize: '1.3rem', color: '#1e293b', marginBottom: '0.5rem' }}>Procesando Pago Seguro...</h3>
                                <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Estamos estableciendo conexión con tu entidad bancaria para la validación de fondos.</p>
                            </div>
                        )}

                        {/* PASO 3: ÉXITO */}
                        {paymentStep === 'success' && (
                            <div style={{ padding: '1rem 0' }}>
                                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
                                <h3 style={{ fontSize: '1.6rem', color: '#10b981', marginBottom: '0.5rem' }}>¡Pago Exitoso!</h3>
                                <p style={{ color: '#475569', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
                                    Se cargaron de manera segura <b>${paymentModal.total.toFixed(2)}</b> a tu tarjeta. Tu recibo electrónico se ha registrado con éxito.
                                </p>
                                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', textAlign: 'left', fontSize: '0.85rem', color: '#475569' }}>
                                    <div>🧾 <b>Referencia:</b> DS-{Date.now().toString().slice(-6)}</div>
                                    <div>📍 <b>Mesa:</b> {clientTable?.number}</div>
                                    <div>📅 <b>Fecha:</b> {new Date().toLocaleDateString()}</div>
                                </div>
                                <button className="btn btn-success" style={{ width: '100%', padding: '1rem' }} onClick={finishClientSession}>
                                    Salir y Finalizar Sesión 🏁
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* === MODAL DE CONTRASEÑA ADMIN/MESERO === */}
            {passwordModal.isOpen && (
                <div className="modal-fade" style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(15, 23, 42, 0.75)', zIndex: 9998, display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(4px)'
                }}>
                    <div className="modal-scale" style={{ background: 'white', padding: '2.5rem 2rem', borderRadius: '12px', width: '90%', maxWidth: '400px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', textAlign: 'center' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
                        <h3 style={{ fontSize: '1.5rem', color: '#1e293b', marginBottom: '0.5rem' }}>Acceso Restringido</h3>
                        <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Ingresa contraseña para ingresar como <b>{passwordModal.targetRole === 'admin' ? 'Administrador' : 'Mesero'}</b>.</p>
                        <form onSubmit={handlePasswordSubmit}>
                            <input type="password" placeholder="Escribe la contraseña..." value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} autoFocus required style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '8px', border: '2px solid #cbd5e1', fontSize: '1rem', marginBottom: '1.5rem', textAlign: 'center', outline: 'none' }} />
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button type="button" className="btn" style={{ flex: 1, background: '#e2e8f0', color: '#475569' }} onClick={() => setPasswordModal({ isOpen: false, targetRole: '' })}>Cancelar</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Entrar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* === MODAL DE TICKET DE COBRO (POS MESEROS) === */}
            {receiptModal.isOpen && receiptModal.data && (
                <div className="modal-fade" style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(15, 23, 42, 0.75)', zIndex: 9998, display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(4px)'
                }}>
                    <div className="modal-scale" style={{ background: 'white', padding: '2rem', borderRadius: '12px', width: '95%', maxWidth: '440px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
                        <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                            <span style={{ fontSize: '1.1rem', fontWeight: 'bold', letterSpacing: '2px', color: '#64748b' }}>🧾 RECIBO DE CUENTA (POS)</span>
                            <h3 style={{ fontSize: '1.8rem', color: '#1e293b', marginTop: '0.2rem' }}>{receiptModal.data.tableName}</h3>
                        </div>
                        <div style={{ borderTop: '2px dashed #cbd5e1', borderBottom: '2px dashed #cbd5e1', padding: '1rem 0', margin: '1rem 0', maxHeight: '180px', overflowY: 'auto' }}>
                            {receiptModal.data.orders.map((item, index) => (
                                <div key={index} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', marginBottom: '0.5rem' }}>
                                    <span><b style={{ color: 'var(--primary)' }}>{item.quantity}x</b> {item.name}</span>
                                    <span style={{ fontWeight: 'bold', color: '#1e293b' }}>${(item.price * item.quantity).toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.9rem', color: '#475569', marginBottom: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Subtotal:</span><span>${receiptModal.data.subtotal.toFixed(2)}</span></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>IVA (12%):</span><span>${receiptModal.data.tax.toFixed(2)}</span></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Servicio Sugerido (10%):</span><span>${receiptModal.data.tip.toFixed(2)}</span></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.3rem', fontWeight: 'bold', color: '#1e293b', borderTop: '1px solid #f1f5f9', paddingTop: '0.6rem', marginTop: '0.2rem' }}>
                                <span>TOTAL A COBRAR:</span><span style={{ color: '#10b981' }}>${receiptModal.data.total.toFixed(2)}</span>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button className="btn" style={{ flex: 1, background: '#f1f5f9', color: '#475569' }} onClick={() => setReceiptModal({ isOpen: false, data: null })}>Volver</button>
                            <button className="btn btn-success" style={{ flex: 2 }} onClick={confirmPaymentAndClearTable}>Registrar Cobro en Efectivo ✔️</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);