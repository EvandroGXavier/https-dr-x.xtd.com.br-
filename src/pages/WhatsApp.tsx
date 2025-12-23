import { Navigate } from 'react-router-dom';

export default function WhatsApp() {
  // Redirecionar para a versão Evolution
  return <Navigate to="/whatsapp/evolution" replace />;
}