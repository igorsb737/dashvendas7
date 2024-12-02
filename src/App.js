import React, { useEffect, useState } from 'react';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue } from 'firebase/database';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import GaugeChart from 'react-gauge-chart';
import Admin from './components/Admin';
import './App.css';

const firebaseConfig = {
  apiKey: "AIzaSyBW2knRHudhcErerCZikearHc2gy7y-fJA",
  authDomain: "dashsales-e04da.firebaseapp.com",
  databaseURL: "https://dashsales-e04da-default-rtdb.firebaseio.com",
  projectId: "dashsales-e04da",
  storageBucket: "dashsales-e04da.firebaseapp.com",
  messagingSenderId: "738065507457",
  appId: "1:738065507457:web:e53244a8831d62faa29980"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

function Dashboard() {
  const [vendedores, setVendedores] = useState({});
  const [metas, setMetas] = useState({});
  const [senha, setSenha] = useState('');
  const [autenticado, setAutenticado] = useState(false);
  const [erro, setErro] = useState('');

  const verificarSenha = (e) => {
    e.preventDefault();
    if (senha === 'user9898') {
      setAutenticado(true);
      setErro('');
    } else {
      setErro('Senha incorreta');
    }
  };

  const calcularPorcentagem = (vendedor) => {
    const vendas = vendedores[vendedor] || 0;
    const meta = metas[vendedor] || 0;
    if (meta === 0) return 0;
    return (vendas / meta);  // Retorna valor entre 0 e 1 para o GaugeChart
  };

  useEffect(() => {
    if (!autenticado) return;

    // Carregar metas
    const metasRef = ref(database, 'metas');
    onValue(metasRef, (snapshot) => {
      const metasData = snapshot.val() || {};
      setMetas(metasData);
    });

    const vendedoresRef = ref(database, 'users');
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

  if (!autenticado) {
    return (
      <div className="App tema-escuro">
        <div className="login-container">
          <h2>Login Dashboard</h2>
          <form onSubmit={verificarSenha}>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Digite a senha"
              className="senha-input"
            />
            <button type="submit" className="login-button">Entrar</button>
            {erro && <p className="erro-mensagem">{erro}</p>}
          </form>
        </div>
      </div>
    );
  }

  // Ordenar vendedores alfabeticamente
  const vendedoresOrdenados = Object.entries(vendedores).sort(([a], [b]) => 
    a.localeCompare(b, 'pt-BR')
  );

  return (
    <div className="App tema-escuro">
      <header className="App-header">
        <h1>Disque Camisetas</h1>
      </header>
      <main className="App-main">
        <div className="vendedores-grid">
          {vendedoresOrdenados.map(([vendedor, total]) => {
            const porcentagem = calcularPorcentagem(vendedor);
            return (
              <div key={vendedor} className="vendedor-card">
                <h2>{vendedor.charAt(0).toUpperCase() + vendedor.slice(1)}</h2>
                <div className="gauge-wrapper">
                  <GaugeChart
                    id={`gauge-${vendedor}`}
                    nrOfLevels={20}
                    colors={["#FF5F6D", "#FFC371", "#2ECC71"]}
                    arcWidth={0.3}
                    cornerRadius={3}
                    percent={porcentagem}
                    hideText={true}
                    needleColor="#FF0000"
                    needleBaseColor="#FF0000"
                    animate={false}
                  />
                </div>
                <div className="gauge-value">
                  {(porcentagem * 100).toFixed(1)}%
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
