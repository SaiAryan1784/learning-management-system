
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './css/style.css'
import "./utils/datatables-setup";
import { BrandProvider } from './contexts/BrandContext';
ReactDOM.createRoot(document.getElementById('root')).render(

  // <React.StrictMode>
    <BrandProvider>
      <App />
    </BrandProvider>
  // </React.StrictMode>
)
