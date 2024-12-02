import React, { useState, useEffect } from 'react';
import { getDatabase, ref, onValue, set } from 'firebase/database';
import { useNavigate } from 'react-router-dom';
import './Admin.css';

function Admin() {
    const [autenticado, setAutenticado] = useState(false);
    const [senha, setSenha] = useState('');
    const [erro, setErro] = useState('');
    const [vendedores, setVendedores] = useState({});
    const [metas, setMetas] = useState({});
    const navigate = useNavigate();

    const verificarSenha = (e) => {
        e.preventDefault();
        if (senha === 'adm9898') {
            setAutenticado(true);
            setErro('');
        } else {
            setErro('Senha incorreta');
        }
    };

    useEffect(() => {
        if (!autenticado) return;

        const database = getDatabase();
        const vendedoresRef = ref(database, 'users');
        const metasRef = ref(database, 'metas');

        // Carregar metas
        onValue(metasRef, (snapshot) => {
            const metasData = snapshot.val() || {};
            setMetas(metasData);
        });

        // Carregar vendas
        onValue(vendedoresRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const dataAtual = new Date();
                const mesAtual = dataAtual.getMonth();
                const anoAtual = dataAtual.getFullYear();

                const vendasPorVendedor = {};
                
                Object.values(data).forEach((venda) => {
                    const vendedor = venda.Vendedor?.toLowerCase();
                    if (vendedor && venda.Valor) {
                        let dataVenda;
                        if (venda.data) {
                            dataVenda = new Date(venda.data);
                            if (dataVenda.getMonth() !== mesAtual || dataVenda.getFullYear() !== anoAtual) {
                                return;
                            }
                        }

                        if (!vendasPorVendedor[vendedor]) {
                            vendasPorVendedor[vendedor] = 0;
                        }
                        vendasPorVendedor[vendedor] += Number(venda.Valor);
                    }
                });

                setVendedores(vendasPorVendedor);
            }
        });
    }, [autenticado]);

    const atualizarMeta = (vendedor, novaMeta) => {
        const database = getDatabase();
        const metaRef = ref(database, `metas/${vendedor}`);
        set(metaRef, Number(novaMeta));
    };

    const calcularPorcentagem = (vendedor) => {
        const vendas = vendedores[vendedor] || 0;
        const meta = metas[vendedor] || 0;
        if (meta === 0) return 0;
        return ((vendas / meta) * 100).toFixed(1);
    };

    if (!autenticado) {
        return (
            <div className="admin-login-container">
                <h2>Área Administrativa</h2>
                <form onSubmit={verificarSenha}>
                    <input
                        type="password"
                        value={senha}
                        onChange={(e) => setSenha(e.target.value)}
                        placeholder="Digite a senha"
                        className="admin-senha-input"
                    />
                    <button type="submit" className="admin-login-button">Entrar</button>
                    {erro && <p className="admin-erro-mensagem">{erro}</p>}
                </form>
            </div>
        );
    }

    // Ordenar vendedores alfabeticamente
    const vendedoresOrdenados = Object.keys(vendedores).sort((a, b) => 
        a.localeCompare(b, 'pt-BR')
    );

    return (
        <div className="admin-container">
            <header className="admin-header">
                <h1>Painel Administrativo</h1>
                <button onClick={() => navigate('/')} className="voltar-button">
                    Voltar ao Dashboard
                </button>
            </header>
            <div className="admin-grid">
                <div className="admin-table">
                    <table>
                        <thead>
                            <tr>
                                <th>Vendedor</th>
                                <th>Meta do Mês</th>
                                <th>Vendas Atuais</th>
                                <th>% Meta Atingida</th>
                            </tr>
                        </thead>
                        <tbody>
                            {vendedoresOrdenados.map((vendedor) => (
                                <tr key={vendedor}>
                                    <td>{vendedor.charAt(0).toUpperCase() + vendedor.slice(1)}</td>
                                    <td>
                                        <input
                                            type="number"
                                            value={metas[vendedor] || ''}
                                            onChange={(e) => atualizarMeta(vendedor, e.target.value)}
                                            className="meta-input"
                                            placeholder="Definir meta"
                                        />
                                    </td>
                                    <td>R$ {vendedores[vendedor].toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                    <td>{calcularPorcentagem(vendedor)}%</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default Admin;
