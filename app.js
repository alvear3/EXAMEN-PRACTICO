const { useState } = React;

const App = () => {
    // --- ESTADOS GLOBALES ---
    const [userRole, setUserRole] = useState('cliente'); // Iniciamos como cliente para que lo pruebes rápido
    const [view, setView] = useState('inicio_cliente'); // Vistas controladas por rol

    // Estados del POS (Mesas)
    const [selectedTable, setSelectedTable] = useState(null);
    const [tables, setTables] = useState([
        { id: 1, number: 'Mesa 1', status: 'Disponible', orders: [] },
        { id: 2, number: 'Mesa 2', status: 'Ocupada', orders: [{ name: 'Refresco', price: 2.50 }] },
        { id: 3, number: 'Mesa 3', status: 'Reservada', orders: [] },
        { id: 4, number: 'Mesa 4', status: 'En_Limpieza', orders: [] },
        { id: 5, number: 'Mesa 5', status: 'Disponible', orders: [] },
    ]);

    // Estado del Menú
    const [menu, setMenu] = useState([
        { id: 1, name: 'Hamburguesa Clásica', price: 8.50 },
        { id: 2, name: 'Pizza Margarita', price: 12.00 },
        { id: 3, name: 'Ensalada César', price: 7.00 },
        { id: 4, name: 'Refresco', price: 2.50 },
    ]);

    const [kitchenTickets, setKitchenTickets] = useState([]);

    // --- NUEVOS ESTADOS PARA EL CLIENTE ---
    const [clientTable, setClientTable] = useState(null); // Mesa que el cliente reservó
    const [clientCart, setClientCart] = useState([]);     // Carrito de compras del cliente

    // --- FUNCIONES LÓGICAS (EMPLEADO / ADMIN) ---
    const addNewTable = () => {
        const nextId = tables.length > 0 ? Math.max(...tables.map(t => t.id)) + 1 : 1;
        setTables([...tables, { id: nextId, number: `Mesa ${nextId}`, status: 'Disponible', orders: [] }]);
    };

    const updateTableStatus = (id, newStatus) => {
        setTables(tables.map(t => t.id === id ? { ...t, status: newStatus } : t));
    };

    const addToOrderPOS = (item) => {
        const updatedTables = tables.map(t => {
            if (t.id === selectedTable.id) return { ...t, orders: [...t.orders, item], status: 'Ocupada' };
            return t;
        });
        setTables(updatedTables);
        setSelectedTable(updatedTables.find(t => t.id === selectedTable.id));
    };

    const sendToKitchenPOS = () => {
        if (selectedTable.orders.length === 0) return alert("No hay pedidos para enviar.");
        const newTicket = { id: Date.now(), tableNumber: selectedTable.number, items: [...selectedTable.orders], time: new Date().toLocaleTimeString() };
        setKitchenTickets([...kitchenTickets, newTicket]);
        alert(`Comanda enviada a cocina para ${selectedTable.number}`);
    };

    const generateBill = () => {
        const subtotal = selectedTable.orders.reduce((sum, item) => sum + item.price, 0);
        const total = subtotal + (subtotal * 0.12) + (subtotal * 0.10);
        alert(`Cuenta cobrada. Total: $${total.toFixed(2)}`);

        setTables(tables.map(t => t.id === selectedTable.id ? { ...t, status: 'En_Limpieza', orders: [] } : t));
        setSelectedTable(null);
    };

    const addMenuItem = (e) => {
        e.preventDefault();
        const name = e.target.elements.name.value;
        const price = parseFloat(e.target.elements.price.value);
        if (!name || !price) return;
        setMenu([...menu, { id: Date.now(), name, price }]);
        e.target.reset();
    };

    // --- FUNCIONES LÓGICAS (CLIENTE) ---
    const reserveTableAsClient = (table) => {
        if (table.status !== 'Disponible') return alert("Esta mesa no está disponible.");

        // Reservamos la mesa en el sistema global
        setTables(tables.map(t => t.id === table.id ? { ...t, status: 'Reservada' } : t));
        // Asignamos la mesa al cliente actual
        setClientTable({ ...table, status: 'Reservada' });
        alert(`¡Has reservado la ${table.number} exitosamente!`);
        setView('menu_cliente'); // Lo mandamos al menú
    };

    const addToClientCart = (item) => {
        setClientCart([...clientCart, item]);
    };

    const sendClientOrder = () => {
        if (!clientTable) return alert("Debes reservar una mesa primero.");
        if (clientCart.length === 0) return alert("Tu carrito está vacío.");

        // Agregamos los items del carrito a la mesa en el sistema global (POS)
        const updatedTables = tables.map(t => {
            if (t.id === clientTable.id) {
                return { ...t, orders: [...t.orders, ...clientCart], status: 'Ocupada' };
            }
            return t;
        });
        setTables(updatedTables);

        // Enviamos el ticket a la cocina automáticamente
        const newTicket = {
            id: Date.now(),
            tableNumber: clientTable.number,
            items: [...clientCart],
            time: new Date().toLocaleTimeString()
        };
        setKitchenTickets([...kitchenTickets, newTicket]);

        // Limpiamos carrito y actualizamos el estado local del cliente
        setClientCart([]);
        alert("¡Tu pedido ha sido enviado a la cocina! En breve te atenderemos.");
    };

    // Función para manejar el cambio de roles y resetear las vistas correctamente
    const handleRoleChange = (e) => {
        const newRole = e.target.value;
        setUserRole(newRole);
        if (newRole === 'cliente') {
            setView('inicio_cliente');
        } else {
            setView('mesas');
        }
    };

    // --- RENDERIZADO VISUAL ---
    return (
        <div>
            {/* Navegación Superior Dinámica */}
            <nav className="navbar">
                <div className="navbar-brand">
                    <h1>DineSync</h1>
                    <div className="nav-buttons">
                        {/* Botones para Empleado/Admin */}
                        {(userRole === 'admin' || userRole === 'empleado') && (
                            <>
                                <button className={view === 'mesas' ? 'active' : ''} onClick={() => setView('mesas')}>Punto de Venta</button>
                                <button className={view === 'cocina' ? 'active' : ''} onClick={() => setView('cocina')}>Cocina ({kitchenTickets.length})</button>
                                {userRole === 'admin' && (
                                    <button className={view === 'admin' ? 'active' : ''} onClick={() => setView('admin')}>Admin Menú</button>
                                )}
                            </>
                        )}

                        {/* Botones para Cliente */}
                        {userRole === 'cliente' && (
                            <>
                                <button className={view === 'inicio_cliente' ? 'active' : ''} onClick={() => setView('inicio_cliente')}>Inicio</button>
                                <button className={view === 'reservar_cliente' ? 'active' : ''} onClick={() => setView('reservar_cliente')}>Reservar Mesa</button>
                                <button className={view === 'menu_cliente' ? 'active' : ''} onClick={() => setView('menu_cliente')}>Pedir Menú</button>
                            </>
                        )}
                    </div>
                </div>

                {/* Selector de Modo */}
                <div className="role-switch">
                    <span>👤 Ver plataforma como:</span>
                    <select value={userRole} onChange={handleRoleChange}>
                        <option value="cliente">Cliente (Consumidor)</option>
                        <option value="empleado">Empleado / Mesero</option>
                        <option value="admin">Administrador</option>
                    </select>
                </div>
            </nav>

            <div className="container">
                {/* ================= VISTAS DEL CLIENTE ================= */}
                {view === 'inicio_cliente' && (
                    <div className="client-hero">
                        <h2>Bienvenido a DineSync Restaurant</h2>
                        <p>La mejor experiencia gastronómica al alcance de tu mano. Reserva tu mesa y ordena sin esperas.</p>
                        <button className="btn btn-primary" style={{ fontSize: '1.2rem', padding: '1rem 2rem' }} onClick={() => setView('reservar_cliente')}>
                            Comenzar mi Reserva
                        </button>
                    </div>
                )}

                {view === 'reservar_cliente' && (
                    <div>
                        <div className="section-header">
                            <h2>Elige tu Mesa</h2>
                            {clientTable && <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>Mesa actual: {clientTable.number}</span>}
                        </div>
                        <p style={{ marginBottom: '1rem', color: '#64748b' }}>Selecciona una mesa disponible (Verde) para comenzar tu orden.</p>
                        <div className="tables-grid">
                            {tables.map(table => (
                                <div
                                    key={table.id}
                                    className={`table-card ${table.status}`}
                                    onClick={() => reserveTableAsClient(table)}
                                    style={{ opacity: table.status !== 'Disponible' ? 0.6 : 1 }}
                                >
                                    <h3>{table.number}</h3>
                                    <p>{table.status === 'Disponible' ? 'Tocar para Reservar' : table.status.replace('_', ' ')}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {view === 'menu_cliente' && (
                    <div>
                        <div className="section-header">
                            <h2>Menú Digital</h2>
                            {clientTable ? (
                                <span style={{ background: 'var(--disponible)', color: 'white', padding: '0.5rem 1rem', borderRadius: '4px' }}>
                                    Ordenando para: {clientTable.number}
                                </span>
                            ) : (
                                <span style={{ color: 'var(--ocupada)', fontWeight: 'bold' }}>⚠️ No has reservado una mesa</span>
                            )}
                        </div>

                        <div className="client-menu-grid">
                            {/* Catálogo de Platillos */}
                            <div className="client-menu-items">
                                {menu.map(item => (
                                    <div key={item.id} className="client-menu-card">
                                        <h4>{item.name}</h4>
                                        <p>${item.price.toFixed(2)}</p>
                                        <button className="btn btn-primary" onClick={() => addToClientCart(item)}>Agregar al carrito</button>
                                    </div>
                                ))}
                            </div>

                            {/* Carrito de Compras */}
                            <div className="cart-panel">
                                <h3>Mi Orden</h3>
                                <div className="cart-items">
                                    {clientCart.length === 0 ? <p style={{ color: '#64748b', marginTop: '1rem' }}>Tu carrito está vacío.</p> : null}
                                    {clientCart.map((item, idx) => (
                                        <div key={idx} className="order-item">
                                            <span>{item.name}</span>
                                            <span>${item.price.toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="cart-total">
                                    <span>Total Estimado:</span>
                                    <span>${clientCart.reduce((sum, item) => sum + item.price, 0).toFixed(2)}</span>
                                </div>
                                <button className="btn btn-success" style={{ width: '100%', fontSize: '1.1rem' }} onClick={sendClientOrder}>
                                    Enviar Orden a Cocina
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ================= VISTAS DE EMPLEADO / ADMIN ================= */}
                {view === 'mesas' && !selectedTable && (
                    <div>
                        <div className="section-header">
                            <h2>Mapa de Mesas (POS)</h2>
                            {userRole === 'admin' && (
                                <button className="btn btn-admin" onClick={addNewTable}>+ Agregar Nueva Mesa</button>
                            )}
                        </div>
                        <div className="tables-grid">
                            {tables.map(table => (
                                <div key={table.id} className={`table-card ${table.status}`} onClick={() => setSelectedTable(table)}>
                                    <h3>{table.number}</h3>
                                    <p>{table.status.replace('_', ' ')}</p>
                                    <small>{table.orders.length > 0 ? `${table.orders.length} items` : ''}</small>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Panel de detalle para el mesero */}
                {view === 'mesas' && selectedTable && (
                    <div className="panel">
                        <div className="panel-header">
                            <h2>{selectedTable.number} - {selectedTable.status.replace('_', ' ')}</h2>
                            <div>
                                <select
                                    onChange={(e) => { updateTableStatus(selectedTable.id, e.target.value); setSelectedTable({ ...selectedTable, status: e.target.value }); }}
                                    value={selectedTable.status}
                                    style={{ padding: '0.5rem', marginRight: '1rem' }}
                                >
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
                                <h3>Menú (Añadir a cuenta)</h3>
                                <div className="menu-list">
                                    {menu.map(item => (
                                        <div key={item.id} className="menu-item">
                                            <span>{item.name} - ${item.price.toFixed(2)}</span>
                                            <button onClick={() => addToOrderPOS(item)}>Agregar</button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <h3>Comanda Actual de la Mesa</h3>
                                <div className="current-order">
                                    {selectedTable.orders.length === 0 ? <p>Mesa sin pedidos.</p> : null}
                                    {selectedTable.orders.map((item, idx) => (
                                        <div key={idx} className="order-item">
                                            <span>{item.name}</span>
                                            <span>${item.price.toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>
                                <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
                                    <button className="btn btn-primary" onClick={sendToKitchenPOS} style={{ flex: 1 }}>Enviar a Cocina</button>
                                    <button className="btn btn-success" onClick={generateBill} style={{ flex: 1 }}>Cobrar y Liberar</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Pantalla de Cocina */}
                {view === 'cocina' && (
                    <div>
                        <h2>Pantalla de Cocina (KDS)</h2>
                        <div className="kitchen-grid" style={{ marginTop: '1.5rem' }}>
                            {kitchenTickets.length === 0 ? <p>No hay pedidos pendientes.</p> : null}
                            {kitchenTickets.map(ticket => (
                                <div key={ticket.id} className="ticket">
                                    <h3>{ticket.tableNumber} <small style={{ float: 'right' }}>{ticket.time}</small></h3>
                                    <ul style={{ marginLeft: '1.5rem', marginBottom: '1rem' }}>
                                        {ticket.items.map((item, idx) => (
                                            <li key={idx}>{item.name}</li>
                                        ))}
                                    </ul>
                                    <button className="btn btn-success" style={{ width: '100%' }}
                                        onClick={() => setKitchenTickets(kitchenTickets.filter(t => t.id !== ticket.id))}>
                                        Marcar como Listo
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Administración de Menú */}
                {view === 'admin' && userRole === 'admin' && (
                    <div>
                        <div className="section-header">
                            <h2>Gestión de Menú (Solo Administradores)</h2>
                        </div>
                        <form className="admin-form" onSubmit={addMenuItem}>
                            <input name="name" type="text" placeholder="Nombre del platillo..." required />
                            <input name="price" type="number" step="0.01" placeholder="Precio ($)" required />
                            <button type="submit" className="btn btn-admin">Añadir Platillo al Menú</button>
                        </form>

                        <div className="menu-list" style={{ height: 'auto' }}>
                            {menu.map(item => (
                                <div key={item.id} className="menu-item">
                                    <span style={{ fontWeight: 'bold' }}>{item.name}</span>
                                    <span>${item.price.toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);