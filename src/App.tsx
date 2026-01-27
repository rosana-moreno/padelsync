import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import TournamentList from './pages/TournamentList';
import TournamentDetail from './pages/TournamentDetail';
import CreateTournament from './pages/CreateTournament';

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<TournamentList />} />
          <Route path="/tournament/new" element={<CreateTournament />} />
          <Route path="/tournament/:id" element={<TournamentDetail />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
